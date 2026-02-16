const Joi = require('joi');

const tenantIdSchema = Joi.object({
  tenant_id: Joi.string().required(),
});

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100),
  cursor: Joi.string().allow(''),
});

const createTenantSchema = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string().allow(''),
  plan: Joi.string().valid('free', 'starter', 'pro', 'enterprise'),
  owner_user_id: Joi.string(),
  config: Joi.object({
    features_enabled: Joi.array().items(Joi.string()),
    max_users: Joi.number().integer().min(0),
    branding: Joi.object({
      logo_url: Joi.string(),
      primary_color: Joi.string(),
    }),
  }),
}).options({ stripUnknown: true });

const updateTenantInputSchema = Joi.object({
  name: Joi.string(),
  slug: Joi.string(),
  plan: Joi.string().valid('free', 'starter', 'pro', 'enterprise'),
  config: Joi.object({
    features_enabled: Joi.array().items(Joi.string()),
    max_users: Joi.number().integer().min(0),
    branding: Joi.object({
      logo_url: Joi.string(),
      primary_color: Joi.string(),
    }),
  }),
}).min(1).options({ stripUnknown: true });

const updateTenantSchema = Joi.object({
  tenant_id: Joi.string(),
  id: Joi.string(),
  input: updateTenantInputSchema,
}).or('tenant_id', 'id').options({ stripUnknown: true });

module.exports = {
  getTenantSchema: tenantIdSchema,
  listTenantsSchema: Joi.object({ pagination: paginationSchema }),
  createTenantSchema,
  updateTenantSchema,
  suspendTenantSchema: tenantIdSchema,
};
