const Joi = require('joi');

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100),
  cursor: Joi.string().allow(''),
  page: Joi.number().integer().min(1),
}).allow(null);

const getWorkflowSchema = Joi.object({
  workflow_id: Joi.string().required(),
});

const listWorkflowsSchema = Joi.object({
  pagination: paginationSchema,
});

const listWorkflowInstancesSchema = Joi.object({
  workflow_id: Joi.string(),
  pagination: paginationSchema,
});

module.exports = {
  getWorkflowSchema,
  listWorkflowsSchema,
  listWorkflowInstancesSchema,
};
