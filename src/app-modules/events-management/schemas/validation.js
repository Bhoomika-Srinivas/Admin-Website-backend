const Joi = require("joi")

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
    isMultiDay:  Joi.boolean().optional().allow(null),
    date:        Joi.string().optional().allow(null),
    time:        Joi.string().optional().allow(null),
    startDate:   Joi.string().optional().allow(null),
    startTime:   Joi.string().optional().allow(null),
    endDate:     Joi.string().optional().allow(null),
    endTime:     Joi.string().optional().allow(null),
    venue:       Joi.string().optional().allow(null),
    description: Joi.string().optional().allow(null),
    images:      Joi.array().items(Joi.string()).optional().allow(null),
    pinned:      Joi.boolean().optional().allow(null),
    level:       Joi.string().valid('institutional', 'department').required(),
    department:  Joi.string().optional().allow(null, '')
  }).required()
})

const updateEventSchema = Joi.object({
  input: Joi.object({
    eventId:        Joi.string().required(),
    title:          Joi.string().optional().allow(null),
    isMultiDay:     Joi.boolean().optional().allow(null),
    date:           Joi.string().optional().allow(null),
    time:           Joi.string().optional().allow(null),
    startDate:      Joi.string().optional().allow(null),
    startTime:      Joi.string().optional().allow(null),
    endDate:        Joi.string().optional().allow(null),
    endTime:        Joi.string().optional().allow(null),
    venue:          Joi.string().optional().allow(null),
    description:    Joi.string().optional().allow(null),
    images:         Joi.array().items(Joi.string()).optional().allow(null),
    pinned:         Joi.boolean().optional().allow(null),
    level:          Joi.string().valid('institutional', 'department').optional().allow(null),
    department:     Joi.string().optional().allow(null, ''),
    status:         Joi.string().valid('upcoming', 'completed', 'cancelled').optional().allow(null),
    approvalStatus: Joi.string().valid('pending', 'approved', 'rejected').optional().allow(null)
  }).required()
})

const deleteEventSchema     = Joi.object({ eventId: Joi.string().required() })
const approveEventSchema    = Joi.object({ eventId: Joi.string().required() })
const rejectEventSchema     = Joi.object({ eventId: Joi.string().required() })
const cancelEventSchema     = Joi.object({ eventId: Joi.string().required() })
const togglePinEventSchema  = Joi.object({ eventId: Joi.string().required() })

module.exports = {
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
