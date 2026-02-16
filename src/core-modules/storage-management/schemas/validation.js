const Joi = require('joi');

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100),
  cursor: Joi.string().allow(''),
});

const getUploadUrlSchema = Joi.object({
  module: Joi.string(),
  entity_id: Joi.string(),
  extension: Joi.string(),
}).options({ stripUnknown: true });

const getDownloadUrlSchema = Joi.object({
  key: Joi.string().required(),
});

const deleteFileSchema = Joi.object({
  file_id: Joi.string().required(),
});

const listFilesSchema = Joi.object({
  module: Joi.string(),
  entity_id: Joi.string(),
  pagination: paginationSchema,
});

module.exports = {
  getUploadUrlSchema,
  getDownloadUrlSchema,
  deleteFileSchema,
  listFilesSchema,
};
