'use strict';

const {
  escapeHtml,
  sanitizePlainText,
  sanitizeRichText,
  sanitizeObject,
  stripHtml,
} = require('../../../src/layers/common/nodejs/middleware/sanitizer');

describe('sanitizer', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });
    
    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape less/greater than', () => {
      expect(escapeHtml('5 < 10 && 10 > 5')).toBe('5 &lt; 10 &amp;&amp; 10 &gt; 5');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(123)).toBe('123');
      expect(escapeHtml(true)).toBe('true');
    });

    it('should preserve safe text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
      expect(escapeHtml('Normal text here')).toBe('Normal text here');
    });
  });

  describe('sanitizePlainText', () => {
    it('should escape HTML in plain text', () => {
      expect(sanitizePlainText('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizePlainText('  hello world  ')).toBe('hello world');
    });

    it('should normalize unicode spaces', () => {
      expect(sanitizePlainText('hello\u00A0world')).toBe('hello world');
    });

    it('should handle empty/null input', () => {
      expect(sanitizePlainText('')).toBe('');
      expect(sanitizePlainText(null)).toBeNull();
      expect(sanitizePlainText(undefined)).toBeNull();
    });

    it('should sanitize name field', () => {
      expect(sanitizePlainText('<img src=x onerror=alert(1)>John')).toBe(
        '&lt;img src=x onerror=alert(1)&gt;John'
      );
    });

    it('should sanitize email-like strings', () => {
      expect(sanitizePlainText('user@<script>alert(1)</script>.com')).toBe(
        'user@&lt;script&gt;alert(1)&lt;/script&gt;.com'
      );
    });

    it('should handle long strings', () => {
      const longString = 'a'.repeat(10000) + '<script>' + 'b'.repeat(10000);
      const result = sanitizePlainText(longString);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('sanitizeRichText', () => {
    it('should allow safe HTML elements', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      expect(sanitizeRichText(input)).toBe(input);
    });

    it('should remove dangerous elements', () => {
      const input = '<p>Hello</script><script>alert("xss")</script></p>';
      expect(sanitizeRichText(input)).toBe('<p>Hello</script></p>');
    });

    it('should remove event handlers', () => {
      const input = '<p onclick="alert(1)" onload="alert(2)">Click me</p>';
      expect(sanitizeRichText(input)).toBe('<p>Click me</p>');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      expect(sanitizeRichText(input)).toBe('<a>Click</a>');
    });

    it('should allow safe URLs', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>';
      expect(sanitizeRichText(input)).toBe(input);
    });

    it('should allow data:image URLs', () => {
      const input = '<img src="data:image/png;base64,iVBORw0KGgo=" alt="test">';
      expect(sanitizeRichText(input)).toBe(input);
    });

    it('should remove style attributes with expressions', () => {
      const input = '<p style="background: expression(alert(1))">Text</p>';
      expect(sanitizeRichText(input)).toBe('<p>Text</p>');
    });

    it('should handle empty/null input', () => {
      expect(sanitizeRichText('')).toBe('');
      expect(sanitizeRichText(null)).toBeNull();
      expect(sanitizeRichText(undefined)).toBeNull();
    });

    it('should trim result', () => {
      expect(sanitizeRichText('  <p>Hello</p>  ')).toBe('<p>Hello</p>');
    });

    it('should handle nested elements', () => {
      const input = '<div><p><a href="/link">Click</a></p></div>';
      expect(sanitizeRichText(input)).toBe(input);
    });

    it('should remove iframe elements', () => {
      const input = '<iframe src="https://evil.com"></iframe>';
      expect(sanitizeRichText(input)).toBe('');
    });

    it('should remove object/embed elements', () => {
      const input = '<object data="evil.swf"></object><embed src="evil.swf">';
      expect(sanitizeRichText(input)).toBe('');
    });

    it('should remove form elements', () => {
      const input = '<form><input></form>';
      expect(sanitizeRichText(input)).toBe('');
    });

    it('should handle complex XSS attempts', () => {
      const attacks = [
        '<img src=x onerror="alert(String.fromCharCode(88,83,83))">',
        '<svg onload="alert(1)">',
        '<body onload="alert(1)">',
        '<input autofocus onfocus="alert(1)">',
        '<select autofocus onfocus="alert(1)">',
        '<textarea autofocus onfocus="alert(1)">',
        '<keygen autofocus onfocus="alert(1)">',
        '<video><source onerror="alert(1)">',
        '<audio><source onerror="alert(1)">',
        '<marquee onstart="alert(1)">',
        '<marquee loop=1 width=0 onfinish="alert(1)">',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeRichText(attack);
        expect(result).not.toMatch(/alert|onerror|onload|onfocus|onstart|onfinish/i);
      });
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string properties', () => {
      const input = {
        name: '<script>alert(1)</script>John',
        email: 'john@<script>alert(2)</script>.com',
      };
      const result = sanitizeObject(input);

      expect(result.name).toBe('&lt;script&gt;alert(1)&lt;/script&gt;John');
      expect(result.email).toBe('john@&lt;script&gt;alert(2)&lt;/script&gt;.com');
    });
    it('should handle deeply nested objects without stack overflow', () => {
      let obj = {};
      let current = obj;

      // create 1000-level deep object
      for (let i = 0; i < 1000; i++) {
        current.child = {};
        current = current.child;
      }

      expect(() => sanitizeObject(obj)).not.toThrow();
    });

    it('should prevent prototype pollution attacks', () => {
      const input = {
        "__proto__": { admin: true },
        "constructor": { prototype: { isAdmin: true } }
      };

      const result = sanitizeObject(input);

      // Ensure dangerous keys are not applied
      expect(result.__proto__).toBeUndefined();
      expect(result.constructor).not.toHaveProperty('prototype');

      // Ensure global object is not polluted
      const testObj = {};
      expect(testObj.admin).toBeUndefined();
      expect(testObj.isAdmin).toBeUndefined();
    });
    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<script>alert(1)</script>',
          profile: {
            bio: '<img onerror=alert(2)>',
          },
        },
      };
      const result = sanitizeObject(input);

      expect(result.user.name).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(result.user.profile.bio).toBe('&lt;img onerror=alert(2)&gt;');
    });
    it('should sanitize arrays of objects safely', () => {
      const input = [
        { name: '<script>alert(1)</script>' },
        { bio: '<img onerror=alert(2)>' },
        { safe: 'hello' }
      ];

      const result = sanitizeObject(input);

      expect(result[0].name).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(result[1].bio).toBe('&lt;img onerror=alert(2)&gt;');
      expect(result[2].safe).toBe('hello');
    
    });
    it('should handle arrays', () => {
      const input = ['<script>', '<img onerror=1>', 'safe'];
      const result = sanitizeObject(input);

      expect(result[0]).toBe('&lt;script&gt;');
      expect(result[1]).toBe('&lt;img onerror=1&gt;');
      expect(result[2]).toBe('safe');
    });

    it('should handle null/undefined values', () => {
      const input = {
        name: 'John',
        bio: null,
        age: undefined,
      };
      const result = sanitizeObject(input);

      expect(result.name).toBe('John');
      expect(result.bio).toBeNull();
      expect(result.age).toBeUndefined();
    });

    it('should handle empty object', () => {
      expect(sanitizeObject({})).toEqual({});
    });

    it('should handle non-object input', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
      expect(sanitizeObject('string')).toBe('string');
      expect(sanitizeObject(123)).toBe(123);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01');
      const input = { createdAt: date };
      const result = sanitizeObject(input);

      expect(result.createdAt).toEqual(date);
    });

    it('should handle circular references gracefully', () => {
      const input = { name: 'test' };
      input.self = input; // Circular

      // Should not throw
      expect(() => sanitizeObject(input)).not.toThrow();
    });

    it('should preserve numbers and booleans', () => {
      const input = {
        count: 42,
        active: true,
        score: 3.14,
      };
      const result = sanitizeObject(input);

      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.score).toBe(3.14);
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello');
      expect(stripHtml('<div><span>World</span></div>')).toBe('World');
    });

    it('should handle self-closing tags', () => {
      expect(stripHtml('Hello<br/>World')).toBe('Hello\nWorld');
      expect(stripHtml('A<hr>B')).toBe('A\nB');
    });

    it('should decode HTML entities', () => {
      expect(stripHtml('&lt;test&gt;')).toBe('<test>');
      expect(stripHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
      expect(stripHtml('&quot;quoted&quot;')).toBe('"quoted"');
      expect(stripHtml('It&apos;s')).toBe("It's");
    });

    it('should handle empty/null input', () => {
      expect(stripHtml('')).toBe('');
      expect(stripHtml(null)).toBe('');
      expect(stripHtml(undefined)).toBe('');
    });

    it('should handle plain text', () => {
      expect(stripHtml('Just plain text')).toBe('Just plain text');
    });

    it('should strip tags leaving content', () => {
      const result = stripHtml('<p>  Hello   World  </p>');
      expect(result).toBe('Hello   World'); // Whitespace preserved, just tags removed
    });
  });
});
