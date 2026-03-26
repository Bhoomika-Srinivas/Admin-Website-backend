'use strict';

require('../../../helpers/mock-layer');
const { createAppSyncEvent } = require('../../../helpers/test-context');
const { getMocks } = require('../../../helpers/mock-layer');

/* ── Mock Mongoose models (used directly, not via MongoRepository) ── */
const mockHodFindOne         = jest.fn();
const mockHodFindOneAndUpdate = jest.fn();
const mockIntroFindOne         = jest.fn();
const mockIntroFindOneAndUpdate = jest.fn();
const mockAboutFindOne         = jest.fn();
const mockAboutFindOneAndUpdate = jest.fn();
const mockSwotFindOne         = jest.fn();
const mockSwotFindOneAndUpdate = jest.fn();
const mockBulkWrite           = jest.fn();

jest.mock('../../../../src/app-modules/dept-info-management/schemas/dept.info.model', () => ({
  DeptIntroduction:     { findOne: mockIntroFindOne,  findOneAndUpdate: mockIntroFindOneAndUpdate },
  DeptAbout:            { findOne: mockAboutFindOne,  findOneAndUpdate: mockAboutFindOneAndUpdate },
  DeptSwot:             { findOne: mockSwotFindOne,   findOneAndUpdate: mockSwotFindOneAndUpdate },
  HodProfile:           { findOne: mockHodFindOne,    findOneAndUpdate: mockHodFindOneAndUpdate },
  ProgramOutcome:       { bulkWrite: mockBulkWrite },
  CommitteeMember:      {},
  DistinguishedAlumnus: {},
}));

const { handler } = require('../../../../src/app-modules/dept-info-management/functions/handler');

beforeEach(() => {
  const mocks = getMocks();
  mocks.repos.forEach((repo) => {
    repo.findById?.mockReset?.();
    repo.findMany?.mockReset?.();
    repo.create?.mockReset?.();
    repo.updateById?.mockReset?.();
    repo.deleteById?.mockReset?.();
  });
  mocks.publishEvent?.mockClear?.();

  mockHodFindOne.mockReset();
  mockHodFindOneAndUpdate.mockReset();
  mockIntroFindOne.mockReset();
  mockIntroFindOneAndUpdate.mockReset();
  mockAboutFindOne.mockReset();
  mockAboutFindOneAndUpdate.mockReset();
  mockSwotFindOne.mockReset();
  mockSwotFindOneAndUpdate.mockReset();
  mockBulkWrite.mockReset();
});

/* ────────────────────────────────────────────────────────────────────
   getHodProfile
──────────────────────────────────────────────────────────────────── */
describe('getHodProfile', () => {
  it('returns the HOD profile when found', async () => {
    const doc = {
      deptId:         'DEP001',
      name:           'Dr. Jane Smith',
      message:        'Welcome to our department.',
      imageUrl:       'https://example.com/hod.jpg',
      title:          'Prof.',
      designation:    'Head of Department',
      qualification:  'Ph.D. Computer Science',
      experience:     '20 years',
      specialization: 'AI',
      profileSummary: 'Experienced academic.',
      email:          'hod@example.com',
      phone:          '+91-9999999999',
      cvUrl:          'https://example.com/cv.pdf',
      toObject: function () { return { ...this, toObject: undefined }; },
    };
    mockHodFindOne.mockResolvedValue(doc);

    const event  = createAppSyncEvent('getHodProfile', { deptId: 'DEP001' });
    const result = await handler(event);

    expect(mockHodFindOne).toHaveBeenCalledWith({ tenant_id: 't_test123', deptId: 'DEP001' });
    expect(result.deptId).toBe('DEP001');
    expect(result.name).toBe('Dr. Jane Smith');
    expect(result.message).toBe('Welcome to our department.');
    expect(result.imageUrl).toBe('https://example.com/hod.jpg');
  });

  it('returns default empty profile when no record exists', async () => {
    mockHodFindOne.mockResolvedValue(null);

    const event  = createAppSyncEvent('getHodProfile', { deptId: 'DEP001' });
    const result = await handler(event);

    expect(result.deptId).toBe('DEP001');
    expect(result.name).toBe('');
    expect(result.message).toBe('');
    expect(result.imageUrl).toBe('');
    expect(result.designation).toBe('Head of Department');
  });

  it('returns error when deptId is missing', async () => {
    const event  = createAppSyncEvent('getHodProfile', {});
    const result = await handler(event);

    expect(result.error).toBeDefined();
  });
});

/* ────────────────────────────────────────────────────────────────────
   saveHodProfile
──────────────────────────────────────────────────────────────────── */
describe('saveHodProfile', () => {
  it('upserts and returns the saved HOD profile', async () => {
    const saved = {
      deptId:         'DEP001',
      name:           'Dr. Jane Smith',
      message:        'Welcome.',
      imageUrl:       'https://example.com/hod.jpg',
      designation:    'Head of Department',
      qualification:  'Ph.D.',
      experience:     '20 years',
      specialization: 'AI',
      title:          'Prof.',
      profileSummary: '',
      email:          'hod@example.com',
      phone:          '',
      cvUrl:          '',
      toObject: function () { return { ...this, toObject: undefined }; },
    };
    mockHodFindOneAndUpdate.mockResolvedValue(saved);

    const event = createAppSyncEvent('saveHodProfile', {
      deptId: 'DEP001',
      input: {
        name:        'Dr. Jane Smith',
        message:     'Welcome.',
        imageUrl:    'https://example.com/hod.jpg',
        email:       'hod@example.com',
        designation: 'Head of Department',
      },
    });
    const result = await handler(event);

    expect(mockHodFindOneAndUpdate).toHaveBeenCalled();
    expect(result.deptId).toBe('DEP001');
    expect(result.name).toBe('Dr. Jane Smith');
    expect(result.message).toBe('Welcome.');

    const { publishEvent } = getMocks();
    expect(publishEvent).toHaveBeenCalledWith('dept-info', 'HodProfileSaved', expect.objectContaining({ deptId: 'DEP001' }));
  });

  it('returns error when deptId is missing', async () => {
    const event  = createAppSyncEvent('saveHodProfile', { input: { name: 'Dr. X' } });
    const result = await handler(event);

    expect(result.error).toBeDefined();
  });

  it('returns error when input is missing', async () => {
    const event  = createAppSyncEvent('saveHodProfile', { deptId: 'DEP001' });
    const result = await handler(event);

    expect(result.error).toBeDefined();
  });
});
