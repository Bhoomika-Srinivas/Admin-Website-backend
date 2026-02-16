const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { validate } = require('/opt/nodejs/middleware/input-validator');
const { withConnection } = require('/opt/nodejs/middleware/with-connection');
const { withRetry } = require('/opt/nodejs/utils/retry');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { generateId } = require('/opt/nodejs/utils/id-generator');
const { MongoRepository } = require('/opt/nodejs/db/mongo-repository');
const { NotFoundError, ForbiddenError } = require('/opt/nodejs/middleware/error-handler');
const { normalizePagination } = require('/opt/nodejs/utils/pagination');
const {
  getUploadUrlSchema,
  getDownloadUrlSchema,
  deleteFileSchema,
  listFilesSchema,
} = require('../schemas/validation');

const FileMetadata = require('../schemas/file-metadata.model');
const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.BUCKET_NAME;
const fileRepo = new MongoRepository({ model: FileMetadata, primaryKey: 'file_id' });

async function handleEvent(event) {
  const ctx = resolveTenant(event);
  switch (event.field) {
    case 'getUploadUrl':
      await requirePermission(ctx, 'storage:file:upload');
      return await getUploadUrl(ctx, event.arguments);
    case 'getDownloadUrl':
      await requirePermission(ctx, 'storage:file:download');
      return await getDownloadUrl(ctx, event.arguments);
    case 'listFiles':
      await requirePermission(ctx, 'storage:file:list');
      return await listFiles(ctx, event.arguments);
    case 'deleteFile':
      await requirePermission(ctx, 'storage:file:delete');
      return await deleteFile(ctx, event.arguments);
    default:
      throw new Error(`Unknown field: ${event.field}`);
  }
}

exports.handler = withConnection(handleEvent);

function buildKey(ctx, fileId, module, entityId, ext) {
  return `${ctx.tenant_id}/${module || 'general'}/${entityId || 'misc'}/${fileId}${ext || ''}`;
}

async function getUploadUrl(ctx, args) {
  const validated = validate(getUploadUrlSchema, args || {});
  const module = validated.module || 'general';
  const entity_id = validated.entity_id || 'misc';
  const file_id = generateId();
  const ext = validated.extension ? (validated.extension.startsWith('.') ? validated.extension : `.${validated.extension}`) : '';
  const key = buildKey(ctx, file_id, module, entity_id, ext);
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key });
  const url = await withRetry(() => getSignedUrl(s3, command, { expiresIn: 3600 }));
  return { upload_url: url, key, file_id };
}

async function getDownloadUrl(ctx, args) {
  const { key } = validate(getDownloadUrlSchema, args || {});
  if (!ctx.tenant_id || !key.startsWith(ctx.tenant_id + '/')) {
    throw new ForbiddenError('Access denied to this file');
  }
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const url = await withRetry(() => getSignedUrl(s3, command, { expiresIn: 3600 }));
  return { download_url: url };
}

async function listFiles(ctx, args) {
  const validated = validate(listFilesSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  const filter = {};
  if (validated.module) filter.module = validated.module;
  if (validated.entity_id) filter.entity_id = validated.entity_id;
  const result = await fileRepo.findMany(ctx, filter, pagination);
  return { items: result.items, nextCursor: result.nextCursor };
}

async function deleteFile(ctx, args) {
  const { file_id } = validate(deleteFileSchema, args || {});
  const doc = await fileRepo.findById(ctx, file_id);
  if (!doc) throw new NotFoundError('File not found');
  await fileRepo.deleteById(ctx, file_id);
  return { success: true };
}
