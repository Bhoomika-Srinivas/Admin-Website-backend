const Joi = require("joi")

/* ── Scheme Syllabus ── */

const listSchemeSyllabusSchema = Joi.object({
  tenantId:  Joi.string().optional().allow(null),
  limit:     Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken: Joi.string().optional().allow(null)
})

const createSchemeSyllabusSchema = Joi.object({
  year:     Joi.string().required(),
  category: Joi.string().required(),
  title:    Joi.string().min(1).required(),
  subtitle: Joi.string().optional().allow(null, ''),
  fileUrl:  Joi.string().optional().allow(null, ''),
  order:    Joi.number().integer().optional().allow(null)
})

const updateSchemeSyllabusSchema = Joi.object({
  syllabusId: Joi.string().required(),
  year:       Joi.string().optional().allow(null),
  category:   Joi.string().optional().allow(null, ''),
  title:      Joi.string().min(1).optional().allow(null),
  subtitle:   Joi.string().optional().allow(null, ''),
  fileUrl:    Joi.string().optional().allow(null, ''),
  order:      Joi.number().integer().optional().allow(null)
})

const deleteSchemeSyllabusSchema = Joi.object({
  syllabusId: Joi.string().required()
})

/* ── Academic Calendar ── */

const listAcademicCalendarSchema = Joi.object({
  tenantId:   Joi.string().optional().allow(null),
  type:       Joi.string().valid('CURRENT', 'HISTORIC').optional().allow(null),
  authority:  Joi.string().valid('INSTITUTE', 'VTU').optional().allow(null),
  program:    Joi.string().valid('UG', 'PG').optional().allow(null),
  year:       Joi.string().optional().allow(null, ''),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null)
})

const createAcademicCalendarSchema = Joi.object({
  title:       Joi.string().min(1).required(),
  description: Joi.string().optional().allow(null, ''),
  type:        Joi.string().valid('CURRENT', 'HISTORIC').required(),
  authority:   Joi.string().valid('INSTITUTE', 'VTU').required(),
  program:     Joi.string().valid('UG', 'PG').required(),
  semester:    Joi.string().optional().allow(null, ''),
  year:        Joi.string().required(),
  date:        Joi.date().optional().allow(null),
  fileUrl:     Joi.string().optional().allow(null, '')
})

const updateAcademicCalendarSchema = Joi.object({
  calendarId:  Joi.string().required(),
  title:       Joi.string().min(1).optional().allow(null),
  description: Joi.string().optional().allow(null, ''),
  type:        Joi.string().valid('CURRENT', 'HISTORIC').optional().allow(null),
  authority:   Joi.string().valid('INSTITUTE', 'VTU').optional().allow(null),
  program:     Joi.string().valid('UG', 'PG').optional().allow(null),
  semester:    Joi.string().optional().allow(null, ''),
  year:        Joi.string().optional().allow(null),
  date:        Joi.date().optional().allow(null),
  fileUrl:     Joi.string().optional().allow(null, '')
})

const deleteAcademicCalendarSchema = Joi.object({
  calendarId: Joi.string().required()
})

/* ── Rules & Regulations (Singleton) ── */

const updateRulesRegulationsSchema = Joi.object({
  serviceRulesFile: Joi.string().optional().allow(null, ''),
  serviceRulesText: Joi.string().optional().allow(null, ''),
  attendanceFile:   Joi.string().optional().allow(null, ''),
  attendanceText:   Joi.string().optional().allow(null, ''),
  disciplineFile:   Joi.string().optional().allow(null, ''),
  disciplineText:   Joi.string().optional().allow(null, '')
})

/* ── Rank Holders ── */

const listRankHoldersSchema = Joi.object({
  tenantId:  Joi.string().optional().allow(null),
  year:      Joi.string().optional().allow(null, ''),
  program:   Joi.string().valid('UG', 'PG').optional().allow(null),
  limit:     Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken: Joi.string().optional().allow(null)
})

const createRankHolderSchema = Joi.object({
  year:        Joi.string().required(),
  program:     Joi.string().valid('UG', 'PG').required(),
  usn:         Joi.string().required(),
  studentName: Joi.string().min(1).required(),
  branch:      Joi.string().required(),
  rank:        Joi.string().required(),
  rankOrder:   Joi.number().integer().optional().allow(null)
})

const updateRankHolderSchema = Joi.object({
  rankId:      Joi.string().required(),
  year:        Joi.string().optional().allow(null),
  program:     Joi.string().valid('UG', 'PG').optional().allow(null),
  usn:         Joi.string().optional().allow(null, ''),
  studentName: Joi.string().min(1).optional().allow(null),
  branch:      Joi.string().optional().allow(null, ''),
  rank:        Joi.string().optional().allow(null, ''),
  rankOrder:   Joi.number().integer().optional().allow(null)
})

const deleteRankHolderSchema = Joi.object({
  rankId: Joi.string().required()
})

module.exports = {
  listSchemeSyllabusSchema,
  createSchemeSyllabusSchema,
  updateSchemeSyllabusSchema,
  deleteSchemeSyllabusSchema,
  listAcademicCalendarSchema,
  createAcademicCalendarSchema,
  updateAcademicCalendarSchema,
  deleteAcademicCalendarSchema,
  updateRulesRegulationsSchema,
  listRankHoldersSchema,
  createRankHolderSchema,
  updateRankHolderSchema,
  deleteRankHolderSchema
}
