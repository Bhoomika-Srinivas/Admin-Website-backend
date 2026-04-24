const Joi = require('joi')

/* ─── Alumni ──────────────────────────────────────────────────────────────── */

const getAlumniSchema = Joi.object({
  alumniId: Joi.string().required(),
})

const listAlumniSchema = Joi.object({
  department: Joi.string().optional().allow(null, ''),
  batch:      Joi.string().optional().allow(null, ''),
  search:     Joi.string().optional().allow(null, ''),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null, ''),
})

const createAlumniSchema = Joi.object({
  input: Joi.object({
    name:        Joi.string().min(1).required(),
    batch:       Joi.string().required(),
    department:  Joi.string().optional().allow(null, ''),
    company:     Joi.string().optional().allow(null, ''),
    designation: Joi.string().optional().allow(null, ''),
    location:    Joi.string().optional().allow(null, ''),
    email:       Joi.string().email().optional().allow(null, ''),
    linkedin:    Joi.string().optional().allow(null, ''),
    image:       Joi.string().optional().allow(null, ''),
  }).required(),
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
    email:       Joi.string().email().optional().allow(null, ''),
    linkedin:    Joi.string().optional().allow(null, ''),
    image:       Joi.string().optional().allow(null, ''),
  }).required(),
})

const deleteAlumniSchema = Joi.object({
  alumniId: Joi.string().required(),
})

/* ─── AlumniEvent ─────────────────────────────────────────────────────────── */

const getAlumniEventSchema = Joi.object({
  eventId: Joi.string().required(),
})

const listAlumniEventsSchema = Joi.object({
  department: Joi.string().optional().allow(null, ''),
  status:     Joi.string().optional().allow(null, ''),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null, ''),
})

const createAlumniEventSchema = Joi.object({
  input: Joi.object({
    title:       Joi.string().min(1).required(),
    date:        Joi.string().optional().allow(null, ''),
    time:        Joi.string().optional().allow(null, ''),
    department:  Joi.string().optional().allow(null, ''),
    location:    Joi.string().optional().allow(null, ''),
    description: Joi.string().optional().allow(null, ''),
    image:       Joi.string().optional().allow(null, ''),
    status:      Joi.string().valid('upcoming', 'completed', 'cancelled').optional(),
  }).required(),
})

const updateAlumniEventSchema = Joi.object({
  input: Joi.object({
    eventId:     Joi.string().required(),
    title:       Joi.string().min(1).optional(),
    date:        Joi.string().optional().allow(null, ''),
    time:        Joi.string().optional().allow(null, ''),
    department:  Joi.string().optional().allow(null, ''),
    location:    Joi.string().optional().allow(null, ''),
    description: Joi.string().optional().allow(null, ''),
    image:       Joi.string().optional().allow(null, ''),
    status:      Joi.string().valid('upcoming', 'completed', 'cancelled').optional(),
  }).required(),
})

const deleteAlumniEventSchema = Joi.object({
  eventId: Joi.string().required(),
})

/* ─── TimelineEntry ───────────────────────────────────────────────────────── */

const listTimelineEntriesSchema = Joi.object({
  limit:     Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken: Joi.string().optional().allow(null, ''),
})

const createTimelineEntrySchema = Joi.object({
  input: Joi.object({
    year:        Joi.string().required(),
    title:       Joi.string().min(1).required(),
    description: Joi.string().optional().allow(null, ''),
    order:       Joi.number().integer().optional().allow(null),
    isActive:    Joi.boolean().optional(),
  }).required(),
})

const updateTimelineEntrySchema = Joi.object({
  input: Joi.object({
    entryId:     Joi.string().required(),
    year:        Joi.string().optional(),
    title:       Joi.string().min(1).optional(),
    description: Joi.string().optional().allow(null, ''),
    order:       Joi.number().integer().optional().allow(null),
    isActive:    Joi.boolean().optional(),
  }).required(),
})

const deleteTimelineEntrySchema = Joi.object({
  entryId: Joi.string().required(),
})

/* ─── VisionMission ───────────────────────────────────────────────────────── */

const upsertVisionMissionSchema = Joi.object({
  input: Joi.object({
    vision:     Joi.string().optional().allow(null, ''),
    mission:    Joi.string().optional().allow(null, ''),
    objectives: Joi.string().optional().allow(null, ''),
  }).required(),
})

/* ─── CommitteeMember ─────────────────────────────────────────────────────── */

const listCommitteeMembersSchema = Joi.object({
  roleType:  Joi.string().optional().allow(null, ''),
  limit:     Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken: Joi.string().optional().allow(null, ''),
})

const createCommitteeMemberSchema = Joi.object({
  input: Joi.object({
    name:         Joi.string().min(1).required(),
    roleType:     Joi.string().optional().allow(null, ''),
    designation:  Joi.string().optional().allow(null, ''),
    department:   Joi.string().optional().allow(null, ''),
    organization: Joi.string().optional().allow(null, ''),
    profileImage: Joi.string().optional().allow(null, ''),
    order:        Joi.number().integer().optional().allow(null),
  }).required(),
})

const updateCommitteeMemberSchema = Joi.object({
  input: Joi.object({
    memberId:     Joi.string().required(),
    name:         Joi.string().min(1).optional(),
    roleType:     Joi.string().optional().allow(null, ''),
    designation:  Joi.string().optional().allow(null, ''),
    department:   Joi.string().optional().allow(null, ''),
    organization: Joi.string().optional().allow(null, ''),
    profileImage: Joi.string().optional().allow(null, ''),
    order:        Joi.number().integer().optional().allow(null),
  }).required(),
})

const deleteCommitteeMemberSchema = Joi.object({
  memberId: Joi.string().required(),
})

/* ─── DeanMessage ─────────────────────────────────────────────────────────── */

const upsertDeanMessageSchema = Joi.object({
  input: Joi.object({
    name:        Joi.string().optional().allow(null, ''),
    role:        Joi.string().optional().allow(null, ''),
    department:  Joi.string().optional().allow(null, ''),
    designation: Joi.string().optional().allow(null, ''),
    message:     Joi.string().optional().allow(null, ''),
    image:       Joi.string().optional().allow(null, ''),
    isActive:    Joi.boolean().optional(),
  }).required(),
})

/* ─── Coordinator ─────────────────────────────────────────────────────────── */

const listCoordinatorsSchema = Joi.object({
  roleType:   Joi.string().optional().allow(null, ''),
  department: Joi.string().optional().allow(null, ''),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null, ''),
})

const createCoordinatorSchema = Joi.object({
  input: Joi.object({
    name:       Joi.string().min(1).required(),
    roleType:   Joi.string().optional().allow(null, ''),
    department: Joi.string().optional().allow(null, ''),
    email:      Joi.string().email().optional().allow(null, ''),
    isActive:   Joi.boolean().optional(),
  }).required(),
})

const updateCoordinatorSchema = Joi.object({
  input: Joi.object({
    coordinatorId: Joi.string().required(),
    name:          Joi.string().min(1).optional(),
    roleType:      Joi.string().optional().allow(null, ''),
    department:    Joi.string().optional().allow(null, ''),
    email:         Joi.string().email().optional().allow(null, ''),
    isActive:      Joi.boolean().optional(),
  }).required(),
})

const deleteCoordinatorSchema = Joi.object({
  coordinatorId: Joi.string().required(),
})

/* ─── DistinguishedAlumnus ────────────────────────────────────────────────── */

const listDistinguishedAlumniSchema = Joi.object({
  department: Joi.string().optional().allow(null, ''),
  isFeatured: Joi.boolean().optional().allow(null),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null, ''),
})

const createDistinguishedAlumnusSchema = Joi.object({
  input: Joi.object({
    name:         Joi.string().min(1).required(),
    department:   Joi.string().optional().allow(null, ''),
    batchYear:    Joi.string().optional().allow(null, ''),
    currentRole:  Joi.string().optional().allow(null, ''),
    company:      Joi.string().optional().allow(null, ''),
    linkedinUrl:  Joi.string().optional().allow(null, ''),
    profileImage: Joi.string().optional().allow(null, ''),
    isFeatured:   Joi.boolean().optional(),
    isActive:     Joi.boolean().optional(),
  }).required(),
})

const updateDistinguishedAlumnusSchema = Joi.object({
  input: Joi.object({
    distinguishedAlumnusId: Joi.string().required(),
    name:                   Joi.string().min(1).optional(),
    department:             Joi.string().optional().allow(null, ''),
    batchYear:              Joi.string().optional().allow(null, ''),
    currentRole:            Joi.string().optional().allow(null, ''),
    company:                Joi.string().optional().allow(null, ''),
    linkedinUrl:            Joi.string().optional().allow(null, ''),
    profileImage:           Joi.string().optional().allow(null, ''),
    isFeatured:             Joi.boolean().optional(),
    isActive:               Joi.boolean().optional(),
  }).required(),
})

const deleteDistinguishedAlumnusSchema = Joi.object({
  distinguishedAlumnusId: Joi.string().required(),
})

/* ─── RegistrationSettings ────────────────────────────────────────────────── */

const upsertRegistrationSettingsSchema = Joi.object({
  input: Joi.object({
    title:            Joi.string().optional().allow(null, ''),
    description:      Joi.string().optional().allow(null, ''),
    registrationLink: Joi.string().optional().allow(null, ''),
  }).required(),
})

/* ─── AlumniContact ───────────────────────────────────────────────────────── */

const listAlumniContactsSchema = Joi.object({
  department: Joi.string().optional().allow(null, ''),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null, ''),
})

const createAlumniContactSchema = Joi.object({
  input: Joi.object({
    name:        Joi.string().min(1).required(),
    roleType:    Joi.string().optional().allow(null, ''),
    department:  Joi.string().optional().allow(null, ''),
    designation: Joi.string().optional().allow(null, ''),
    email:       Joi.string().email().optional().allow(null, ''),
  }).required(),
})

const updateAlumniContactSchema = Joi.object({
  input: Joi.object({
    contactId:   Joi.string().required(),
    name:        Joi.string().min(1).optional(),
    roleType:    Joi.string().optional().allow(null, ''),
    department:  Joi.string().optional().allow(null, ''),
    designation: Joi.string().optional().allow(null, ''),
    email:       Joi.string().email().optional().allow(null, ''),
  }).required(),
})

const deleteAlumniContactSchema = Joi.object({
  contactId: Joi.string().required(),
})

/* ─── Exports ─────────────────────────────────────────────────────────────── */

module.exports = {
  // Alumni
  getAlumniSchema,
  listAlumniSchema,
  createAlumniSchema,
  updateAlumniSchema,
  deleteAlumniSchema,
  // AlumniEvent
  getAlumniEventSchema,
  listAlumniEventsSchema,
  createAlumniEventSchema,
  updateAlumniEventSchema,
  deleteAlumniEventSchema,
  // TimelineEntry
  listTimelineEntriesSchema,
  createTimelineEntrySchema,
  updateTimelineEntrySchema,
  deleteTimelineEntrySchema,
  // VisionMission
  upsertVisionMissionSchema,
  // CommitteeMember
  listCommitteeMembersSchema,
  createCommitteeMemberSchema,
  updateCommitteeMemberSchema,
  deleteCommitteeMemberSchema,
  // DeanMessage
  upsertDeanMessageSchema,
  // Coordinator
  listCoordinatorsSchema,
  createCoordinatorSchema,
  updateCoordinatorSchema,
  deleteCoordinatorSchema,
  // DistinguishedAlumnus
  listDistinguishedAlumniSchema,
  createDistinguishedAlumnusSchema,
  updateDistinguishedAlumnusSchema,
  deleteDistinguishedAlumnusSchema,
  // RegistrationSettings
  upsertRegistrationSettingsSchema,
  // AlumniContact
  listAlumniContactsSchema,
  createAlumniContactSchema,
  updateAlumniContactSchema,
  deleteAlumniContactSchema,
}
