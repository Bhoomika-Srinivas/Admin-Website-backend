const mongoose = require('mongoose');
const TeamSchema = new mongoose.Schema({

  team_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  name: {
    type: String
  },

  constituency: {
    type: String,
    index: true
  },

  ward: {
    type: String,
    index: true
  },

  group: {
    type: String,
    index: true
  },

  category: {
    type: String,
    index: true
  },

  role: {
    type: String,
    index: true
  },

  remarks: {
    type: String
  },

  contact: {
    type: String
  },

  childId: {
    type: mongoose.Schema.Types.ObjectId
  },

  status: {
    type: String,
    index: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId
  }

}, { timestamps: true });
module.exports = mongoose.model('Team', TeamSchema);
