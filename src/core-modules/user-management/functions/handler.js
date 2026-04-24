const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminDisableUserCommand, AdminEnableUserCommand, AdminUpdateUserAttributesCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
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

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

const userRepo = new MongoRepository({ model: User, primaryKey: 'user_id' });
const roleRepo = new MongoRepository({ model: Role, primaryKey: 'role_id' });

// Attach computed `role` (name string) to a user doc
async function withRole(user) {
  if (!user) return user;
  const roleId = user.roles?.[0];
  if (!roleId) return { ...user, role: null };
  const role = await Role.findOne({ role_id: roleId, tenant_id: user.tenant_id }).lean();
  return { ...user, role: role?.name || null };
}

async function handleEvent(event) {
  const ctx = resolveTenant(event);
  log(ctx, 'user-management', event.field);

  switch (event.field) {
    case 'getMe':
      return await getMe(ctx, event.arguments);
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

async function getMe(ctx, args) {
  // ctx.user_id is the Cognito sub from the JWT token
  const user = await User.findOne({ cognito_sub: ctx.user_id, tenant_id: ctx.tenant_id }).lean();
  if (!user) throw new NotFoundError('User not found');
  return withRole(user);
}

async function getUser(ctx, args) {
  const { user_id } = validate(getUserSchema, args || {});
  const doc = await userRepo.findById(ctx, user_id);
  if (!doc) throw new NotFoundError('User not found');
  return withRole(doc);
}

async function listUsers(ctx, args) {
  const validated = validate(listUsersSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  const result = await userRepo.findMany(ctx, {}, pagination);

  // Batch-resolve role names for all users
  const roleIds = [...new Set(result.items.map((u) => u.roles?.[0]).filter(Boolean))];
  let roleMap = {};
  if (roleIds.length > 0) {
    const roles = await Role.find({ role_id: { $in: roleIds }, tenant_id: ctx.tenant_id }).lean();
    roleMap = Object.fromEntries(roles.map((r) => [r.role_id, r.name]));
  }

  const items = result.items.map((u) => ({
    ...u,
    role: u.roles?.[0] ? (roleMap[u.roles[0]] || null) : null,
  }));

  return { items, nextCursor: result.nextCursor, pageInfo: result.pageInfo };
}

async function updateUser(ctx, args) {
  const validated = validate(updateUserSchema, { ...args, input: args?.input || args });
  const user_id = validated.user_id || validated.id;
  const input = validated.input || {};

  const existing = await userRepo.findById(ctx, user_id);
  if (!existing) throw new NotFoundError('User not found');

  const updates = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.profile !== undefined) updates.profile = input.profile;
  if (input.status !== undefined) updates.status = input.status;
  if (input.department !== undefined) updates.department = input.department;

  if (input.role !== undefined) {
    const role = await Role.findOne({ tenant_id: ctx.tenant_id, name: input.role }).lean();
    if (!role) throw new NotFoundError(`Role '${input.role}' not found`);

    // One admin per dept: if this role is exclusive per dept, check for conflicts
    const targetDept = input.department !== undefined ? input.department : existing.department;
    if (targetDept) {
      const conflict = await User.findOne({
        tenant_id: ctx.tenant_id,
        'roles.0': role.role_id,
        department: targetDept,
        status: { $ne: 'deactivated' },
        user_id: { $ne: user_id },
      }).lean();
      if (conflict && role.name.toLowerCase().includes('admin')) {
        throw new ConflictError(`A ${role.name} already exists for this department`);
      }
    }

    updates.roles = [role.role_id];
  }

  await userRepo.updateById(ctx, user_id, updates);

  // Sync status with Cognito
  if (input.status !== undefined && existing.email && USER_POOL_ID) {
    try {
      if (input.status === 'active') {
        await cognitoClient.send(new AdminEnableUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: existing.email,
        }));
      } else if (input.status === 'deactivated' || input.status === 'suspended') {
        await cognitoClient.send(new AdminDisableUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: existing.email,
        }));
      }
    } catch (err) {
      console.warn(JSON.stringify({ level: 'warn', message: 'Cognito status sync failed', error: err.message }));
    }
  }

  // Sync phone with Cognito if changed
  if (input.phone !== undefined && existing.email && USER_POOL_ID) {
    try {
      await cognitoClient.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: existing.email,
        UserAttributes: [
          { Name: 'phone_number', Value: input.phone || '' },
        ],
      }));
    } catch (err) {
      console.warn(JSON.stringify({ level: 'warn', message: 'Cognito phone sync failed', error: err.message }));
    }
  }

  if ((input.role !== undefined || input.status !== undefined) && existing.cognito_sub) {
    await invalidateUserPermissions(existing.cognito_sub);
  }

  return { success: true, message: 'User updated' };
}

async function inviteUser(ctx, args) {
  const input = validate(inviteUserSchema, args?.input || args || {});

  // Resolve role by name
  const role = await Role.findOne({ tenant_id: ctx.tenant_id, name: input.role }).lean();
  if (!role) throw new NotFoundError(`Role '${input.role}' not found`);

  // One admin per dept: block if this is an admin role and dept already has one
  if (input.department && role.name.toLowerCase().includes('admin')) {
    const conflict = await User.findOne({
      tenant_id: ctx.tenant_id,
      'roles.0': role.role_id,
      department: input.department,
      status: { $ne: 'deactivated' },
    }).lean();
    if (conflict) throw new ConflictError(`A ${role.name} already exists for this department`);
  }

  // Build Cognito attributes
  const userAttributes = [
    { Name: 'email', Value: input.email },
    { Name: 'email_verified', Value: 'true' },
    { Name: 'custom:tenant_id', Value: ctx.tenant_id },
    { Name: 'custom:department', Value: input.department || '' },
  ];
  if (input.phone) {
    userAttributes.push({ Name: 'phone_number', Value: input.phone });
    userAttributes.push({ Name: 'phone_number_verified', Value: 'false' });
  }

  // Create user in Cognito
  const cognitoResponse = await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: input.email,
    TemporaryPassword: input.password,
    UserAttributes: userAttributes,
    MessageAction: 'SUPPRESS',
  }));

  // Set password as permanent so user is immediately CONFIRMED (no FORCE_CHANGE_PASSWORD)
  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: input.email,
    Password: input.password,
    Permanent: true,
  }));

  const cognitoSub = cognitoResponse.User?.Attributes?.find((a) => a.Name === 'sub')?.Value || generateId();

  const user_id = generateId();
  const created = await userRepo.create(ctx, {
    user_id,
    cognito_sub: cognitoSub,
    email: input.email,
    name: input.name || input.email,
    phone: input.phone || null,
    department: input.department || null,
    status: 'active',
    roles: [role.role_id],
  });

  await publishEvent('user-management', 'UserInvited', {
    user_id: created.user_id,
    tenant_id: created.tenant_id,
    email: created.email,
    invited_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });

  // Send welcome email
  try {
    const sendWelcomeEmail = require('/opt/nodejs/email/sendWelcomeEmail');
    await sendWelcomeEmail({
      name: input.name || input.email,
      email: input.email,
      password: input.password,
      role: role.name,
      collegeName: process.env.COLLEGE_NAME || 'the platform',
      appUrl: process.env.APP_URL || 'https://yourdomain.com',
    });
  } catch (emailErr) {
    console.error('Welcome email failed:', emailErr.message);
  }

  return { success: true, message: 'User invited' };
}

async function deactivateUser(ctx, args) {
  const { user_id } = validate(deactivateUserSchema, { user_id: args?.user_id || args?.id });
  const existing = await userRepo.findById(ctx, user_id);
  if (!existing) throw new NotFoundError('User not found');

  const updated = await userRepo.updateById(ctx, user_id, { status: 'deactivated' });

  // Disable in Cognito (non-fatal if it fails)
  if (USER_POOL_ID && existing.email) {
    try {
      await cognitoClient.send(new AdminDisableUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: existing.email,
      }));
    } catch (err) {
      console.warn(JSON.stringify({ level: 'warn', message: 'Failed to disable Cognito user', error: err.message }));
    }
  }

  if (existing.cognito_sub) {
    await invalidateUserPermissions(existing.cognito_sub);
  }

  await publishEvent('user-management', 'UserDeactivated', {
    user_id,
    tenant_id: ctx.tenant_id,
    deactivated_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });

  return { success: true, message: 'User deactivated' };
}

async function listRoles(ctx, args) {
  const validated = validate(listRolesSchema, args || {});
  const pagination = normalizePagination(validated.pagination);
  const result = await roleRepo.findMany(ctx, {}, pagination);
  return result.items;
}

async function createRole(ctx, args) {
  const input = validate(createRoleSchema, args?.input || args || {});
  const role_id = generateId();
  const created = await roleRepo.create(ctx, {
    role_id,
    name: input.name,
    description: input.description,
    permissions: input.permissions || [],
    is_system: false,
  });
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
  if (!roles.includes(role_id)) {
    roles.push(role_id);
    await userRepo.updateById(ctx, user_id, { roles });
    if (user.cognito_sub) await invalidateUserPermissions(user.cognito_sub);
    await publishEvent('user-management', 'RoleAssigned', {
      user_id, role_id, tenant_id: ctx.tenant_id, assigned_by: ctx.user_id, timestamp: new Date().toISOString(),
    });
  }
  return { success: true, message: 'Role assigned' };
}

async function removeRole(ctx, args) {
  const { user_id, role_id } = validate(removeRoleSchema, args || {});
  const user = await userRepo.findById(ctx, user_id);
  if (!user) throw new NotFoundError('User not found');
  const roles = (user.roles || []).filter((r) => r !== role_id);
  await userRepo.updateById(ctx, user_id, { roles });
  if (user.cognito_sub) await invalidateUserPermissions(user.cognito_sub);
  return { success: true, message: 'Role removed' };
}
