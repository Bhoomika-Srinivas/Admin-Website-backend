const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard')
const { validate } = require('/opt/nodejs/middleware/input-validator')
const { withConnection } = require('/opt/nodejs/middleware/with-connection')
const { log } = require('/opt/nodejs/middleware/request-logger')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')

const { upsertCollegeProfileSchema } = require('../schemas/validation')
const CollegeProfile = require('../schemas/college.model')

const s3 = new S3Client({ region: process.env.AWS_REGION })
const BUCKET = process.env.BUCKET_NAME

async function getPresignedUrl(key) {
  if (!key) return null
  if (key.startsWith('http://') || key.startsWith('https://')) {
    try {
      const url = new URL(key)
      if (url.hostname.endsWith('amazonaws.com')) {
        const s3Key = url.hostname.startsWith(BUCKET + '.')
          ? url.pathname.slice(1)
          : url.pathname.slice(BUCKET.length + 2)
        if (s3Key) {
          const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key })
          return await getSignedUrl(s3, command, { expiresIn: 3600 })
        }
      }
    } catch {}
    return key
  }
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    return await getSignedUrl(s3, command, { expiresIn: 3600 })
  } catch (err) {
    console.error('Failed to generate presigned URL for key:', key, err.message)
    return null
  }
}

async function toCollegeProfileResponse(doc) {
  if (!doc) return null
  const plain = doc.toObject ? doc.toObject() : { ...doc }
  return {
    ...plain,
    logo_url: await getPresignedUrl(plain.logo_url),
  }
}

const handler = withConnection(async (event) => {
  const ctx = await resolveTenant(event)
  log(ctx, event.field)

  switch (event.field) {
    case 'getCollegeProfile': {
      requirePermission(ctx, 'college:profile:read')
      const doc = await CollegeProfile.findOne({ tenant_id: ctx.tenant_id }).lean()
      return toCollegeProfileResponse(doc)
    }

    case 'listColleges': {
      requirePermission(ctx, 'college:profile:read')
      const docs = await CollegeProfile.find({ tenant_id: ctx.tenant_id }).lean()
      return Promise.all(docs.map(toCollegeProfileResponse))
    }

    case 'upsertCollegeProfile': {
      requirePermission(ctx, 'college:profile:update')
      const input = validate(upsertCollegeProfileSchema, event.arguments.input)
      const doc = await CollegeProfile.findOneAndUpdate(
        { tenant_id: ctx.tenant_id },
        { $set: { ...input, created_by: ctx.user_id } },
        { upsert: true, new: true }
      )
      return toCollegeProfileResponse(doc)
    }

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
})

module.exports = { handler }
