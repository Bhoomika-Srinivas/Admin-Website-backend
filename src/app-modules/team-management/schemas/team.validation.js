const Joi = require('joi');

/* ============================
   Shared Pagination Schema
============================ */

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100),
  cursor: Joi.string().allow(''),
});

/* ============================
   GET TEAM
============================ */

const teamIdSchema = Joi.object({
  team_id: Joi.string().required(),
}).options({ stripUnknown: true });

/* ============================
   LIST TEAMS
   (Filters + Search + Sort)
============================ */

const listTeamsSchema = Joi.object({
  constituency: Joi.string(),
  ward: Joi.string(),
  group: Joi.string(),
  team_category: Joi.string(),
  role: Joi.string(),
  status: Joi.string(),

  search: Joi.string(),

  sortBy: Joi.string().valid('name'),
  sortOrder: Joi.string().valid('asc', 'desc'),

  pagination: paginationSchema,
}).options({ stripUnknown: true });

/* ============================
   CREATE TEAM
============================ */

const createTeamSchema = Joi.object({
  name: Joi.string(),
  constituency: Joi.string(),
  ward: Joi.string(),
  group: Joi.string(),
  team_category: Joi.string(),
  role: Joi.string(),
  remarks: Joi.string(),
  contact: Joi.string(),
  childId: Joi.string(),
  status: Joi.string(),
}).options({ stripUnknown: true });
/* ============================
   UPDATE TEAM
============================ */

const updateTeamSchema = Joi.object({
  team_id: Joi.string().required(),
  input: Joi.object({
    name: Joi.string(),
    constituency: Joi.string(),
    ward: Joi.string(),
    group: Joi.string(),
    team_category: Joi.string(),
    role: Joi.string(),
    remarks: Joi.string(),
    contact: Joi.string(),
    childId: Joi.string(),
    status: Joi.string(),
  }).required(),
}).options({ stripUnknown: true });

/* ============================
   DELETE TEAM
============================ */

const deleteTeamSchema = Joi.object({
  team_id: Joi.string().required(),
}).options({ stripUnknown: true });

/* ============================
   EXPORTS
============================ */

module.exports = {
  getTeamSchema: teamIdSchema,
  listTeamSchema: listTeamsSchema,
  createTeamSchema,
  updateTeamSchema,
  deleteTeamSchema,
};
