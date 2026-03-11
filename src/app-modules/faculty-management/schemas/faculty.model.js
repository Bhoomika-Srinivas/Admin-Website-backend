const mongoose = require("mongoose")

/* ─────────────────────────────
   Sub Schemas
─────────────────────────────*/

const PublicationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  journal: {
    type: String,
    required: true
  },

  year: {
    type: Number,
    required: true,
    min: 1950
  },

  authors: {
    type: String,
    required: true
  },

  doi: {
    type: String
  },

  type: {
    type: String,
    enum: ["journal", "conference", "book"],
    required: true
  }

}, { _id: true })


const EducationSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: true
  },

  institution: {
    type: String,
    required: true
  },

  year: {
    type: Number,
    required: true
  },

  specialization: {
    type: String
  }

}, { _id: true })


const WorkExperienceSchema = new mongoose.Schema({
  position: {
    type: String,
    required: true
  },

  institution: {
    type: String,
    required: true
  },

  startYear: {
    type: Number,
    required: true
  },

  endYear: {
    type: Number
  },

  description: {
    type: String
  }

}, { _id: true })


const ResearchProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  fundingAgency: {
    type: String,
    required: true
  },

  amount: {
    type: String
  },

  startYear: {
    type: Number,
    required: true
  },

  endYear: {
    type: Number
  },

  status: {
    type: String,
    enum: ["ongoing", "completed"],
    required: true
  }

}, { _id: true })


const CourseTeachingSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true
  },

  semester: {
    type: String,
    required: true
  },

  program: {
    type: String,
    required: true
  },

  academicYear: {
    type: String,
    required: true
  }

}, { _id: true })


const HonorSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  organization: {
    type: String,
    required: true
  },

  year: {
    type: Number,
    required: true
  },

  description: {
    type: String
  }

}, { _id: true })


/* ─────────────────────────────
   Main Faculty Schema
─────────────────────────────*/

const FacultySchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  designation: {
    type: String,
    enum: [
      "Professor",
      "Associate Professor",
      "Assistant Professor",
      "HOD",
      "Principal"
    ],
    required: true
  },

  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },

  qualification: {
    type: String,
    required: true
  },

  experience: {
    type: Number,
    required: true,
    min: 0,
    max: 60
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  phone: {
    type: String
  },

  specialization: {
    type: String,
    required: true
  },

  officeLocation: {
    type: String
  },

  profilePicture: {
    type: String
  },

  publications: [PublicationSchema],

  education: [EducationSchema],

  workExperience: [WorkExperienceSchema],

  researchProjects: [ResearchProjectSchema],

  coursesTeaching: [CourseTeachingSchema],

  honors: [HonorSchema]

},
{
  timestamps: true
})


module.exports = mongoose.model("Faculty", FacultySchema)