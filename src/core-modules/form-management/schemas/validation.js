const Joi = require('joi');

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100),
  cursor: Joi.string().allow(''),
});

const formIdSchema = Joi.object({
  form_id: Joi.string().required(),
});

const createFormSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  fields: Joi.array().items(Joi.any()),
  settings: Joi.object(),
}).options({ stripUnknown: true });

const submitFormSchema = Joi.object({
  form_id: Joi.string().required(),
  responses: Joi.array().items(Joi.any()),
}).options({ stripUnknown: true });

const listSubmissionsSchema = Joi.object({
  form_id: Joi.string(),
  pagination: paginationSchema,
});

module.exports = {
  createFormSchema,
  getFormSchema: formIdSchema,
  listFormsSchema: Joi.object({ pagination: paginationSchema }),
  publishFormSchema: formIdSchema,
  submitFormSchema,
  listSubmissionsSchema,
};
