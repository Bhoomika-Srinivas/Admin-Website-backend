const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { validate } = require('/opt/nodejs/middleware/input-validator');
const { withConnection } = require('/opt/nodejs/middleware/with-connection');
const { log } = require('/opt/nodejs/middleware/request-logger');
const { publishEvent } = require('/opt/nodejs/utils/event-publisher');
const { generateId } = require('/opt/nodejs/utils/id-generator');
const { MongoRepository } = require('/opt/nodejs/db/mongo-repository');
const { NotFoundError, ConflictError } = require('/opt/nodejs/middleware/error-handler');
const { normalizePagination } = require('/opt/nodejs/utils/pagination');
const { invalidateUserPermissions } = require('/opt/nodejs/utils/redis-cache');
const {
  getUserSchema,
  listUsersSchema,
  updateUserSchema,
  inviteUserSchema,
  deactivateUserSchema,
  listRolesSchema,
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
  removeRoleSchema,
} = require('../schemas/validation');

const User = require('../schemas/user.model');
const Role = require('../schemas/role.model');

const userRepo = new MongoRepository({ model: User, primaryKey: 'user_id' });
const roleRepo = new MongoRepository({ model: Role, primaryKey: 'role_id' });

async function handleEvent(event) {
  const ctx = resolveTenant(event);
  log(ctx, 'user-management', event.field);

  switch (event.field) {
    case 'getUser':
      await requirePermission(ctx, 'user:user:read');
      return await getUser(ctx, event.arguments);
    case 'listUsers':
      await requirePermission(ctx, 'user:user:list');
      return await listUsers(ctx, event.arguments);
    case 'updateUser':
      await requirePermission(ctx, 'user:user:update');
      return await updateUser(ctx, event.arguments);
    case 'inviteUser':
      await requirePermission(ctx, 'user:user:invite');
      return await inviteUser(ctx, event.arguments);
    case 'deactivateUser':
      await requirePermission(ctx, 'user:user:deactivate');
      return await deactivateUser(ctx, event.arguments);
    case 'listRoles':
      await requirePermission(ctx, 'user:role:read');
      return await listRoles(ctx, event.arguments);
    case 'createRole':
      await requirePermission(ctx, 'user:role:create');
      return await createRole(ctx, event.arguments);
    case 'updateRole':
      await requirePermission(ctx, 'user:role:update');
      return await updateRole(ctx, event.arguments);
    case 'assignRole':
      await requirePermission(ctx, 'user:role:assign');
      return await assignRole(ctx, event.arguments);
    case 'removeRole':
      await requirePermission(ctx, 'user:role:remove');
      return await removeRole(ctx, event.arguments);
    default:
      throw new Error(`Unknown field: ${event.field}`);
  }
}

exports.handler = withConnection(handleEvent);

async function getUser(ctx, args) {
  const { user_id } = validate(getUserSchema, args || {});
  const doc = await userRepo.findById(ctx, user_id);
  if (!doc) throw new NotFoundError('User not found');
  return doc;
}

async function listUsers(ctx, args) {
  const validated = validate(listUsersSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  const result = await userRepo.findMany(ctx, {}, pagination);
  return { items: result.items, nextCursor: result.nextCursor };
}

async function updateUser(ctx, args) {
  const validated = validate(updateUserSchema, { ...args, input: args?.input || args });
  const user_id = validated.user_id || validated.id;
  const input = validated.input || {};
  const existing = await userRepo.findById(ctx, user_id);
  if (!existing) throw new NotFoundError('User not found');
  const updates = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.profile !== undefined) updates.profile = input.profile;
  if (input.status !== undefined) updates.status = input.status;
  const updated = await userRepo.updateById(ctx, user_id, updates);
  return updated;
}

async function inviteUser(ctx, args) {
  const input = validate(inviteUserSchema, args?.input || args || {});
  const email = input.email;
  const name = input.name;
  const user_id = generateId();

  const data = {
    user_id,
    tenant_id: ctx.tenant_id,
    cognito_sub: input.cognito_sub || generateId(), // FIXED
    email,
    name: name || email,
    status: 'invited',
    roles: ['member'],
    created_by: ctx.user_id,
  };

  const created = await userRepo.create(ctx, data);

  await publishEvent('user-management', 'UserInvited', {
    user_id: created.user_id,
    tenant_id: created.tenant_id,
    email: created.email,
    invited_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });

  return created;
}


async function deactivateUser(ctx, args) {
  const { user_id } = validate(deactivateUserSchema, { user_id: args?.user_id || args?.id });
  const existing = await userRepo.findById(ctx, user_id);
  if (!existing) throw new NotFoundError('User not found');
  const updated = await userRepo.updateById(ctx, user_id, { status: 'deactivated' });
  await publishEvent('user-management', 'UserDeactivated', {
    user_id,
    tenant_id: ctx.tenant_id,
    deactivated_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });
  return updated;
}

async function listRoles(ctx, args) {
  const validated = validate(listRolesSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  const result = await roleRepo.findMany(ctx, {}, pagination);
  return { items: result.items, nextCursor: result.nextCursor };
}

async function createRole(ctx, args) {
  const input = validate(createRoleSchema, args?.input || args || {});
  const role_id = generateId();
  const data = {
    role_id,
    name: input.name,
    description: input.description,
    permissions: input.permissions || [],
    is_system: false,
  };
  const created = await roleRepo.create(ctx, data);
  return created;
}

async function updateRole(ctx, args) {
  const validated = validate(updateRoleSchema, { ...args, input: args?.input || args });
  const role_id = validated.role_id || validated.id;
  const input = validated.input || {};
  const existing = await roleRepo.findById(ctx, role_id);
  if (!existing) throw new NotFoundError('Role not found');
  if (existing.is_system) throw new ConflictError('Cannot update system role');
  const updates = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.permissions !== undefined) updates.permissions = input.permissions;
  return await roleRepo.updateById(ctx, role_id, updates);
}

async function assignRole(ctx, args) {
  const { user_id, role_id } = validate(assignRoleSchema, args || {});
  const user = await userRepo.findById(ctx, user_id);
  if (!user) throw new NotFoundError('User not found');
  const role = await roleRepo.findById(ctx, role_id);
  if (!role) throw new NotFoundError('Role not found');
  const roles = [...(user.roles || [])];
  if (roles.includes(role_id)) return user;
  roles.push(role_id);
  const updated = await userRepo.updateById(ctx, user_id, { roles });
  // Invalidate cache for this user
  if (user.cognito_sub) {
    await invalidateUserPermissions(user.cognito_sub);
  }
  await publishEvent('user-management', 'RoleAssigned', {
    user_id,
    role_id,
    tenant_id: ctx.tenant_id,
    assigned_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });
  return updated;
}

async function removeRole(ctx, args) {
  const { user_id, role_id } = validate(removeRoleSchema, args || {});
  const user = await userRepo.findById(ctx, user_id);
  if (!user) throw new NotFoundError('User not found');
  const roles = (user.roles || []).filter((r) => r !== role_id);
  const updated = await userRepo.updateById(ctx, user_id, { roles });
  // Invalidate cache for this user
  if (user.cognito_sub) {
    await invalidateUserPermissions(user.cognito_sub);
  }
  return updated;
}
