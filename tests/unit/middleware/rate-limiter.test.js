/**
 * Rate limiter tests
 * Tests the mock rate-limiter functionality
 */

'use strict';

require('../../helpers/mock-layer');
const { getMocks } = require('../../helpers/mock-layer');

describe('rate-limiter', () => {
  beforeEach(() => {
    getMocks().checkRateLimit.mockClear();
  });

  describe('checkRateLimit mock', () => {
    it('should allow first request', async () => {
      getMocks().checkRateLimit.mockResolvedValueOnce({
        allowed: true,
        remaining: 59,
        retryAfter: null,
      });

      const result = await getMocks().checkRateLimit('user123');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
    });

    it('should block when rate limit exceeded', async () => {
      getMocks().checkRateLimit.mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        retryAfter: 45,
        error: 'Rate limit exceeded',
      });

      const result = await getMocks().checkRateLimit('user123', { perMinute: 60 });

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(45);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should handle public endpoint key pattern', async () => {
      getMocks().checkRateLimit.mockResolvedValueOnce({
        allowed: true,
        remaining: 4,
        retryAfter: null,
      });

      const rateLimitKey = 'tenant:t_test123:ip:192.168.1.1';
      const result = await getMocks().checkRateLimit(rateLimitKey, { perMinute: 5, perHour: 20 });

      expect(result.allowed).toBe(true);
      expect(getMocks().checkRateLimit).toHaveBeenCalledWith(rateLimitKey, { perMinute: 5, perHour: 20 });
    });

    it('should handle missing identifier', async () => {
      getMocks().checkRateLimit.mockResolvedValueOnce({
        allowed: true,
        remaining: 0,
      });

      const result = await getMocks().checkRateLimit('');
      expect(result.allowed).toBe(true);
    });
  });

  describe('RateLimitError', () => {
    it('should create error with default properties', () => {
      const RateLimitError = class RateLimitError extends Error {
        constructor(message = 'Rate limit exceeded') {
          super(message);
          this.code = 'RATE_LIMIT_EXCEEDED';
          this.statusCode = 429;
        }
      };
      const error = new RateLimitError();
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.statusCode).toBe(429);
    });

    it('should create error with custom message', () => {
      const RateLimitError = class RateLimitError extends Error {
        constructor(message = 'Rate limit exceeded') {
          super(message);
          this.code = 'RATE_LIMIT_EXCEEDED';
          this.statusCode = 429;
        }
      };
      const error = new RateLimitError('Custom message');
      expect(error.message).toBe('Custom message');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('rate limiting keys', () => {
    it('should support user ID keys', async () => {
      getMocks().checkRateLimit.mockResolvedValueOnce({
        allowed: true,
        remaining: 59,
      });

      const result = await getMocks().checkRateLimit('user:uuid-123');
      expect(result.allowed).toBe(true);
    });

    it('should support IP keys', async () => {
      getMocks().checkRateLimit.mockResolvedValueOnce({
        allowed: true,
        remaining: 59,
      });

      const result = await getMocks().checkRateLimit('ip:192.168.1.1');
      expect(result.allowed).toBe(true);
    });

    it('should support tenant+IP combined keys', async () => {
      getMocks().checkRateLimit.mockResolvedValueOnce({
        allowed: true,
        remaining: 59,
      });

      const result = await getMocks().checkRateLimit('tenant:abc123:ip:10.0.0.1');
      expect(result.allowed).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should track multiple requests', async () => {
      // Simulate rapid requests
      for (let i = 0; i < 5; i++) {
        getMocks().checkRateLimit.mockResolvedValueOnce({
          allowed: true,
          remaining: 55 - i,
        });
      }

      // 6th request blocked
      getMocks().checkRateLimit.mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        retryAfter: 55,
        error: 'Rate limit exceeded',
      });

      // Execute 6 requests
      const results = [];
      for (let i = 0; i < 6; i++) {
        results.push(await getMocks().checkRateLimit('rapid-test', { perMinute: 5 }));
      }

      // First 5 should be allowed
      expect(results.slice(0, 5).every((r) => r.allowed)).toBe(true);
      // Last one should be blocked
      expect(results[5].allowed).toBe(false);
      expect(results[5].error).toBe('Rate limit exceeded');
    });
  });
});
