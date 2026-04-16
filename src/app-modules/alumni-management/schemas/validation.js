const Joi = require("joi")

const getAlumniSchema = Joi.object({
  alumniId: Joi.string().required()
  // tenantId removed - always use authenticated context
})

const listAlumniSchema = Joi.object({
  // tenantId removed - always use authenticated context
  deptId:     Joi.string().optional().allow(null),
  batch:      Joi.string().optional().allow(null, ''),
  search:     Joi.string().optional().allow(null, ''),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null),
  pagination: Joi.object().optional().allow(null)
})

const createAlumniSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().required(),
    name:        Joi.string().min(1).required(),
    batch:       Joi.string().required(),
    department:  Joi.string().optional().allow(null, ''),
    company:     Joi.string().required(),
    designation: Joi.string().required(),
    location:    Joi.string().optional().allow(null, ''),
    achievement: Joi.string().optional().allow(null, ''),
    email:       Joi.string().email().optional().allow(null, ''),
    linkedin:    Joi.string().optional().allow(null, ''),
    image:       Joi.string().optional().allow(null, '')
  }).required()
})

const updateAlumniSchema = Joi.object({
  input: Joi.object({
    alumniId:    Joi.string().required(),
    name:        Joi.string().min(1).optional(),
    batch:       Joi.string().optional().allow(null, ''),
    department:  Joi.string().optional().allow(null, ''),
    company:     Joi.string().optional().allow(null, ''),
    designation: Joi.string().optional().allow(null, ''),
    location:    Joi.string().optional().allow(null, ''),
    achievement: Joi.string().optional().allow(null, ''),
    email:       Joi.string().email().optional().allow(null, ''),
    linkedin:    Joi.string().optional().allow(null, ''),
    image:       Joi.string().optional().allow(null, '')
  }).required()
})

const deleteAlumniSchema = Joi.object({
  alumniId: Joi.string().required()
})

module.exports = {
  getAlumniSchema,
  listAlumniSchema,
  createAlumniSchema,
  updateAlumniSchema,
  deleteAlumniSchema
}
