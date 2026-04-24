const Joi = require('joi');

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100),
  page: Joi.number().integer().min(1),
  cursor: Joi.string().allow(''),
}).allow(null);

const userIdSchema = Joi.object({
  user_id: Joi.string().required(),
}).options({ stripUnknown: true });

const updateUserInputSchema = Joi.object({
  name: Joi.string(),
  phone: Joi.string().allow('', null),
  profile: Joi.any(),
  status: Joi.string().valid('active', 'invited', 'suspended', 'deactivated'),
  role: Joi.string(),
  department: Joi.string().allow('', null),
}).min(1).options({ stripUnknown: true });

const updateUserSchema = Joi.object({
  user_id: Joi.string(),
  id: Joi.string(),
  input: updateUserInputSchema,
}).or('user_id', 'id').options({ stripUnknown: true });

const roleIdSchema = Joi.object({
  role_id: Joi.string().required(),
}).options({ stripUnknown: true });

const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string(),
  phone: Joi.string().allow('', null),
  role: Joi.string().required(),
  department: Joi.string().allow('', null),
  password: Joi.string().required(),
}).options({ stripUnknown: true });

const createRoleSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
  permissions: Joi.array().items(Joi.string()),
}).options({ stripUnknown: true });

const updateRoleInputSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  permissions: Joi.array().items(Joi.string()),
}).min(1).options({ stripUnknown: true });

const updateRoleSchema = Joi.object({
  role_id: Joi.string(),
  id: Joi.string(),
  input: updateRoleInputSchema,
}).or('role_id', 'id').options({ stripUnknown: true });

const assignRoleSchema = Joi.object({
  user_id: Joi.string().required(),
  role_id: Joi.string().required(),
}).options({ stripUnknown: true });

const removeRoleSchema = assignRoleSchema;

module.exports = {
  getUserSchema: userIdSchema,
  listUsersSchema: Joi.object({ pagination: paginationSchema }),
  updateUserSchema,
  inviteUserSchema,
  deactivateUserSchema: userIdSchema,
  listRolesSchema: Joi.object({ pagination: paginationSchema }),
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
  removeRoleSchema,
};
