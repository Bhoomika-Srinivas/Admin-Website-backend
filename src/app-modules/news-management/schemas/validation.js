const Joi = require('joi');

/* ============================
   ID Schema
============================ */

const newsIdSchema = Joi.object({
  news_id: Joi.string().required(),
});

/* ============================
   Pagination
============================ */

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100),
  cursor: Joi.string().allow('')
});

/* ============================
   Create News
============================ */

const createNewsSchema = Joi.object({
  news_id: Joi.string(),

  constituency: Joi.string().required(),

  ward: Joi.string().required(),

  dateTime: Joi.date().required(),

  information: Joi.string().required(),

  incidentType: Joi.string().required(),

  imageUrl: Joi.string().uri().allow('')
}).options({ stripUnknown: true });

/* ============================
   Update Input
============================ */

const updateNewsInputSchema = Joi.object({
  constituency: Joi.string(),

  ward: Joi.string(),

  dateTime: Joi.date(),

  information: Joi.string(),

  incidentType: Joi.string(),

  imageUrl: Joi.string().uri().allow('')
}).min(1).options({ stripUnknown: true });

/* ============================
   Update Schema
============================ */

const updateNewsSchema = Joi.object({
  news_id: Joi.string(),
  id: Joi.string(),
  input: updateNewsInputSchema
}).or('news_id', 'id').options({ stripUnknown: true });

/* ============================
   List Schema
============================ */

const listNewsSchema = Joi.object({
  constituency: Joi.string(),
  ward: Joi.string(),
  incidentType: Joi.string(),
  pagination: paginationSchema
}).options({ stripUnknown: true });

module.exports = {
  getNewsSchema: newsIdSchema,
  listNewsSchema,
  createNewsSchema,
  updateNewsSchema,
  deleteNewsSchema: newsIdSchema
};
