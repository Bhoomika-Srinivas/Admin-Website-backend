const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({

  news_id: {
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

  dateTime: {
    type: Date,
    index: true
  },

  information: {
    type: String
  },

  incidentType: {
    type: String,
    index: true
  },

  imageUrl: {
    type: String
  },

  createdBy: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model('News', NewsSchema);
