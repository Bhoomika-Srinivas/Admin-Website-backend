const mongoose = require('mongoose');

const DevelopmentSchema = new mongoose.Schema({

  development_id: {
    type: String,
    unique: true,
    index: true
  },

  constituency: {
    type: String,
    index: true
  },

  ward: {
    type: String,
    index: true
  },

  ward_no: {
    type: String,
    index: true
  },

  nameOfWork: {
    type: String
  },

  type: {
    type: String,
    index: true
  },

  location: {
    type: String
  },

  year: {
    type: Number,
    index: true
  },

  amount_spent: {
    type: Number
  },

  amount_unit: {
    type: String
  },

  status: {
    type: String,
    index: true
  },

  imageUrl: {
    type: String
  },

  view_on_tracker: {
    type: Boolean,
    default: false,
    index: true
  },

  createdBy: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model('Development', DevelopmentSchema);
