const Joi = require("joi")

/* ─────────────────────────────
   DeptSlot Schemas
─────────────────────────────*/

const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const listDeptSlotsSchema = Joi.object({
  deptId:      Joi.string().required(),
  sectionId:   Joi.string().required(),
  tenantId:    Joi.string().optional().allow(null),
  programType: Joi.string().valid('UG', 'PG').optional().allow(null),
  program:     Joi.string().optional().allow(null),
  batch:       Joi.string().optional().allow(null)
})

const createDeptSlotSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().required(),
    programType: Joi.string().valid('UG', 'PG').optional().allow(null),
    program:     Joi.string().optional().allow(null),
    batch:       Joi.string().optional().allow(null),
    sectionId:   Joi.string().required(),
    day:         Joi.string().valid(...VALID_DAYS).required(),
    period:      Joi.number().integer().min(1).max(7).required(),
    courseCode:  Joi.string().required(),
    courseName:  Joi.string().required(),
    type:        Joi.string().valid('theory', 'lab', 'elective').required(),
    facultyId:   Joi.string().optional().allow(null)
  }).required()
})

const updateDeptSlotSchema = Joi.object({
  input: Joi.object({
    deptSlotId: Joi.string().required(),
    courseCode: Joi.string().optional().allow(null),
    courseName: Joi.string().optional().allow(null),
    type:       Joi.string().valid('theory', 'lab', 'elective').optional().allow(null),
    facultyId:  Joi.string().optional().allow(null)
  }).required()
})

const deleteDeptSlotSchema = Joi.object({
  deptSlotId: Joi.string().required()
})


/* ─────────────────────────────
   DeptSection Schemas
─────────────────────────────*/

const listDeptSectionsSchema = Joi.object({
  deptId:    Joi.string().required(),
  tenantId:  Joi.string().optional().allow(null),
  programId: Joi.string().optional().allow(null),
  semester:  Joi.number().integer().optional().allow(null),
  batchName: Joi.string().optional().allow(null)
})

const createDeptSectionSchema = Joi.object({
  input: Joi.object({
    deptId:    Joi.string().required(),
    programId: Joi.string().optional().allow(null),
    batchName: Joi.string().required(),
    semester:  Joi.number().integer().required(),
    name:      Joi.string().required()
  }).required()
})

const deleteDeptSectionSchema = Joi.object({
  deptSectionId: Joi.string().required()
})


/* ─────────────────────────────
   DeptBatch Schemas
─────────────────────────────*/

const listDeptBatchesSchema = Joi.object({
  deptId:      Joi.string().required(),
  tenantId:    Joi.string().optional().allow(null),
  programType: Joi.string().valid('UG', 'PG').optional().allow(null),
  program:     Joi.string().optional().allow(null)
})

const createDeptBatchSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().required(),
    programType: Joi.string().valid('UG', 'PG').optional().allow(null),
    program:     Joi.string().optional().allow(null),
    name:        Joi.string().min(1).required(),
    startYear:   Joi.number().integer().optional().allow(null),
    endYear:     Joi.number().integer().optional().allow(null)
  }).required()
})

const deleteDeptBatchSchema = Joi.object({
  deptBatchId: Joi.string().required()
})


/* ─────────────────────────────
   DeptCourse Schemas
─────────────────────────────*/

const getDeptCourseSchema = Joi.object({
  deptCourseId: Joi.string().required()
})

const listDeptCoursesSchema = Joi.object({
  deptId:      Joi.string().required(),
  tenantId:    Joi.string().optional().allow(null),
  search:      Joi.string().optional().allow("", null),
  programType: Joi.string().valid('UG', 'PG').optional().allow(null),
  program:     Joi.string().optional().allow("", null),
  batch:       Joi.string().optional().allow("", null),
  semester:    Joi.number().integer().min(1).max(8).optional().allow(null),
  type:        Joi.string().valid("theory", "lab", "elective").optional().allow(null),
  scheme:      Joi.string().optional().allow("", null),
  sortBy:      Joi.string().valid("code", "name", "semester", "credits", "createdAt").optional().allow(null),
  sortOrder:   Joi.string().valid("asc", "desc").optional().allow(null),
  limit:       Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:   Joi.string().optional().allow("", null),
  pagination:  Joi.object().optional().allow(null)
})

const createDeptCourseSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().required(),
    programType: Joi.string().valid('UG', 'PG').optional().allow(null),
    program:     Joi.string().optional().allow("", null),
    batch:       Joi.string().optional().allow("", null),
    code:        Joi.string().min(2).required(),
    name:        Joi.string().min(2).required(),
    semester:    Joi.number().integer().min(1).max(8).optional().allow(null),
    credits:     Joi.number().integer().min(0).max(6).optional().allow(null),
    type:        Joi.string().valid("theory", "lab", "elective").optional().allow(null),
    scheme:      Joi.string().optional().allow("", null)
  }).required()
})

const updateDeptCourseSchema = Joi.object({
  input: Joi.object({
    deptCourseId: Joi.string().required(),
    programType:  Joi.string().valid('UG', 'PG').optional().allow(null),
    program:      Joi.string().optional().allow("", null),
    batch:        Joi.string().optional().allow("", null),
    code:         Joi.string().min(2).optional().allow(null),
    name:         Joi.string().min(2).optional().allow(null),
    semester:     Joi.number().integer().min(1).max(8).optional().allow(null),
    credits:      Joi.number().integer().min(0).max(6).optional().allow(null),
    type:         Joi.string().valid("theory", "lab", "elective").optional().allow(null),
    scheme:       Joi.string().optional().allow("", null)
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
  tenantId:     Joi.string().optional().allow(null),
  semester:     Joi.number().integer().min(1).max(8).optional().allow(null),
  academicYear: Joi.string().optional().allow("", null),
  sortBy:       Joi.string().valid("semester", "academicYear", "uploadedAt").optional().allow(null),
  sortOrder:    Joi.string().valid("asc", "desc").optional().allow(null)
})

const createDeptTimetableSchema = Joi.object({
  input: Joi.object({
    deptId:       Joi.string().required(),
    section:      Joi.string().optional().allow("", null),
    semester:     Joi.number().integer().min(1).max(8).optional().allow(null),
    academicYear: Joi.string().optional().allow("", null),
    fileUrl:      Joi.string().optional().allow("", null)
  }).required()
})

const updateDeptTimetableSchema = Joi.object({
  input: Joi.object({
    deptTimetableId: Joi.string().required(),
    section:         Joi.string().optional().allow("", null),
    semester:        Joi.number().integer().min(1).max(8).optional().allow(null),
    academicYear:    Joi.string().optional().allow("", null),
    fileUrl:         Joi.string().optional().allow("", null)
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
  tenantId:   Joi.string().optional().allow(null),
  search:     Joi.string().optional().allow("", null),
  courseCode: Joi.string().optional().allow("", null),
  type:       Joi.string().valid("notes", "assignment", "question_paper", "reference").optional().allow(null),
  sortBy:     Joi.string().valid("title", "courseCode", "type", "createdAt").optional().allow(null),
  sortOrder:  Joi.string().valid("asc", "desc").optional().allow(null),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow("", null),
  pagination: Joi.object().optional().allow(null)
})

const createLearningMaterialSchema = Joi.object({
  input: Joi.object({
    deptId:     Joi.string().required(),
    courseCode: Joi.string().optional().allow("", null),
    courseName: Joi.string().optional().allow("", null),
    title:      Joi.string().min(2).required(),
    type:       Joi.string().valid("notes", "assignment", "question_paper", "reference").optional().allow(null),
    fileUrl:    Joi.string().optional().allow("", null),
    uploadedBy: Joi.string().optional().allow("", null)
  }).required()
})

const updateLearningMaterialSchema = Joi.object({
  input: Joi.object({
    learningMaterialId: Joi.string().required(),
    courseCode:         Joi.string().optional().allow("", null),
    courseName:         Joi.string().optional().allow("", null),
    title:              Joi.string().min(2).optional().allow(null),
    type:               Joi.string().valid("notes", "assignment", "question_paper", "reference").optional().allow(null),
    fileUrl:            Joi.string().optional().allow("", null)
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
  tenantId:  Joi.string().optional().allow(null),
  search:    Joi.string().optional().allow("", null),
  sortBy:    Joi.string().valid("facultyName", "createdAt").optional().allow(null),
  sortOrder: Joi.string().valid("asc", "desc").optional().allow(null)
})

const facultyRefSchema = Joi.object({
  facultyId:   Joi.string().optional().allow("", null),
  facultyName: Joi.string().required()
})

const createInnovativeTeachingSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().required(),
    faculties:   Joi.array().items(facultyRefSchema).optional().allow(null),
    description: Joi.string().optional().allow("", null),
    imageUrls:   Joi.array().items(Joi.string()).optional().allow(null),
    pdfUrl:      Joi.string().optional().allow("", null)
  }).required()
})

const updateInnovativeTeachingSchema = Joi.object({
  input: Joi.object({
    innovativeTeachingId: Joi.string().required(),
    faculties:            Joi.array().items(facultyRefSchema).optional().allow(null),
    description:          Joi.string().optional().allow("", null),
    imageUrls:            Joi.array().items(Joi.string()).optional().allow(null),
    pdfUrl:               Joi.string().optional().allow("", null)
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
  tenantId:  Joi.string().optional().allow(null),
  search:    Joi.string().optional().allow("", null),
  semester:  Joi.number().integer().min(1).max(8).optional().allow(null),
  batch:     Joi.string().optional().allow("", null),
  sortBy:    Joi.string().valid("title", "semester", "batch", "createdAt").optional().allow(null),
  sortOrder: Joi.string().valid("asc", "desc").optional().allow(null)
})

const createResultAnalysisSchema = Joi.object({
  input: Joi.object({
    deptId:        Joi.string().required(),
    title:         Joi.string().min(2).required(),
    semester:      Joi.number().integer().min(1).max(8).optional().allow(null),
    batch:         Joi.string().optional().allow("", null),
    pdfUrl:        Joi.string().optional().allow("", null),
    graphImageUrl: Joi.string().optional().allow("", null)
  }).required()
})

const updateResultAnalysisSchema = Joi.object({
  input: Joi.object({
    resultAnalysisId: Joi.string().required(),
    title:            Joi.string().min(2).optional().allow(null),
    semester:         Joi.number().integer().min(1).max(8).optional().allow(null),
    batch:            Joi.string().optional().allow("", null),
    pdfUrl:           Joi.string().optional().allow("", null),
    graphImageUrl:    Joi.string().optional().allow("", null)
  }).required()
})

const deleteResultAnalysisSchema = Joi.object({
  resultAnalysisId: Joi.string().required()
})


module.exports = {
  // DeptSlot
  listDeptSlotsSchema,
  createDeptSlotSchema,
  updateDeptSlotSchema,
  deleteDeptSlotSchema,

  // DeptSection
  listDeptSectionsSchema,
  createDeptSectionSchema,
  deleteDeptSectionSchema,

  // DeptBatch
  listDeptBatchesSchema,
  createDeptBatchSchema,
  deleteDeptBatchSchema,

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
