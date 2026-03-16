const { resolveTenant }     = require('/opt/nodejs/middleware/tenant-resolver')
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard')
const { validate }          = require('/opt/nodejs/middleware/input-validator')
const { withConnection }    = require('/opt/nodejs/middleware/with-connection')
const { log }               = require('/opt/nodejs/middleware/request-logger')

const {
  getInstituteSettingsSchema,
  saveInstituteSettingsSchema,
  getDeptBrandingSchema,
  saveDeptBrandingSchema,
} = require('../schemas/validation')

const {
  InstituteSettings,
  DeptBranding,
} = require('../schemas/dept.branding.model')

/* ─────────────────────────────
   Response Normalizers
─────────────────────────────*/

function toInstituteSettingsResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    instituteName:         plain.institute_name          ?? '',
    instituteLogoUrl:      plain.institute_logo          ?? '',
    defaultCopyrightText:  plain.default_copyright_text  ?? '',
    defaultWebsiteCredits: plain.default_website_credits ?? '',
  }
}

function toDeptBrandingResponse(doc) {
  const plain = doc && doc.toObject ? doc.toObject() : { ...doc }
  return {
    deptId:            plain.deptId             ?? '',
    departmentTitle:   plain.department_title   ?? '',
    departmentLogoUrl: plain.department_logo    ?? '',
    twitterUrl:        plain.twitter_url        ?? '',
    linkedinUrl:       plain.linkedin_url       ?? '',
    youtubeUrl:        plain.youtube_url        ?? '',
    emailContact:      plain.email_contact      ?? '',
    mapLocationLink:   plain.map_location_link  ?? '',
    fullAddress:       plain.full_address       ?? '',
    hodPhone:          plain.hod_phone          ?? '',
    hodEmail:          plain.hod_email          ?? '',
    departmentPhone:   plain.department_phone   ?? '',
    departmentFax:     plain.department_fax     ?? '',
    departmentEmail:   plain.department_email   ?? '',
    copyrightText:     plain.copyright_text     ?? '',
    websiteCredits:    plain.website_credits    ?? '',
  }
}

/* ─────────────────────────────
   Default empty shells
─────────────────────────────*/

function emptyInstituteSettings() {
  return {
    instituteName:         '',
    instituteLogoUrl:      '',
    defaultCopyrightText:  '',
    defaultWebsiteCredits: '',
  }
}

function emptyDeptBranding(deptId) {
  return {
    deptId,
    departmentTitle:   '',
    departmentLogoUrl: '',
    twitterUrl:        '',
    linkedinUrl:       '',
    youtubeUrl:        '',
    emailContact:      '',
    mapLocationLink:   '',
    fullAddress:       '',
    hodPhone:          '',
    hodEmail:          '',
    departmentPhone:   '',
    departmentFax:     '',
    departmentEmail:   '',
    copyrightText:     '',
    websiteCredits:    '',
  }
}

/* ─────────────────────────────
   Event Router
─────────────────────────────*/

async function handleEvent(event) {
  const ctx = resolveTenant(event)
  log(ctx, 'dept-branding', event.field)

  switch (event.field) {

    // ── InstituteSettings (singleton) ─────────────
    case 'getInstituteSettings':
      await requirePermission(ctx, 'dept-branding:institute-settings:read')
      return await getInstituteSettings(ctx, event.arguments)

    case 'saveInstituteSettings':
      await requirePermission(ctx, 'dept-branding:institute-settings:write')
      return await saveInstituteSettings(ctx, event.arguments)

    // ── DeptBranding (upsert per dept) ────────────
    case 'getDeptBranding':
      await requirePermission(ctx, 'dept-branding:branding:read')
      return await getDeptBranding(ctx, event.arguments)

    case 'saveDeptBranding':
      await requirePermission(ctx, 'dept-branding:branding:write')
      return await saveDeptBranding(ctx, event.arguments)

    default:
      throw new Error(`Unknown field: ${event.field}`)
  }
}

exports.handler = withConnection(handleEvent)


/* ─────────────────────────────
   InstituteSettings
   Singleton per tenant — no deptId.
─────────────────────────────*/

async function getInstituteSettings(ctx, args) {
  validate(getInstituteSettingsSchema, args || {})

  const doc = await InstituteSettings.findOne({ tenant_id: ctx.tenant_id }).lean()

  if (!doc) return emptyInstituteSettings()

  return toInstituteSettingsResponse(doc)
}

async function saveInstituteSettings(ctx, args) {
  const input = validate(saveInstituteSettingsSchema, args || {})
  const { instituteName, instituteLogoUrl, defaultCopyrightText, defaultWebsiteCredits } = input.input

  const setFields = { updated_by: ctx.user_id }

  if (instituteName         !== undefined) setFields.institute_name          = instituteName
  if (instituteLogoUrl      !== undefined) setFields.institute_logo          = instituteLogoUrl
  if (defaultCopyrightText  !== undefined) setFields.default_copyright_text  = defaultCopyrightText
  if (defaultWebsiteCredits !== undefined) setFields.default_website_credits = defaultWebsiteCredits

  const doc = await InstituteSettings.findOneAndUpdate(
    { tenant_id: ctx.tenant_id },
    { $set: setFields },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean()

  return toInstituteSettingsResponse(doc)
}


/* ─────────────────────────────
   DeptBranding
   Upsert per (tenant, deptId).
─────────────────────────────*/

async function getDeptBranding(ctx, args) {
  const { deptId } = validate(getDeptBrandingSchema, args || {})

  const doc = await DeptBranding.findOne({ tenant_id: ctx.tenant_id, deptId }).lean()

  if (!doc) return emptyDeptBranding(deptId)

  return toDeptBrandingResponse(doc)
}

async function saveDeptBranding(ctx, args) {
  const input = validate(saveDeptBrandingSchema, args || {})
  const { deptId, ...fields } = input.input

  const setFields = { updated_by: ctx.user_id }

  if (fields.departmentTitle  !== undefined) setFields.department_title  = fields.departmentTitle
  if (fields.departmentLogoUrl !== undefined) setFields.department_logo  = fields.departmentLogoUrl
  if (fields.twitterUrl       !== undefined) setFields.twitter_url       = fields.twitterUrl
  if (fields.linkedinUrl      !== undefined) setFields.linkedin_url      = fields.linkedinUrl
  if (fields.youtubeUrl       !== undefined) setFields.youtube_url       = fields.youtubeUrl
  if (fields.emailContact     !== undefined) setFields.email_contact     = fields.emailContact
  if (fields.mapLocationLink  !== undefined) setFields.map_location_link = fields.mapLocationLink
  if (fields.fullAddress      !== undefined) setFields.full_address      = fields.fullAddress
  if (fields.hodPhone         !== undefined) setFields.hod_phone         = fields.hodPhone
  if (fields.hodEmail         !== undefined) setFields.hod_email         = fields.hodEmail
  if (fields.departmentPhone  !== undefined) setFields.department_phone  = fields.departmentPhone
  if (fields.departmentFax    !== undefined) setFields.department_fax    = fields.departmentFax
  if (fields.departmentEmail  !== undefined) setFields.department_email  = fields.departmentEmail
  if (fields.copyrightText    !== undefined) setFields.copyright_text    = fields.copyrightText
  if (fields.websiteCredits   !== undefined) setFields.website_credits   = fields.websiteCredits

  const doc = await DeptBranding.findOneAndUpdate(
    { tenant_id: ctx.tenant_id, deptId },
    { $set: setFields },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean()

  return toDeptBrandingResponse(doc)
}
