const Joi = require("joi")

/* ─────────────────────────────
   DeptIntroduction Schemas
─────────────────────────────*/

const getDeptIntroductionSchema = Joi.object({
  deptId: Joi.string().required()
})

const saveDeptIntroductionSchema = Joi.object({
  deptId: Joi.string().required(),
  input:  Joi.object({
    departmentName: Joi.string().optional(),
    logoUrl:        Joi.string().optional().allow(""),
    imageUrl:       Joi.string().optional().allow(""),
    description:    Joi.string().optional().allow("")
  }).required()
})


/* ─────────────────────────────
   DeptAbout Schemas
─────────────────────────────*/

const getDeptAboutSchema = Joi.object({
  deptId: Joi.string().required()
})

const saveDeptAboutSchema = Joi.object({
  deptId: Joi.string().required(),
  input:  Joi.object({
    vision:  Joi.string().optional().allow(""),
    mission: Joi.string().optional().allow("")
  }).required()
})


/* ─────────────────────────────
   DeptSwot Schemas
─────────────────────────────*/

const getDeptSwotSchema = Joi.object({
  deptId: Joi.string().required()
})

const saveDeptSwotSchema = Joi.object({
  deptId: Joi.string().required(),
  input:  Joi.object({
    strengths:     Joi.array().items(Joi.string()).optional(),
    weaknesses:    Joi.array().items(Joi.string()).optional(),
    opportunities: Joi.array().items(Joi.string()).optional(),
    threats:       Joi.array().items(Joi.string()).optional()
  }).required()
})


/* ─────────────────────────────
   HodProfile Schemas
─────────────────────────────*/

const getHodProfileSchema = Joi.object({
  deptId: Joi.string().required()
})

const saveHodProfileSchema = Joi.object({
  deptId: Joi.string().required(),
  input:  Joi.object({
    name:           Joi.string().optional(),
    title:          Joi.string().optional(),
    designation:    Joi.string().optional(),
    qualification:  Joi.string().optional(),
    experience:     Joi.string().optional(),
    specialization: Joi.string().optional(),
    message:        Joi.string().optional().allow(""),
    profileSummary: Joi.string().optional().allow(""),
    email:          Joi.string().email().optional(),
    phone:          Joi.string().optional(),
    imageUrl:       Joi.string().optional().allow(""),
    cvUrl:          Joi.string().optional().allow("")
  }).required()
})


/* ─────────────────────────────
   ProgramOutcome Schemas
─────────────────────────────*/

const listProgramOutcomesSchema = Joi.object({
  deptId:     Joi.string().required(),
  type:       Joi.string().valid("PEO", "PSO").optional(),
  limit:      Joi.number().integer().min(1).max(100).optional().allow(null),
  nextToken:  Joi.string().optional().allow(null),
  pagination: Joi.object().optional()
})

const createProgramOutcomeSchema = Joi.object({
  input: Joi.object({
    deptId:    Joi.string().required(),
    type:      Joi.string().valid("PEO", "PSO").required(),
    statement: Joi.string().min(1).required(),
    order:     Joi.number().integer().min(1).required()
  }).required()
})

const updateProgramOutcomeSchema = Joi.object({
  input: Joi.object({
    programOutcomeId: Joi.string().required(),
    statement:        Joi.string().min(1).optional(),
    order:            Joi.number().integer().min(1).optional()
  }).required()
})

const deleteProgramOutcomeSchema = Joi.object({
  programOutcomeId: Joi.string().required()
})

const reorderProgramOutcomesSchema = Joi.object({
  input: Joi.object({
    deptId:     Joi.string().required(),
    type:       Joi.string().valid("PEO", "PSO").required(),
    orderedIds: Joi.array().items(Joi.string()).min(1).required()
  }).required()
})


/* ─────────────────────────────
   CommitteeMember Schemas
─────────────────────────────*/

const listCommitteeMembersSchema = Joi.object({
  deptId:    Joi.string().required(),
  committee: Joi.string().valid("DAB", "PAC").optional()
})

const createCommitteeMemberSchema = Joi.object({
  input: Joi.object({
    deptId:      Joi.string().required(),
    committee:   Joi.string().valid("DAB", "PAC").required(),
    name:        Joi.string().min(2).required(),
    designation: Joi.string().optional(),
    order:       Joi.number().integer().min(0).optional()
  }).required()
})

const updateCommitteeMemberSchema = Joi.object({
  input: Joi.object({
    committeeMemberId: Joi.string().required(),
    name:              Joi.string().min(2).optional(),
    designation:       Joi.string().optional(),
    order:             Joi.number().integer().min(0).optional()
  }).required()
})

const deleteCommitteeMemberSchema = Joi.object({
  committeeMemberId: Joi.string().required()
})


/* ─────────────────────────────
   DistinguishedAlumnus Schemas
─────────────────────────────*/

const listDistinguishedAlumniSchema = Joi.object({
  deptId: Joi.string().required()
})

const createDistinguishedAlumnusSchema = Joi.object({
  input: Joi.object({
    deptId:       Joi.string().required(),
    name:         Joi.string().min(2).required(),
    batch:        Joi.string().optional(),
    currentRole:  Joi.string().optional(),
    organization: Joi.string().optional(),
    achievement:  Joi.string().optional(),
    imageUrl:     Joi.string().optional().allow(""),
    linkedInUrl:  Joi.string().optional().allow("")
  }).required()
})

const updateDistinguishedAlumnusSchema = Joi.object({
  input: Joi.object({
    distinguishedAlumnusId: Joi.string().required(),
    name:                   Joi.string().min(2).optional(),
    batch:                  Joi.string().optional(),
    currentRole:            Joi.string().optional(),
    organization:           Joi.string().optional(),
    achievement:            Joi.string().optional(),
    imageUrl:               Joi.string().optional().allow(""),
    linkedInUrl:            Joi.string().optional().allow("")
  }).required()
})

const deleteDistinguishedAlumnusSchema = Joi.object({
  distinguishedAlumnusId: Joi.string().required()
})


module.exports = {
  // DeptIntroduction
  getDeptIntroductionSchema,
  saveDeptIntroductionSchema,

  // DeptAbout
  getDeptAboutSchema,
  saveDeptAboutSchema,

  // DeptSwot
  getDeptSwotSchema,
  saveDeptSwotSchema,

  // HodProfile
  getHodProfileSchema,
  saveHodProfileSchema,

  // ProgramOutcome
  listProgramOutcomesSchema,
  createProgramOutcomeSchema,
  updateProgramOutcomeSchema,
  deleteProgramOutcomeSchema,
  reorderProgramOutcomesSchema,

  // CommitteeMember
  listCommitteeMembersSchema,
  createCommitteeMemberSchema,
  updateCommitteeMemberSchema,
  deleteCommitteeMemberSchema,

  // DistinguishedAlumnus
  listDistinguishedAlumniSchema,
  createDistinguishedAlumnusSchema,
  updateDistinguishedAlumnusSchema,
  deleteDistinguishedAlumnusSchema
}
