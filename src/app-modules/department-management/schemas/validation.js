const Joi = require("joi")

const currentYear = new Date().getFullYear()

/* ─────────────────────────────
   Query / Delete Schemas
─────────────────────────────*/

const getDepartmentSchema = Joi.object({
  departmentId: Joi.string().required()
})

const listDepartmentsSchema = Joi.object({
  search:     Joi.string().optional().allow(""),
  status:     Joi.string().valid("active", "inactive").optional(),
  sortBy:     Joi.string().valid("name", "shortName", "established", "createdAt").optional(),
  sortOrder:  Joi.string().valid("asc", "desc").optional(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional().allow(null),
  pagination: Joi.object().optional()
})

const deleteDepartmentSchema = Joi.object({
  departmentId: Joi.string().required()
})


/* ─────────────────────────────
   Create / Update Schemas
─────────────────────────────*/

const createDepartmentSchema = Joi.object({
  name:        Joi.string().min(2).required(),
  shortName:   Joi.string().min(2).max(10).required(),
  hod:         Joi.string().optional(),
  established: Joi.number().integer().min(1800).max(currentYear).optional(),
  description:  Joi.string().optional(),
  imageUrl:     Joi.string().optional(),
  status:       Joi.string().valid("active", "inactive").optional(),
  programTypes: Joi.array().items(Joi.string()).optional()
})

const updateDepartmentSchema = Joi.object({
  departmentId:  Joi.string().required(),
  name:          Joi.string().min(2).optional(),
  shortName:     Joi.string().min(2).max(10).optional(),
  hod:           Joi.string().optional(),
  established:   Joi.number().integer().min(1800).max(currentYear).optional(),
  totalFaculty:  Joi.number().integer().min(0).optional(),
  totalStudents: Joi.number().integer().min(0).optional(),
  description:   Joi.string().optional(),
  imageUrl:      Joi.string().optional(),
  status:        Joi.string().valid("active", "inactive").optional(),
  programTypes:  Joi.array().items(Joi.string()).optional()
})


module.exports = {
  getDepartmentSchema,
  listDepartmentsSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  deleteDepartmentSchema
}
