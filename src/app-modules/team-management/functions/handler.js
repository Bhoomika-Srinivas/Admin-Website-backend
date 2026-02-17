const { resolveTenant } = require('/opt/nodejs/middleware/tenant-resolver');
const { requirePermission } = require('/opt/nodejs/middleware/auth-guard');
const { validate } = require('/opt/nodejs/middleware/input-validator');
const { withConnection } = require('/opt/nodejs/middleware/with-connection');
const { log } = require('/opt/nodejs/middleware/request-logger');
const { publishEvent } = require('/opt/nodejs/utils/event-publisher');
const { generateId } = require('/opt/nodejs/utils/id-generator');
const { MongoRepository } = require('/opt/nodejs/db/mongo-repository');
const { NotFoundError } = require('/opt/nodejs/middleware/error-handler');
const { normalizePagination } = require('/opt/nodejs/utils/pagination');

const {
  getTeamSchema,
  listTeamSchema,
  createTeamSchema,
  updateTeamSchema,
  deleteTeamSchema,
} = require('../schemas/team.validation');
const Team = require('../schemas/team.model');
const teamRepo = new MongoRepository({ model: Team, primaryKey: 'team_id' });



/* ============================
   MAIN HANDLER
============================ */

async function handleEvent(event) {
  const ctx = resolveTenant(event);
  log(ctx, 'team-management', event.field);

  switch (event.field) {
    case 'getTeam':
      await requirePermission(ctx, 'team:team:read');
      return await getTeam(ctx, event.arguments);

    case 'listTeams':
      await requirePermission(ctx, 'team:team:list');
      return await listTeams(ctx, event.arguments);

    case 'createTeam':
      await requirePermission(ctx, 'team:team:create');
      return await createTeam(ctx, event.arguments);

    case 'updateTeam':
      await requirePermission(ctx, 'team:team:update');
      return await updateTeam(ctx, event.arguments);

    case 'deleteTeam':
      await requirePermission(ctx, 'team:team:delete');
      return await deleteTeam(ctx, event.arguments);

    default:
      throw new Error(`Unknown field: ${event.field}`);
  }
}

exports.handler = withConnection(handleEvent);

/* ============================
   GET TEAM
============================ */

async function getTeam(ctx, args) {
  const { team_id } = validate(getTeamSchema, args || {});
  const doc = await teamRepo.findById(ctx, team_id);

  if (!doc) throw new NotFoundError('Team not found');

  return doc;
}

/* ============================
   LIST TEAMS
============================ */

async function listTeams(ctx, args) {
  const validated = validate(listTeamSchema, args || {});
  const pagination = normalizePagination(validated.pagination);

  const filters = {};

  if (validated.constituency) filters.constituency = validated.constituency;
  if (validated.ward) filters.ward = validated.ward;
  if (validated.group) filters.group = validated.group;
  if (validated.category) filters.category = validated.category;
  if (validated.role) filters.role = validated.role;
  if (validated.status) filters.status = validated.status;

  // 🔍 Search by name
  if (validated.search) {
    filters.name = { $regex: validated.search, $options: 'i' };
  }

  // 🔽 Sorting
  const sort = {};
  if (validated.sortBy === 'name') {
    sort.name = validated.sortOrder === 'desc' ? -1 : 1;
  }

  const result = await teamRepo.findMany(ctx, filters, pagination, sort);

  return {
    items: result.items,
    nextCursor: result.nextCursor,
  };
}

/* ============================
   CREATE TEAM
============================ */

const mongoose = require('mongoose');

async function createTeam(ctx, args) {
  const input = validate(createTeamSchema, args?.input || args || {});
  const team_id = generateId();

  // 🔎 Validate that ctx.user_id exists
  if (!ctx.user_id) {
    throw new Error('Authenticated user ID missing');
  }

  // Convert user_id (which should be Mongo _id) to ObjectId
  let createdBy;

  try {
    createdBy = new mongoose.Types.ObjectId(ctx.user_id);
  } catch (err) {
    throw new Error('Invalid user ObjectId');
  }

  const data = {
    team_id,
    name: input.name,
    constituency: input.constituency,
    ward: input.ward,
    group: input.group,
    category: input.category,
    role: input.role,
    remarks: input.remarks,
    contact: input.contact,
    childId: input.childId || null,
    status: input.status || 'ACTIVE',
    createdBy,  // ✅ Proper ObjectId stored
  };

  const created = await teamRepo.create(ctx, data);

  await publishEvent('team-management', 'TeamCreated', {
    team_id: created.team_id,
    created_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });

  return created;
}


/* ============================
   UPDATE TEAM
============================ */

async function updateTeam(ctx, args) {
  const validated = validate(updateTeamSchema, { ...args, input: args?.input || args });
  const team_id = validated.team_id || validated.id;
  const input = validated.input || {};

  const existing = await teamRepo.findById(ctx, team_id);
  if (!existing) throw new NotFoundError('Team not found');

  const updates = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.constituency !== undefined) updates.constituency = input.constituency;
  if (input.ward !== undefined) updates.ward = input.ward;
  if (input.group !== undefined) updates.group = input.group;
  if (input.category !== undefined) updates.category = input.category;
  if (input.role !== undefined) updates.role = input.role;
  if (input.remarks !== undefined) updates.remarks = input.remarks;
  if (input.contact !== undefined) updates.contact = input.contact;
  if (input.childId !== undefined) updates.childId = input.childId;
  if (input.status !== undefined) updates.status = input.status;

  const updated = await teamRepo.updateById(ctx, team_id, updates);

  await publishEvent('team-management', 'TeamUpdated', {
    team_id,
    updated_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });

  return updated;
}

/* ============================
   DELETE TEAM (Soft Delete)
============================ */

async function deleteTeam(ctx, args) {
  const { team_id } = validate(deleteTeamSchema, args || {});

  const existing = await teamRepo.findById(ctx, team_id);
  if (!existing) throw new NotFoundError('Team not found');

  const updated = await teamRepo.updateById(ctx, team_id, { status: 'DELETED' });

  await publishEvent('team-management', 'TeamDeleted', {
    team_id,
    deleted_by: ctx.user_id,
    timestamp: new Date().toISOString(),
  });

  return updated;
}
