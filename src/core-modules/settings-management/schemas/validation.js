const Joi = require('joi');

const listSettingsSchema = Joi.object({
  category: Joi.string().allow('', null),
}).options({ stripUnknown: true });

const getSettingSchema = Joi.object({
  key: Joi.string().required(),
}).options({ stripUnknown: true });

const createSettingSchema = Joi.object({
  input: Joi.object({
    key: Joi.string().required(),
    value: Joi.string().required(),
    category: Joi.string().allow('', null),
    sensitivity: Joi.string().valid('high', 'low').default('low'),
  }).required(),
}).options({ stripUnknown: true });

const updateSettingSchema = Joi.object({
  key: Joi.string().required(),
  input: Joi.object({
    value: Joi.string().required(),
    category: Joi.string().allow('', null),
    sensitivity: Joi.string().valid('high', 'low'),
  }).required(),
}).options({ stripUnknown: true });

const deleteSettingSchema = Joi.object({
  key: Joi.string().required(),
}).options({ stripUnknown: true });

module.exports = {
  listSettingsSchema,
  getSettingSchema,
  createSettingSchema,
  updateSettingSchema,
  deleteSettingSchema,
};
