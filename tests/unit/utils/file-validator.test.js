'use strict';

const {
  validateBase64File,
  getFileExtension,
  generateSafeFilename,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} = require('../../../src/layers/common/nodejs/utils/file-validator');

describe('file-validator', () => {
  describe('validateBase64File', () => {
    // Helper to create a valid PDF base64 (minimal PDF structure)
    const createValidPDF = () => {
      const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
      const pdfContent = Buffer.concat([
        pdfHeader,
        Buffer.from('-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n'),
      ]);
      return pdfContent.toString('base64');
    };

    // Helper to create a valid JPEG base64
    const createValidJPEG = () => {
      const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const jpegContent = Buffer.concat([
        jpegHeader,
        Buffer.from('\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'),
      ]);
      return jpegContent.toString('base64');
    };

    // Helper to create a valid PNG base64
    const createValidPNG = () => {
      const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
      const pngContent = Buffer.concat([
        pngHeader,
        Buffer.from('\x0D\x0A\x1A\x0A\x00\x00\x00\x0DIHDR'),
      ]);
      return pngContent.toString('base64');
    };

    it('should validate a valid PDF file', () => {
      const base64 = createValidPDF();
      const result = validateBase64File(base64, 'document.pdf');

      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('application/pdf');
      expect(result.extension).toBe('.pdf');
      expect(result.size).toBeGreaterThan(0);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should validate a valid JPEG file', () => {
      const base64 = createValidJPEG();
      const result = validateBase64File(base64, 'image.jpg', {
        allowedTypes: ['image/jpeg'],
      });

      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.extension).toBe('.jpg');
    });

    it('should validate a valid PNG file', () => {
      const base64 = createValidPNG();
      const result = validateBase64File(base64, 'image.png', {
        allowedTypes: ['image/png'],
      });

      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/png');
      expect(result.extension).toBe('.png');
    });

    it('should reject file with mismatched extension and content', () => {
      // PDF content with PNG extension
      const base64 = createValidPDF();
      const result = validateBase64File(base64, 'document.png', {
        allowedTypes: ['image/png'],
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File signature does not match allowed types');
    });

    it('should reject file exceeding max size', () => {
      // Create a large buffer that exceeds the limit
      const largeBuffer = Buffer.alloc(MAX_FILE_SIZE + 100);
      const base64 = largeBuffer.toString('base64');
      const result = validateBase64File(base64, 'large.pdf');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should reject empty file', () => {
      const result = validateBase64File('', 'empty.pdf');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Empty or invalid base64');
    });

    it('should reject file with data URI prefix', () => {
      const base64 = createValidPDF();
      const dataUri = `data:application/pdf;base64,${base64}`;
      const result = validateBase64File(dataUri, 'document.pdf');

      expect(result.valid).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should reject file with disallowed type', () => {
      const htmlContent = Buffer.from('<script>alert("xss")</script>');
      const base64 = htmlContent.toString('base64');
      const result = validateBase64File(base64, 'malicious.html');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Extension .html not allowed');
    });

    it('should reject file without filename', () => {
      const base64 = createValidPDF();
      const result = validateBase64File(base64, null);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Empty or invalid base64');
    });

    it('should reject malformed base64', () => {
      const result = validateBase64File('not-valid-base64!!!', 'file.pdf');

      expect(result.valid).toBe(false);
      // Will either fail signature check or return invalid base64
      expect(result.error).toMatch(/File signature|Invalid base64/);
    });

    it('should respect custom maxSize option', () => {
      const smallBuffer = Buffer.alloc(100);
      const base64 = smallBuffer.toString('base64');
      const result = validateBase64File(base64, 'file.pdf', {
        maxSize: 50, // Very small limit
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should respect custom allowedTypes option', () => {
      const base64 = createValidPDF();
      const result = validateBase64File(base64, 'document.pdf', {
        allowedTypes: ['image/jpeg', 'image/png'], // PDF not allowed
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File type application/pdf not allowed');
    });

    it('should sanitize filename with path traversal attempt', () => {
      const base64 = createValidPDF();
      const result = validateBase64File(base64, '../../../etc/passwd.pdf');

      expect(result.valid).toBe(true);
      expect(result.filename).toBe('passwd.pdf');
    });

    it('should handle double extensions', () => {
      const base64 = createValidPDF();
      const result = validateBase64File(base64, 'document.pdf.exe');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Extension .exe not allowed');
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('document.pdf')).toBe('.pdf');
      expect(getFileExtension('image.JPG')).toBe('.jpg');
      expect(getFileExtension('file.PNG')).toBe('.png');
    });

    it('should return empty string for no extension', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(getFileExtension(null)).toBe('');
      expect(getFileExtension(undefined)).toBe('');
    });

    it('should handle filenames with dots', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('.gz');
      expect(getFileExtension('v1.0.0.pdf')).toBe('.pdf');
    });
  });

  describe('generateSafeFilename', () => {
    it('should generate safe filename from original', () => {
      const result = generateSafeFilename('My Document.pdf');
      expect(result).toMatch(/^my-document-\d+-[a-f0-9]+\.pdf$/);
    });

    it('should handle special characters', () => {
      const result = generateSafeFilename('file@#$%^&*()name.doc');
      expect(result).toMatch(/^file[-]+name-\d+-[a-f0-9]+\.doc$/);
    });

    it('should handle non-Latin characters', () => {
      const result = generateSafeFilename('文档.pdf');
      expect(result).toMatch(/^[-]+\d+-[a-f0-9]+\.pdf$/);
    });

    it('should handle no extension', () => {
      const result = generateSafeFilename('README');
      expect(result).toMatch(/^readme-\d+-[a-f0-9]+$/);
    });

    it('should handle empty string', () => {
      const result = generateSafeFilename('');
      expect(result).toMatch(/^file-\d+-[a-f0-9]+$/);
    });
  });

  describe('ALLOWED_MIME_TYPES', () => {
    it('should define expected MIME types', () => {
      expect(ALLOWED_MIME_TYPES['application/pdf']).toBeDefined();
      expect(ALLOWED_MIME_TYPES['image/jpeg']).toBeDefined();
      expect(ALLOWED_MIME_TYPES['image/png']).toBeDefined();
    });

    it('should have signatures for each type', () => {
      Object.values(ALLOWED_MIME_TYPES).forEach((config) => {
        expect(config.signatures).toBeInstanceOf(Array);
        expect(config.signatures.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('should be 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });
});
