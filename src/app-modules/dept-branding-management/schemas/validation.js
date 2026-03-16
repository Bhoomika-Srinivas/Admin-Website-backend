const Joi = require("joi")

/* ─────────────────────────────
   DeptBranding Schemas
─────────────────────────────*/

const getDeptBrandingSchema = Joi.object({
  deptId: Joi.string().required()
})

const saveDeptBrandingSchema = Joi.object({
  deptId: Joi.string().required(),
  input:  Joi.object({
    // Header
    departmentTitle:   Joi.string().optional().allow(""),
    departmentLogoUrl: Joi.string().optional().allow(""),
    // Footer · Social
    twitterUrl:        Joi.string().optional().allow(""),
    linkedinUrl:       Joi.string().optional().allow(""),
    youtubeUrl:        Joi.string().optional().allow(""),
    emailContact:      Joi.string().email().optional().allow(""),
    mapLocationLink:   Joi.string().optional().allow(""),
    // Footer · Address
    fullAddress:       Joi.string().optional().allow(""),
    // Footer · Contact
    hodPhone:          Joi.string().optional().allow(""),
    hodEmail:          Joi.string().email().optional().allow(""),
    departmentPhone:   Joi.string().optional().allow(""),
    departmentFax:     Joi.string().optional().allow(""),
    departmentEmail:   Joi.string().email().optional().allow(""),
    // Footer · Credits
    copyrightText:     Joi.string().optional().allow(""),
    websiteCredits:    Joi.string().optional().allow("")
  }).required()
})


/* ─────────────────────────────
   InstituteSettings Schemas
─────────────────────────────*/

const getInstituteSettingsSchema = Joi.object({})

const saveInstituteSettingsSchema = Joi.object({
  input: Joi.object({
    instituteName:         Joi.string().optional().allow(""),
    instituteLogoUrl:      Joi.string().optional().allow(""),
    defaultCopyrightText:  Joi.string().optional().allow(""),
    defaultWebsiteCredits: Joi.string().optional().allow("")
  }).required()
})


module.exports = {
  // DeptBranding
  getDeptBrandingSchema,
  saveDeptBrandingSchema,

  // InstituteSettings
  getInstituteSettingsSchema,
  saveInstituteSettingsSchema
}
