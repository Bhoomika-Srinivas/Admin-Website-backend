const Joi = require('joi');

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100),
  cursor: Joi.string().allow(''),
});

const templateIdSchema = Joi.object({
  template_id: Joi.string().required(),
});

const createTemplateSchema = Joi.object({
  name: Joi.string().required(),
  channel: Joi.string().valid('email', 'sms', 'push', 'in_app'),
  subject: Joi.string(),
  body_html: Joi.string(),
  body_text: Joi.string(),
  variables: Joi.array().items(Joi.string()),
}).options({ stripUnknown: true });

const updatePreferenceSchema = Joi.object({
  user_id: Joi.string(),
  channels: Joi.object({
    email: Joi.boolean(),
    push: Joi.boolean(),
    in_app: Joi.boolean(),
  }),
  quiet_hours: Joi.object({
    start: Joi.string(),
    end: Joi.string(),
  }),
}).options({ stripUnknown: true });

module.exports = {
  createTemplateSchema,
  getTemplateSchema: templateIdSchema,
  listTemplatesSchema: Joi.object({ pagination: paginationSchema }),
  listNotificationsSchema: Joi.object({ pagination: paginationSchema }),
  updatePreferenceSchema,
};
