'use strict';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mock-signed-url.example.com'),
}), { virtual: true });
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
}), { virtual: true });

require('../../../helpers/mock-layer');
const { createAppSyncEvent } = require('../../../helpers/test-context');
const { getMocks } = require('../../../helpers/mock-layer');
const { handler } = require('../../../../src/core-modules/storage-management/functions/handler');

const files = require('./fixtures/files.json');
const fileRepo = () => getMocks().repos[0];

beforeEach(() => {
  fileRepo().findById.mockReset();
  fileRepo().findMany.mockReset();
  fileRepo().deleteById.mockReset();
});

describe('storage-management handler', () => {
  describe('getUploadUrl', () => {
    it('returns upload_url, key, and file_id', async () => {
      const event = createAppSyncEvent('getUploadUrl', { module: 'form', entity_id: 'f_123', extension: 'pdf' });
      const result = await handler(event);
      expect(result).toMatchObject({
        upload_url: 'https://mock-signed-url.example.com',
        file_id: 'mock-id-01',
      });
      expect(result.key).toContain('t_test123');
      expect(result.key).toContain('form');
      expect(result.key).toContain('f_123');
    });
  });

  describe('getDownloadUrl', () => {
    it('returns download_url when key provided', async () => {
      const event = createAppSyncEvent('getDownloadUrl', { key: 't_test123/general/misc/f1.pdf' });
      const result = await handler(event);
      expect(result).toEqual({ download_url: 'https://mock-signed-url.example.com' });
    });
    it('returns error when key is missing', async () => {
      const event = createAppSyncEvent('getDownloadUrl', {});
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('key');
    });
  });

  describe('listFiles', () => {
    it('returns items and nextCursor', async () => {
      fileRepo().findMany.mockResolvedValue({ items: files, nextCursor: null });
      const event = createAppSyncEvent('listFiles', {});
      const result = await handler(event);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].file_id).toBe('f_fixture1');
    });
  });

  describe('deleteFile', () => {
    it('returns success when file exists', async () => {
      fileRepo().findById.mockResolvedValue(files[0]);
      fileRepo().deleteById.mockResolvedValue(true);
      const event = createAppSyncEvent('deleteFile', { file_id: 'f_fixture1' });
      const result = await handler(event);
      expect(result).toEqual({ success: true });
      expect(fileRepo().deleteById).toHaveBeenCalledWith(expect.any(Object), 'f_fixture1');
    });
    it('returns error when file_id is missing', async () => {
      const event = createAppSyncEvent('deleteFile', {});
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('file_id');
    });
    it('returns error when file not found', async () => {
      fileRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('deleteFile', { file_id: 'f_nonexistent' });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
      expect(fileRepo().deleteById).not.toHaveBeenCalled();
    });
  });
});
