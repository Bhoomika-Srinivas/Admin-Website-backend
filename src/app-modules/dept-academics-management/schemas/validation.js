const Joi = require("joi")
const currentYear = new Date().getFullYear()

/* ─────────────────────────────
   DeptCourse Schemas
─────────────────────────────*/

const getDeptCourseSchema = Joi.object({
  deptCourseId: Joi.string().required()
})

const listDeptCoursesSchema = Joi.object({
  deptId:     Joi.string().required(),
  search:     Joi.string().optional().allow(""),
  semester:   Joi.number().integer().min(1).max(8).optional(),
  type:       Joi.string().valid("theory", "lab", "elective").optional(),
  scheme:     Joi.string().optional(),
  sortBy:     Joi.string().valid("code", "name", "semester", "credits", "createdAt").optional(),
  sortOrder:  Joi.string().valid("asc", "desc").optional(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const createDeptCourseSchema = Joi.object({
  input: Joi.object({
    deptId:   Joi.string().required(),
    code:     Joi.string().min(2).required(),
    name:     Joi.string().min(2).required(),
    semester: Joi.number().integer().min(1).max(8).optional(),
    credits:  Joi.number().integer().min(0).max(6).optional(),
    type:     Joi.string().valid("theory", "lab", "elective").optional(),
    scheme:   Joi.string().optional()
  }).required()
})

const updateDeptCourseSchema = Joi.object({
  input: Joi.object({
    deptCourseId: Joi.string().required(),
    code:         Joi.string().min(2).optional(),
    name:         Joi.string().min(2).optional(),
    semester:     Joi.number().integer().min(1).max(8).optional(),
    credits:      Joi.number().integer().min(0).max(6).optional(),
    type:         Joi.string().valid("theory", "lab", "elective").optional(),
    scheme:       Joi.string().optional()
  }).required()
})

const deleteDeptCourseSchema = Joi.object({
  deptCourseId: Joi.string().required()
})


/* ─────────────────────────────
   DeptTimetable Schemas
─────────────────────────────*/

const listDeptTimetablesSchema = Joi.object({
  deptId:       Joi.string().required(),
  semester:     Joi.number().integer().min(1).max(8).optional(),
  academicYear: Joi.string().optional(),
  sortBy:       Joi.string().valid("semester", "academicYear", "uploadedAt").optional(),
  sortOrder:    Joi.string().valid("asc", "desc").optional()
})

const createDeptTimetableSchema = Joi.object({
  input: Joi.object({
    deptId:       Joi.string().required(),
    section:      Joi.string().optional(),
    semester:     Joi.number().integer().min(1).max(8).optional(),
    academicYear: Joi.string().optional(),
    fileUrl:      Joi.string().optional().allow("")
  }).required()
})

const updateDeptTimetableSchema = Joi.object({
  input: Joi.object({
    deptTimetableId: Joi.string().required(),
    section:         Joi.string().optional(),
    semester:        Joi.number().integer().min(1).max(8).optional(),
    academicYear:    Joi.string().optional(),
    fileUrl:         Joi.string().optional().allow("")
  }).required()
})

const deleteDeptTimetableSchema = Joi.object({
  deptTimetableId: Joi.string().required()
})


/* ─────────────────────────────
   LearningMaterial Schemas
─────────────────────────────*/

const listLearningMaterialsSchema = Joi.object({
  deptId:     Joi.string().required(),
  search:     Joi.string().optional().allow(""),
  courseCode: Joi.string().optional(),
  type:       Joi.string().valid("notes", "assignment", "question_paper", "reference").optional(),
  sortBy:     Joi.string().valid("title", "courseCode", "type", "createdAt").optional(),
  sortOrder:  Joi.string().valid("asc", "desc").optional(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const createLearningMaterialSchema = Joi.object({
  input: Joi.object({
    deptId:     Joi.string().required(),
    courseCode: Joi.string().optional(),
    courseName: Joi.string().optional(),
    title:      Joi.string().min(2).required(),
    type:       Joi.string().valid("notes", "assignment", "question_paper", "reference").optional(),
    fileUrl:    Joi.string().optional().allow("")
  }).required()
})

const updateLearningMaterialSchema = Joi.object({
  input: Joi.object({
    learningMaterialId: Joi.string().required(),
    courseCode:         Joi.string().optional(),
    courseName:         Joi.string().optional(),
    title:              Joi.string().min(2).optional(),
    type:               Joi.string().valid("notes", "assignment", "question_paper", "reference").optional(),
    fileUrl:            Joi.string().optional().allow("")
  }).required()
})

const deleteLearningMaterialSchema = Joi.object({
  learningMaterialId: Joi.string().required()
})


/* ─────────────────────────────
   InnovativeTeaching Schemas
─────────────────────────────*/

const listInnovativeTeachingSchema = Joi.object({
  deptId:    Joi.string().required(),
  search:    Joi.string().optional().allow(""),
  year:      Joi.string().optional(),
  sortBy:    Joi.string().valid("facultyName", "year", "createdAt").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
})

const createInnovativeTeachingSchema = Joi.object({
  input: Joi.object({
    deptId:        Joi.string().required(),
    facultyName:   Joi.string().optional(),
    method:        Joi.string().optional(),
    description:   Joi.string().optional(),
    courseApplied: Joi.string().optional(),
    year:          Joi.string().optional(),
    outcome:       Joi.string().optional()
  }).required()
})

const updateInnovativeTeachingSchema = Joi.object({
  input: Joi.object({
    innovativeTeachingId: Joi.string().required(),
    facultyName:          Joi.string().optional(),
    method:               Joi.string().optional(),
    description:          Joi.string().optional(),
    courseApplied:        Joi.string().optional(),
    year:                 Joi.string().optional(),
    outcome:              Joi.string().optional()
  }).required()
})

const deleteInnovativeTeachingSchema = Joi.object({
  innovativeTeachingId: Joi.string().required()
})


/* ─────────────────────────────
   ResultAnalysis Schemas
─────────────────────────────*/

const listResultAnalysesSchema = Joi.object({
  deptId:    Joi.string().required(),
  search:    Joi.string().optional().allow(""),
  semester:  Joi.number().integer().min(1).max(8).optional(),
  batch:     Joi.string().optional(),
  sortBy:    Joi.string().valid("title", "semester", "batch", "createdAt").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
})

const createResultAnalysisSchema = Joi.object({
  input: Joi.object({
    deptId:        Joi.string().required(),
    title:         Joi.string().min(2).required(),
    semester:      Joi.number().integer().min(1).max(8).optional(),
    batch:         Joi.string().optional(),
    pdfUrl:        Joi.string().optional().allow(""),
    graphImageUrl: Joi.string().optional().allow("")
  }).required()
})

const updateResultAnalysisSchema = Joi.object({
  input: Joi.object({
    resultAnalysisId: Joi.string().required(),
    title:            Joi.string().min(2).optional(),
    semester:         Joi.number().integer().min(1).max(8).optional(),
    batch:            Joi.string().optional(),
    pdfUrl:           Joi.string().optional().allow(""),
    graphImageUrl:    Joi.string().optional().allow("")
  }).required()
})

const deleteResultAnalysisSchema = Joi.object({
  resultAnalysisId: Joi.string().required()
})


module.exports = {
  // DeptCourse
  getDeptCourseSchema,
  listDeptCoursesSchema,
  createDeptCourseSchema,
  updateDeptCourseSchema,
  deleteDeptCourseSchema,

  // DeptTimetable
  listDeptTimetablesSchema,
  createDeptTimetableSchema,
  updateDeptTimetableSchema,
  deleteDeptTimetableSchema,

  // LearningMaterial
  listLearningMaterialsSchema,
  createLearningMaterialSchema,
  updateLearningMaterialSchema,
  deleteLearningMaterialSchema,

  // InnovativeTeaching
  listInnovativeTeachingSchema,
  createInnovativeTeachingSchema,
  updateInnovativeTeachingSchema,
  deleteInnovativeTeachingSchema,

  // ResultAnalysis
  listResultAnalysesSchema,
  createResultAnalysisSchema,
  updateResultAnalysisSchema,
  deleteResultAnalysisSchema
}
