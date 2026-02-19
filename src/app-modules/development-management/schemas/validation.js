const Joi = require('joi');

/* ============================
   ID Schema
============================ */

const developmentIdSchema = Joi.object({
  development_id: Joi.string().required(),
});

/* ============================
   Pagination
============================ */

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100),
  cursor: Joi.string().allow(''),
});

/* ============================
   Create Development Work
============================ */

const createDevelopmentSchema = Joi.object({
  development_id: Joi.string(),

  constituency: Joi.string(),

  ward: Joi.string(),

  ward_no: Joi.string(),

  nameOfWork: Joi.string(),

  type: Joi.string(),

  location: Joi.string(),

  year: Joi.number().integer(),

  amount_spent: Joi.number(),

  amount_unit: Joi.string(),

  status: Joi.string(),

  imageUrl: Joi.string().uri().allow(''),

  view_on_tracker: Joi.boolean(),

  createdBy: Joi.string()

}).options({ stripUnknown: true });

/* ============================
   Update Input Schema
============================ */

const updateDevelopmentInputSchema = Joi.object({
  constituency: Joi.string(),

  ward: Joi.string(),

  ward_no: Joi.string(),

  nameOfWork: Joi.string(),

  type: Joi.string(),

  location: Joi.string(),

  year: Joi.number().integer(),

  amount_spent: Joi.number(),

  amount_unit: Joi.string(),

  status: Joi.string(),

  imageUrl: Joi.string().uri().allow(''),

  view_on_tracker: Joi.boolean(),

}).min(1).options({ stripUnknown: true });

/* ============================
   Update Schema
============================ */

const updateDevelopmentSchema = Joi.object({
  development_id: Joi.string(),
  id: Joi.string(),
  input: updateDevelopmentInputSchema,
}).or('development_id', 'id').options({ stripUnknown: true });

/* ============================
   List Schema
============================ */

const listDevelopmentSchema = Joi.object({
  constituency: Joi.string(),
  ward: Joi.string(),
  ward_no: Joi.string(),
  year: Joi.number().integer(),
  status: Joi.string(),
  type: Joi.string(),
  view_on_tracker: Joi.boolean(),
  pagination: paginationSchema
}).options({ stripUnknown: true });

module.exports = {
  getDevelopmentSchema: developmentIdSchema,
  listDevelopmentSchema,
  createDevelopmentSchema,
  updateDevelopmentSchema,
  deleteDevelopmentSchema: developmentIdSchema,
};
