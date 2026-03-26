const Joi = require("joi")

/* ─────────────────────────────
   DeptStaff Schemas
─────────────────────────────*/

const getDeptStaffSchema = Joi.object({
  deptStaffId: Joi.string().required()
})

const listDeptStaffSchema = Joi.object({
  deptId:     Joi.string().required(),
  staffType:  Joi.string().valid("supporting", "technical").optional().allow(null),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const createDeptStaffSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().required(),
    name:        Joi.string().min(2).required(),
    designation: Joi.string().min(2).required(),
    imageUrl:    Joi.string().optional().allow(null, ''),
    staffType:   Joi.string().valid("supporting", "technical").required(),
    order:       Joi.number().integer().optional().allow(null),
    insertMode:  Joi.boolean().optional()
  }).required()
})

const updateDeptStaffSchema = Joi.object({
  input: Joi.object({
    deptStaffId: Joi.string().required(),
    name:        Joi.string().min(2).optional(),
    designation: Joi.string().min(2).optional(),
    imageUrl:    Joi.string().optional().allow(null, ''),
    staffType:   Joi.string().valid("supporting", "technical").optional(),
    order:       Joi.number().integer().optional().allow(null),
    insertMode:  Joi.boolean().optional()
  }).required()
})

const deleteDeptStaffSchema = Joi.object({
  deptStaffId: Joi.string().required()
})


/* ─────────────────────────────
   Accreditation Schemas
─────────────────────────────*/

const getAccreditationSchema = Joi.object({
  accreditationId: Joi.string().required()
})

const listAccreditationsSchema = Joi.object({
  deptId:     Joi.string().required(),
  search:     Joi.string().optional().allow(""),
  status:     Joi.string().valid("active", "inactive").optional(),
  sortBy:     Joi.string().valid("name", "accreditedBy", "validFrom", "validUntil", "createdAt").optional(),
  sortOrder:  Joi.string().valid("asc", "desc").optional(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const createAccreditationSchema = Joi.object({
  input: Joi.object({
    deptId:         Joi.string().required(),
    name:           Joi.string().min(2).required(),
    accreditedBy:   Joi.string().min(2).required(),
    validFrom:      Joi.string().optional(),
    validUntil:     Joi.string().optional(),
    grade:          Joi.string().optional(),
    certificateUrl: Joi.string().optional().allow(""),
    status:         Joi.string().valid("active", "inactive").optional()
  }).required()
})

const updateAccreditationSchema = Joi.object({
  input: Joi.object({
    accreditationId: Joi.string().required(),
    name:            Joi.string().min(2).optional(),
    accreditedBy:    Joi.string().min(2).optional(),
    validFrom:       Joi.string().optional(),
    validUntil:      Joi.string().optional(),
    grade:           Joi.string().optional(),
    certificateUrl:  Joi.string().optional().allow(""),
    status:          Joi.string().valid("active", "inactive").optional()
  }).required()
})

const deleteAccreditationSchema = Joi.object({
  accreditationId: Joi.string().required()
})


module.exports = {
  // DeptStaff
  getDeptStaffSchema,
  listDeptStaffSchema,
  createDeptStaffSchema,
  updateDeptStaffSchema,
  deleteDeptStaffSchema,

  // Accreditation
  getAccreditationSchema,
  listAccreditationsSchema,
  createAccreditationSchema,
  updateAccreditationSchema,
  deleteAccreditationSchema
}
