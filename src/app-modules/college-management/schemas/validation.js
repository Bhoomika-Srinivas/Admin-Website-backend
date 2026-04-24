const Joi = require('joi')

const COLLEGE_TYPES = [
  'private_aided',
  'private_unaided',
  'government',
  'government_aided',
  'autonomous',
  'deemed_university',
  'central_university',
]

const upsertCollegeProfileSchema = Joi.object({
  logo_url:             Joi.string().allow('', null).optional(),
  name:                 Joi.string().allow('', null).optional(),
  shortName:            Joi.string().allow('', null).optional(),
  established:          Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null).optional(),
  affiliatedUniversity: Joi.string().allow('', null).optional(),
  collegeType:          Joi.string().valid(...COLLEGE_TYPES).allow(null).optional(),
  address:              Joi.string().allow('', null).optional(),
  city:                 Joi.string().allow('', null).optional(),
  state:                Joi.string().allow('', null).optional(),
  pincode:              Joi.string().allow('', null).optional(),
  phone:                Joi.string().allow('', null).optional(),
  email:                Joi.string().email({ tlds: { allow: false } }).allow('', null).optional(),
  website:              Joi.string().uri().allow('', null).optional(),
}).min(1)

module.exports = { upsertCollegeProfileSchema }
