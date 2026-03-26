const Joi = require("joi")

/* ─────────────────────────────
   Event Schemas
─────────────────────────────*/

const listEventsSchema = Joi.object({
  deptId:         Joi.string().optional().allow(null),
  tenantId:       Joi.string().optional().allow(null),
  level:          Joi.string().valid('institutional', 'department').optional().allow(null),
  department:     Joi.string().optional().allow(null),
  status:         Joi.string().valid('upcoming', 'completed', 'cancelled').optional().allow(null),
  approvalStatus: Joi.string().valid('pending', 'approved', 'rejected').optional().allow(null),
  pinned:         Joi.boolean().optional().allow(null),
  limit:          Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:      Joi.string().optional().allow(null),
  pagination:     Joi.object().optional().allow(null)
})

const getEventSchema = Joi.object({
  eventId: Joi.string().required()
})

const createEventSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().optional().allow(null),
    title:       Joi.string().required(),
    date:        Joi.string().optional().allow(null),
    time:        Joi.string().optional().allow(null),
    venue:       Joi.string().optional().allow(null),
    description: Joi.string().optional().allow(null),
    images:      Joi.array().items(Joi.string()).optional().allow(null),
    pinned:      Joi.boolean().optional().allow(null),
    level:       Joi.string().valid('institutional', 'department').required(),
    department:  Joi.string().optional().allow(null)
  }).required()
})

const updateEventSchema = Joi.object({
  input: Joi.object({
    eventId:        Joi.string().required(),
    title:          Joi.string().optional().allow(null),
    date:           Joi.string().optional().allow(null),
    time:           Joi.string().optional().allow(null),
    venue:          Joi.string().optional().allow(null),
    description:    Joi.string().optional().allow(null),
    images:         Joi.array().items(Joi.string()).optional().allow(null),
    pinned:         Joi.boolean().optional().allow(null),
    level:          Joi.string().valid('institutional', 'department').optional().allow(null),
    department:     Joi.string().optional().allow(null),
    status:         Joi.string().valid('upcoming', 'completed', 'cancelled').optional().allow(null),
    approvalStatus: Joi.string().valid('pending', 'approved', 'rejected').optional().allow(null)
  }).required()
})

const deleteEventSchema = Joi.object({
  eventId: Joi.string().required()
})

const approveEventSchema    = Joi.object({ eventId: Joi.string().required() })
const rejectEventSchema     = Joi.object({ eventId: Joi.string().required() })
const cancelEventSchema     = Joi.object({ eventId: Joi.string().required() })
const togglePinEventSchema  = Joi.object({ eventId: Joi.string().required() })


/* ─────────────────────────────
   PlacementOverview Schemas
─────────────────────────────*/

const listPlacementOverviewsSchema = Joi.object({
  deptId:       Joi.string().required(),
  tenantId:     Joi.string().optional().allow(null),
  academicYear: Joi.string().optional().allow(null),
  sortBy:       Joi.string().valid("academicYear", "companiesVisited", "highestPackage", "createdAt").optional().allow(null),
  sortOrder:    Joi.string().valid("asc", "desc").optional().allow(null)
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
  tenantId:   Joi.string().optional().allow(null),
  search:     Joi.string().optional().allow("", null),
  batch:      Joi.string().optional().allow(null),
  sortBy:     Joi.string().valid("studentName", "company", "package", "batch", "createdAt").optional().allow(null),
  sortOrder:  Joi.string().valid("asc", "desc").optional().allow(null),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null),
  pagination: Joi.object().optional().allow(null)
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
  tenantId:  Joi.string().optional().allow(null),
  search:    Joi.string().optional().allow("", null),
  type:      Joi.string().valid("student", "staff").optional().allow(null),
  sortBy:    Joi.string().valid("type", "createdAt").optional().allow(null),
  sortOrder: Joi.string().valid("asc", "desc").optional().allow(null)
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
  tenantId:   Joi.string().optional().allow(null),
  search:     Joi.string().optional().allow("", null),
  type:       Joi.string().valid("forum", "department").optional().allow(null),
  sortBy:     Joi.string().valid("name", "date", "participants", "createdAt").optional().allow(null),
  sortOrder:  Joi.string().valid("asc", "desc").optional().allow(null),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null),
  pagination: Joi.object().optional().allow(null)
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
  tenantId:  Joi.string().optional().allow(null),
  search:    Joi.string().optional().allow("", null),
  sortBy:    Joi.string().valid("title", "createdAt").optional().allow(null),
  sortOrder: Joi.string().valid("asc", "desc").optional().allow(null)
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
  tenantId:   Joi.string().optional().allow(null),
  search:     Joi.string().optional().allow("", null),
  sortBy:     Joi.string().valid("title", "createdAt").optional().allow(null),
  sortOrder:  Joi.string().valid("asc", "desc").optional().allow(null),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null),
  pagination: Joi.object().optional().allow(null)
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
  tenantId:   Joi.string().optional().allow(null),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null),
  pagination: Joi.object().optional().allow(null)
})

const appendDepartmentActivitySchema = Joi.object({
  input: Joi.object({
    deptId: Joi.string().required(),
    text:   Joi.string().min(3).required()
  }).required()
})

const updateDepartmentActivitySchema = Joi.object({
  input: Joi.object({
    deptActivityLogId: Joi.string().required(),
    text:              Joi.string().min(3).optional()
  }).required()
})

const deleteDepartmentActivitySchema = Joi.object({
  deptActivityLogId: Joi.string().required()
})


/* ─────────────────────────────
   DeptNewsletter Schemas
─────────────────────────────*/

const listDeptNewslettersSchema = Joi.object({
  deptId:    Joi.string().required(),
  tenantId:  Joi.string().optional().allow(null),
  search:    Joi.string().optional().allow("", null),
  sortBy:    Joi.string().valid("title", "publishedDate", "volume", "createdAt").optional().allow(null),
  sortOrder: Joi.string().valid("asc", "desc").optional().allow(null)
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
    newsletterId:  Joi.string().required(),
    title:         Joi.string().min(2).optional(),
    volume:        Joi.string().optional(),
    issue:         Joi.string().optional(),
    publishedDate: Joi.string().optional(),
    fileUrl:       Joi.string().optional().allow("")
  }).required()
})

const deleteDeptNewsletterSchema = Joi.object({
  newsletterId: Joi.string().required()
})


/* ─────────────────────────────
   DeptGalleryPhoto Schemas
─────────────────────────────*/

const listDeptGalleryPhotosSchema = Joi.object({
  deptId:     Joi.string().required(),
  tenantId:   Joi.string().optional().allow(null),
  search:     Joi.string().optional().allow("", null),
  category:   Joi.string().optional().allow(null),
  sortBy:     Joi.string().valid("title", "category", "capturedAt", "createdAt").optional().allow(null),
  sortOrder:  Joi.string().valid("asc", "desc").optional().allow(null),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null),
  pagination: Joi.object().optional().allow(null)
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
    galleryPhotoId: Joi.string().required(),
    title:          Joi.string().optional(),
    category:       Joi.string().optional(),
    imageUrl:       Joi.string().optional()
  }).required()
})

const deleteDeptGalleryPhotoSchema = Joi.object({
  galleryPhotoId: Joi.string().required()
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

  // ForumSection (alias: saveForumSectionSchema → createForumSectionSchema)
  listForumSectionsSchema,
  createForumSectionSchema,
  saveForumSectionSchema: createForumSectionSchema,
  updateForumSectionSchema,
  deleteForumSectionSchema,

  // ForumEvent
  listForumEventsSchema,
  createForumEventSchema,
  updateForumEventSchema,
  deleteForumEventSchema,

  // DepartmentActivityLog (aliases for handler names)
  listDepartmentActivityLogSchema,
  listDepartmentActivitiesSchema: listDepartmentActivityLogSchema,
  appendDepartmentActivitySchema,
  createDepartmentActivitySchema: appendDepartmentActivitySchema,
  updateDepartmentActivitySchema,
  deleteDepartmentActivitySchema,

  // DeptNewsletter (aliases: listNewslettersSchema etc.)
  listDeptNewslettersSchema,
  listNewslettersSchema:    listDeptNewslettersSchema,
  createDeptNewsletterSchema,
  createNewsletterSchema:   createDeptNewsletterSchema,
  updateDeptNewsletterSchema,
  updateNewsletterSchema:   updateDeptNewsletterSchema,
  deleteDeptNewsletterSchema,
  deleteNewsletterSchema:   deleteDeptNewsletterSchema,

  // DeptGalleryPhoto (aliases: listGalleryPhotosSchema etc.)
  listDeptGalleryPhotosSchema,
  listGalleryPhotosSchema:  listDeptGalleryPhotosSchema,
  createDeptGalleryPhotoSchema,
  createGalleryPhotoSchema: createDeptGalleryPhotoSchema,
  updateDeptGalleryPhotoSchema,
  updateGalleryPhotoSchema: updateDeptGalleryPhotoSchema,
  deleteDeptGalleryPhotoSchema,
  deleteGalleryPhotoSchema: deleteDeptGalleryPhotoSchema,

  // Event
  listEventsSchema,
  getEventSchema,
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
  approveEventSchema,
  rejectEventSchema,
  cancelEventSchema,
  togglePinEventSchema,
}
