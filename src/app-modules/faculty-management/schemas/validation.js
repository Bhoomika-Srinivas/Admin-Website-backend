const Joi = require("joi")

/* ─────────────────────────────
   Publication Validation
─────────────────────────────*/

const publicationSchema = Joi.object({
  title: Joi.string().min(3).required(),

  journal: Joi.string().min(2).required(),

  year: Joi.number().integer().min(1950).max(new Date().getFullYear()).required(),

  authors: Joi.string().min(2).required(),

  doi: Joi.string().optional(),

  type: Joi.string().valid("journal", "conference", "book").required()
})


/* ─────────────────────────────
   Education Validation
─────────────────────────────*/

const educationSchema = Joi.object({
  degree: Joi.string().min(2).required(),

  institution: Joi.string().min(2).required(),

  year: Joi.number().integer().min(1950).max(new Date().getFullYear()).required(),

  specialization: Joi.string().optional()
})


/* ─────────────────────────────
   Work Experience Validation
─────────────────────────────*/

const workExperienceSchema = Joi.object({
  position: Joi.string().min(2).required(),

  institution: Joi.string().min(2).required(),

  startYear: Joi.number().integer().min(1950).required(),

  endYear: Joi.number().integer().optional(),

  description: Joi.string().optional()
})


/* ─────────────────────────────
   Research Project Validation
─────────────────────────────*/

const researchProjectSchema = Joi.object({
  title: Joi.string().min(3).required(),

  fundingAgency: Joi.string().min(2).required(),

  amount: Joi.string().optional(),

  startYear: Joi.number().integer().min(1950).required(),

  endYear: Joi.number().integer().optional(),

  status: Joi.string().valid("ongoing", "completed").required()
})


/* ─────────────────────────────
   Course Teaching Validation
─────────────────────────────*/

const courseTeachingSchema = Joi.object({
  courseName: Joi.string().min(2).required(),

  semester: Joi.string().required(),

  program: Joi.string().required(),

  academicYear: Joi.string().required()
})


/* ─────────────────────────────
   Honors Validation
─────────────────────────────*/

const honorSchema = Joi.object({
  title: Joi.string().min(3).required(),

  organization: Joi.string().min(2).required(),

  year: Joi.number().integer().min(1950).max(new Date().getFullYear()).required(),

  description: Joi.string().optional()
})


/* ─────────────────────────────
   Main Faculty Validation
─────────────────────────────*/

const createFacultySchema = Joi.object({

  name: Joi.string().min(2).required(),

  designation: Joi.string().valid(
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "HOD",
    "Principal"
  ).required(),

  departmentId: Joi.string().required(),

  qualification: Joi.string().min(2).required(),

  experience: Joi.number().min(0).max(60).required(),

  email: Joi.string().email().required(),

  phone: Joi.string().optional(),

  specialization: Joi.string().min(2).required(),

  officeLocation: Joi.string().optional(),

  profilePicture: Joi.string().optional(),

  publications: Joi.array().items(publicationSchema).optional(),

  education: Joi.array().items(educationSchema).optional(),

  workExperience: Joi.array().items(workExperienceSchema).optional(),

  researchProjects: Joi.array().items(researchProjectSchema).optional(),

  coursesTeaching: Joi.array().items(courseTeachingSchema).optional(),

  honors: Joi.array().items(honorSchema).optional()

})


/* ─────────────────────────────
   Update Faculty Validation
─────────────────────────────*/

const updateFacultySchema = createFacultySchema.fork(
  Object.keys(createFacultySchema.describe().keys),
  (field) => field.optional()
)


module.exports = {
  createFacultySchema,
  updateFacultySchema
}