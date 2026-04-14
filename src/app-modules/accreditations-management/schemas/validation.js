const Joi = require("joi")

const VALID_TYPES = ['AICTE', 'VTU', 'NAAC', 'NIRF', 'NBA', 'AISHE']

const listAccreditationsSchema = Joi.object({
  type:            Joi.string().valid(...VALID_TYPES).required(),
  section:         Joi.string().optional().allow(null, ""),
  sub_section:     Joi.string().optional().allow(null, ""),
  sub_sub_section: Joi.string().optional().allow(null, ""),
  department:      Joi.string().optional().allow(null, ""),
  tenantId:        Joi.string().optional().allow(null),
  limit:           Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:       Joi.string().optional().allow(null, ""),
})

const getAccreditationSchema = Joi.object({
  accreditationId: Joi.string().required(),
})

const createAccreditationSchema = Joi.object({
  input: Joi.object({
    type:            Joi.string().valid(...VALID_TYPES).required(),
    section:         Joi.string().optional().allow(null, ""),
    sub_section:     Joi.string().optional().allow(null, ""),
    sub_sub_section: Joi.string().optional().allow(null, ""),
    department:      Joi.string().optional().allow(null, ""),
    title:           Joi.string().required(),
    description:     Joi.string().optional().allow(null, ""),
    year:            Joi.string().optional().allow(null, ""),
    program:         Joi.string().optional().allow(null, ""),
    cycle:           Joi.string().optional().allow(null, ""),
    file_url:        Joi.string().required(),
    order:           Joi.number().integer().optional().allow(null),
  }).required(),
})

const updateAccreditationSchema = Joi.object({
  input: Joi.object({
    accreditationId: Joi.string().required(),
    section:         Joi.string().optional().allow(null, ""),
    sub_section:     Joi.string().optional().allow(null, ""),
    sub_sub_section: Joi.string().optional().allow(null, ""),
    department:      Joi.string().optional().allow(null, ""),
    title:           Joi.string().optional().allow(null, ""),
    description:     Joi.string().optional().allow(null, ""),
    year:            Joi.string().optional().allow(null, ""),
    program:         Joi.string().optional().allow(null, ""),
    cycle:           Joi.string().optional().allow(null, ""),
    file_url:        Joi.string().optional().allow(null, ""),
    order:           Joi.number().integer().optional().allow(null),
  }).required(),
})

const deleteAccreditationSchema = Joi.object({
  accreditationId: Joi.string().required(),
})

module.exports = {
  listAccreditationsSchema,
  getAccreditationSchema,
  createAccreditationSchema,
  updateAccreditationSchema,
  deleteAccreditationSchema,
}
