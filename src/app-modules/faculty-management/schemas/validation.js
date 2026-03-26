const Joi = require("joi")

/* ── Faculty ── */

const getFacultySchema = Joi.object({
  facultyId: Joi.string().required(),
  tenantId:  Joi.string().optional().allow(null)
})

const listFacultySchema = Joi.object({
  tenantId:    Joi.string().optional().allow(null),
  deptId:      Joi.string().optional().allow(null),
  designation: Joi.string().optional().allow(null, ''),
  status:      Joi.string().valid('active', 'inactive').optional().allow(null),
  search:      Joi.string().optional().allow(null, ''),
  limit:       Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:   Joi.string().optional().allow(null),
  pagination:  Joi.object().optional().allow(null)
})

const deleteFacultySchema = Joi.object({
  facultyId: Joi.string().required()
})

const createFacultySchema = Joi.object({
  name:         Joi.string().min(1).required(),
  designation:  Joi.string().required(),
  deptId:       Joi.string().required(),
  department:   Joi.string().optional().allow(null, ''),
  profileImage: Joi.string().optional().allow(null, ''),
  cvUrl:        Joi.string().optional().allow(null, ''),
  status:       Joi.string().valid('active', 'inactive').optional().allow(null),
  order:        Joi.number().integer().optional().allow(null),
  insertMode:   Joi.boolean().optional()
})

const updateFacultySchema = Joi.object({
  facultyId:    Joi.string().required(),
  name:         Joi.string().min(1).optional().allow(null),
  designation:  Joi.string().optional().allow(null, ''),
  deptId:       Joi.string().optional().allow(null),
  department:   Joi.string().optional().allow(null, ''),
  profileImage: Joi.string().optional().allow(null, ''),
  cvUrl:        Joi.string().optional().allow(null, ''),
  status:       Joi.string().valid('active', 'inactive').optional().allow(null),
  order:        Joi.number().integer().optional().allow(null),
  insertMode:   Joi.boolean().optional()
})

module.exports = {
  getFacultySchema,
  listFacultySchema,
  createFacultySchema,
  updateFacultySchema,
  deleteFacultySchema
}
