const Joi = require("joi")

/* ─────────────────────────────
   PlacementOverview Schemas
─────────────────────────────*/

const listPlacementOverviewsSchema = Joi.object({
  deptId:       Joi.string().required(),
  academicYear: Joi.string().optional(),
  sortBy:       Joi.string().valid("academicYear", "companiesVisited", "highestPackage", "createdAt").optional(),
  sortOrder:    Joi.string().valid("asc", "desc").optional()
})

const createPlacementOverviewSchema = Joi.object({
  input: Joi.object({
    deptId:            Joi.string().required(),
    title:             Joi.string().optional(),
    academicYear:      Joi.string().optional(),
    companiesVisited:  Joi.number().integer().min(0).optional(),
    studentsInCampus:  Joi.number().integer().min(0).optional(),
    studentsOffCampus: Joi.number().integer().min(0).optional(),
    highestPackage:    Joi.string().optional()
  }).required()
})

const updatePlacementOverviewSchema = Joi.object({
  input: Joi.object({
    placementOverviewId: Joi.string().required(),
    title:               Joi.string().optional(),
    academicYear:        Joi.string().optional(),
    companiesVisited:    Joi.number().integer().min(0).optional(),
    studentsInCampus:    Joi.number().integer().min(0).optional(),
    studentsOffCampus:   Joi.number().integer().min(0).optional(),
    highestPackage:      Joi.string().optional()
  }).required()
})

const deletePlacementOverviewSchema = Joi.object({
  placementOverviewId: Joi.string().required()
})


/* ─────────────────────────────
   StudentPlacement Schemas
─────────────────────────────*/

const listStudentPlacementsSchema = Joi.object({
  deptId:     Joi.string().required(),
  search:     Joi.string().optional().allow(""),
  batch:      Joi.string().optional(),
  sortBy:     Joi.string().valid("studentName", "company", "package", "batch", "createdAt").optional(),
  sortOrder:  Joi.string().valid("asc", "desc").optional(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const createStudentPlacementSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().required(),
    studentName: Joi.string().min(2).required(),
    usn:         Joi.string().optional(),
    batch:       Joi.string().optional(),
    company:     Joi.string().optional(),
    role:        Joi.string().optional(),
    package:     Joi.number().min(0).optional(),
    imageUrl:    Joi.string().optional().allow("")
  }).required()
})

const updateStudentPlacementSchema = Joi.object({
  input: Joi.object({
    studentPlacementId: Joi.string().required(),
    studentName:        Joi.string().min(2).optional(),
    usn:                Joi.string().optional(),
    batch:              Joi.string().optional(),
    company:            Joi.string().optional(),
    role:               Joi.string().optional(),
    package:            Joi.number().min(0).optional(),
    imageUrl:           Joi.string().optional().allow("")
  }).required()
})

const deleteStudentPlacementSchema = Joi.object({
  studentPlacementId: Joi.string().required()
})


/* ─────────────────────────────
   Achievement Schemas
─────────────────────────────*/

const listAchievementsSchema = Joi.object({
  deptId:    Joi.string().required(),
  search:    Joi.string().optional().allow(""),
  type:      Joi.string().valid("student", "staff").optional(),
  sortBy:    Joi.string().valid("type", "createdAt").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
})

const createAchievementSchema = Joi.object({
  input: Joi.object({
    deptId: Joi.string().required(),
    type:   Joi.string().valid("student", "staff").optional(),
    text:   Joi.string().min(5).required()
  }).required()
})

const updateAchievementSchema = Joi.object({
  input: Joi.object({
    achievementId: Joi.string().required(),
    type:          Joi.string().valid("student", "staff").optional(),
    text:          Joi.string().min(5).optional()
  }).required()
})

const deleteAchievementSchema = Joi.object({
  achievementId: Joi.string().required()
})


/* ─────────────────────────────
   DeptActivity Schemas
─────────────────────────────*/

const listDeptActivitiesSchema = Joi.object({
  deptId:     Joi.string().required(),
  search:     Joi.string().optional().allow(""),
  type:       Joi.string().valid("forum", "department").optional(),
  sortBy:     Joi.string().valid("name", "date", "participants", "createdAt").optional(),
  sortOrder:  Joi.string().valid("asc", "desc").optional(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const createDeptActivitySchema = Joi.object({
  input: Joi.object({
    deptId:       Joi.string().required(),
    type:         Joi.string().valid("forum", "department").optional(),
    name:         Joi.string().min(2).required(),
    description:  Joi.string().optional(),
    date:         Joi.string().optional(),
    venue:        Joi.string().optional(),
    organizer:    Joi.string().optional(),
    participants: Joi.number().integer().min(0).optional()
  }).required()
})

const updateDeptActivitySchema = Joi.object({
  input: Joi.object({
    deptActivityId: Joi.string().required(),
    type:           Joi.string().valid("forum", "department").optional(),
    name:           Joi.string().min(2).optional(),
    description:    Joi.string().optional(),
    date:           Joi.string().optional(),
    venue:          Joi.string().optional(),
    organizer:      Joi.string().optional(),
    participants:   Joi.number().integer().min(0).optional()
  }).required()
})

const deleteDeptActivitySchema = Joi.object({
  deptActivityId: Joi.string().required()
})


/* ─────────────────────────────
   ForumSection Schemas
─────────────────────────────*/

const listForumSectionsSchema = Joi.object({
  deptId:    Joi.string().required(),
  search:    Joi.string().optional().allow(""),
  sortBy:    Joi.string().valid("title", "createdAt").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
})

const createForumSectionSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().required(),
    title:       Joi.string().min(2).required(),
    description: Joi.string().optional()
  }).required()
})

const updateForumSectionSchema = Joi.object({
  input: Joi.object({
    forumSectionId: Joi.string().required(),
    title:          Joi.string().min(2).optional(),
    description:    Joi.string().optional()
  }).required()
})

const deleteForumSectionSchema = Joi.object({
  forumSectionId: Joi.string().required()
})


/* ─────────────────────────────
   ForumEvent Schemas
─────────────────────────────*/

const listForumEventsSchema = Joi.object({
  deptId:     Joi.string().required(),
  search:     Joi.string().optional().allow(""),
  sortBy:     Joi.string().valid("title", "createdAt").optional(),
  sortOrder:  Joi.string().valid("asc", "desc").optional(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const createForumEventSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().required(),
    title:       Joi.string().min(2).required(),
    description: Joi.string().optional()
  }).required()
})

const updateForumEventSchema = Joi.object({
  input: Joi.object({
    forumEventId: Joi.string().required(),
    title:        Joi.string().min(2).optional(),
    description:  Joi.string().optional()
  }).required()
})

const deleteForumEventSchema = Joi.object({
  forumEventId: Joi.string().required()
})


/* ─────────────────────────────
   DepartmentActivityLog Schemas
─────────────────────────────*/

const listDepartmentActivityLogSchema = Joi.object({
  deptId:     Joi.string().required(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const appendDepartmentActivitySchema = Joi.object({
  deptId: Joi.string().required(),
  text:   Joi.string().min(3).required()
})


/* ─────────────────────────────
   DeptNewsletter Schemas
─────────────────────────────*/

const listDeptNewslettersSchema = Joi.object({
  deptId:    Joi.string().required(),
  search:    Joi.string().optional().allow(""),
  sortBy:    Joi.string().valid("title", "publishedDate", "volume", "createdAt").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional()
})

const createDeptNewsletterSchema = Joi.object({
  input: Joi.object({
    deptId:        Joi.string().required(),
    title:         Joi.string().min(2).required(),
    volume:        Joi.string().optional(),
    issue:         Joi.string().optional(),
    publishedDate: Joi.string().optional(),
    fileUrl:       Joi.string().optional().allow("")
  }).required()
})

const updateDeptNewsletterSchema = Joi.object({
  input: Joi.object({
    deptNewsletterId: Joi.string().required(),
    title:            Joi.string().min(2).optional(),
    volume:           Joi.string().optional(),
    issue:            Joi.string().optional(),
    publishedDate:    Joi.string().optional(),
    fileUrl:          Joi.string().optional().allow("")
  }).required()
})

const deleteDeptNewsletterSchema = Joi.object({
  deptNewsletterId: Joi.string().required()
})


/* ─────────────────────────────
   DeptGalleryPhoto Schemas
─────────────────────────────*/

const listDeptGalleryPhotosSchema = Joi.object({
  deptId:     Joi.string().required(),
  search:     Joi.string().optional().allow(""),
  category:   Joi.string().optional(),
  sortBy:     Joi.string().valid("title", "category", "capturedAt", "createdAt").optional(),
  sortOrder:  Joi.string().valid("asc", "desc").optional(),
  limit:      Joi.number().integer().min(1).max(100).optional(),
  nextToken:  Joi.string().optional(),
  pagination: Joi.object().optional()
})

const createDeptGalleryPhotoSchema = Joi.object({
  input: Joi.object({
    deptId:     Joi.string().required(),
    title:      Joi.string().optional(),
    category:   Joi.string().optional(),
    imageUrl:   Joi.string().required(),
    capturedAt: Joi.string().optional()
  }).required()
})

const updateDeptGalleryPhotoSchema = Joi.object({
  input: Joi.object({
    deptGalleryPhotoId: Joi.string().required(),
    title:              Joi.string().optional(),
    category:           Joi.string().optional(),
    imageUrl:           Joi.string().optional()
  }).required()
})

const deleteDeptGalleryPhotoSchema = Joi.object({
  deptGalleryPhotoId: Joi.string().required()
})


module.exports = {
  // PlacementOverview
  listPlacementOverviewsSchema,
  createPlacementOverviewSchema,
  updatePlacementOverviewSchema,
  deletePlacementOverviewSchema,

  // StudentPlacement
  listStudentPlacementsSchema,
  createStudentPlacementSchema,
  updateStudentPlacementSchema,
  deleteStudentPlacementSchema,

  // Achievement
  listAchievementsSchema,
  createAchievementSchema,
  updateAchievementSchema,
  deleteAchievementSchema,

  // DeptActivity
  listDeptActivitiesSchema,
  createDeptActivitySchema,
  updateDeptActivitySchema,
  deleteDeptActivitySchema,

  // ForumSection
  listForumSectionsSchema,
  createForumSectionSchema,
  updateForumSectionSchema,
  deleteForumSectionSchema,

  // ForumEvent
  listForumEventsSchema,
  createForumEventSchema,
  updateForumEventSchema,
  deleteForumEventSchema,

  // DepartmentActivityLog
  listDepartmentActivityLogSchema,
  appendDepartmentActivitySchema,

  // DeptNewsletter
  listDeptNewslettersSchema,
  createDeptNewsletterSchema,
  updateDeptNewsletterSchema,
  deleteDeptNewsletterSchema,

  // DeptGalleryPhoto
  listDeptGalleryPhotosSchema,
  createDeptGalleryPhotoSchema,
  updateDeptGalleryPhotoSchema,
  deleteDeptGalleryPhotoSchema
}
