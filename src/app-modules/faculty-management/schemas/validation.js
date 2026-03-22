const Joi = require("joi")

/* ─────────────────────────────
   Query / Delete Schemas
─────────────────────────────*/

const getFacultySchema = Joi.object({
  facultyId: Joi.string().required(),
  tenantId:  Joi.string().optional()
})

const listFacultySchema = Joi.object({
  tenantId:   Joi.string().optional(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const deleteFacultySchema = Joi.object({
  facultyId: Joi.string().required()
})


/* ─────────────────────────────
   Sub-entity Schemas
─────────────────────────────*/

const publicationSchema = Joi.object({
  title: Joi.string().min(3).required(),
  journal: Joi.string().min(2).optional(),
  year: Joi.number().integer().min(1950).max(new Date().getFullYear()).optional(),
  authors: Joi.array().items(Joi.string()).optional(),
  doi: Joi.string().optional(),
  type: Joi.string().valid("journal", "conference", "book").optional()
})

const educationSchema = Joi.object({
  degree: Joi.string().min(2).required(),
  institution: Joi.string().min(2).required(),
  fieldOfStudy: Joi.string().optional(),
  startYear: Joi.number().integer().min(1950).optional(),
  endYear: Joi.number().integer().optional(),
  description: Joi.string().optional()
})

const workExperienceSchema = Joi.object({
  title: Joi.string().min(2).required(),
  organization: Joi.string().min(2).required(),
  startDate: Joi.string().optional(),
  endDate: Joi.string().optional(),
  current: Joi.boolean().optional(),
  description: Joi.string().optional()
})

const researchProjectSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().optional(),
  status: Joi.string().valid("ongoing", "completed").optional(),
  startDate: Joi.string().optional(),
  endDate: Joi.string().optional(),
  fundingSource: Joi.string().optional(),
  collaborators: Joi.array().items(Joi.string()).optional()
})

const courseTeachingSchema = Joi.object({
  courseCode: Joi.string().required(),
  courseName: Joi.string().min(2).required(),
  semester: Joi.string().optional(),
  year: Joi.number().integer().optional(),
  credits: Joi.number().integer().optional(),
  description: Joi.string().optional()
})

const honorSchema = Joi.object({
  title: Joi.string().min(3).required(),
  organization: Joi.string().optional(),
  year: Joi.number().integer().min(1950).max(new Date().getFullYear()).optional(),
  description: Joi.string().optional()
})


/* ─────────────────────────────
   Main Faculty Schemas
   Fields match the GraphQL schema (CreateFacultyInput / UpdateFacultyInput)
─────────────────────────────*/

const createFacultySchema = Joi.object({
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  title: Joi.string().optional(),
  department: Joi.string().optional(),
  designation: Joi.string().optional(),
  bio: Joi.string().optional(),
  profileImage: Joi.string().optional(),
  phone: Joi.string().optional(),
  officeLocation: Joi.string().optional(),
  website: Joi.string().optional()
})

const updateFacultySchema = Joi.object({
  facultyId: Joi.string().required(),
  firstName: Joi.string().min(1).optional(),
  lastName: Joi.string().min(1).optional(),
  email: Joi.string().email().optional(),
  title: Joi.string().optional(),
  department: Joi.string().optional(),
  designation: Joi.string().optional(),
  bio: Joi.string().optional(),
  profileImage: Joi.string().optional(),
  phone: Joi.string().optional(),
  officeLocation: Joi.string().optional(),
  website: Joi.string().optional()
})


module.exports = {
  getFacultySchema,
  listFacultySchema,
  createFacultySchema,
  updateFacultySchema,
  deleteFacultySchema
}
