'use strict';

require('../../../helpers/mock-layer');
const { createAppSyncEvent } = require('../../../helpers/test-context');
const { getMocks } = require('../../../helpers/mock-layer');
const { handler } = require('../../../../src/core-modules/form-management/functions/handler');

const forms = require('./fixtures/forms.json');
const submissions = require('./fixtures/submissions.json');
const formRepo = () => getMocks().repos[0];
const submissionRepo = () => getMocks().repos[1];

beforeEach(() => {
  getMocks().publishEvent.mockClear();
  formRepo().findById.mockReset();
  formRepo().findMany.mockReset();
  formRepo().create.mockReset();
  formRepo().updateById.mockReset();
  submissionRepo().findById.mockReset();
  submissionRepo().findMany.mockReset();
  submissionRepo().create.mockReset();
});

describe('form-management handler', () => {
  describe('createForm', () => {
    it('returns created form', async () => {
      const created = { form_id: 'mock-id-01', title: 'New Form', status: 'draft', tenant_id: 't_test123' };
      formRepo().create.mockResolvedValue(created);
      const event = createAppSyncEvent('createForm', { input: { title: 'New Form' } });
      const result = await handler(event);
      expect(result).toMatchObject({ title: 'New Form', status: 'draft' });
    });
  });

  describe('getForm', () => {
    it('returns form when found', async () => {
      formRepo().findById.mockImplementation((ctx, id) =>
        Promise.resolve(forms.find((f) => f.form_id === id) || null)
      );
      const event = createAppSyncEvent('getForm', { form_id: 'form_fixture1' });
      const result = await handler(event);
      expect(result).toMatchObject({ form_id: 'form_fixture1', title: 'Feedback Form' });
    });
    it('returns error when form_id is missing', async () => {
      const event = createAppSyncEvent('getForm', {});
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('form_id');
    });
    it('returns error when form not found', async () => {
      formRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('getForm', { form_id: 'form_nonexistent' });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
    });
  });

  describe('listForms', () => {
    it('returns result from findMany', async () => {
      formRepo().findMany.mockResolvedValue({ items: forms, nextCursor: null });
      const event = createAppSyncEvent('listForms', {});
      const result = await handler(event);
      expect(result.items).toHaveLength(2);
    });
  });

  describe('publishForm', () => {
    it('updates status to published and publishes FormPublished event', async () => {
      const existing = forms[0];
      const updated = { ...existing, status: 'published' };
      formRepo().findById.mockResolvedValue(existing);
      formRepo().updateById.mockResolvedValue(updated);
      const event = createAppSyncEvent('publishForm', { form_id: 'form_fixture1' });
      const result = await handler(event);
      expect(result.status).toBe('published');
      expect(getMocks().publishEvent).toHaveBeenCalledWith('form-management', 'FormPublished', expect.objectContaining({ form_id: 'form_fixture1' }));
    });
    it('returns error when form_id is missing', async () => {
      const event = createAppSyncEvent('publishForm', {});
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('form_id');
    });
  });

  describe('submitForm', () => {
    it('creates submission and publishes FormSubmitted event', async () => {
      formRepo().findById.mockResolvedValue(forms[0]);
      const created = { submission_id: 'mock-id-01', form_id: 'form_fixture1', responses: [] };
      submissionRepo().create.mockResolvedValue(created);
      const event = createAppSyncEvent('submitForm', { input: { form_id: 'form_fixture1', responses: [] } });
      const result = await handler(event);
      expect(result).toMatchObject({ form_id: 'form_fixture1' });
      expect(getMocks().publishEvent).toHaveBeenCalledWith('form-management', 'FormSubmitted', expect.objectContaining({ form_id: 'form_fixture1' }));
    });
    it('returns error when form_id is missing', async () => {
      const event = createAppSyncEvent('submitForm', { input: {} });
      const result = await handler(event);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('form_id');
      expect(getMocks().publishEvent).not.toHaveBeenCalled();
    });
    it('returns error when form not found', async () => {
      formRepo().findById.mockResolvedValue(null);
      const event = createAppSyncEvent('submitForm', { input: { form_id: 'form_nonexistent' } });
      const result = await handler(event);
      expect(result.error.type).toBe('NOT_FOUND');
      expect(getMocks().publishEvent).not.toHaveBeenCalled();
    });
  });

  describe('listSubmissions', () => {
    it('returns items and nextCursor', async () => {
      submissionRepo().findMany.mockResolvedValue({ items: submissions, nextCursor: null });
      const event = createAppSyncEvent('listSubmissions', { form_id: 'form_fixture1' });
      const result = await handler(event);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].submission_id).toBe('sub_fixture1');
    });
  });
});
