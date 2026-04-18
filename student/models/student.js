const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
    unique: true
  },

  auth_id: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },


  DOB: {
    type: Date,
    required: true
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },

  email: {
    type: String,
    required: false
  },

  contactNumber: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: false
  },

  class: {
    type: String,
    required: true
  },

  schoolName: {
    type: String,
    required: false
  },

  adhaarCard: {
    type: String,
    required: false
  },

  panCard: {
    type: String,
    required: false
  },

  interests: {
    type: [String],
    default: []
  },

  profilePictureUrl: {
    type: String,
    required: false
  },

  avatarId: {
    type: String,
    default: null
  },

  trustedPerson: {
    name: { type: String, required: false },
    phone: { type: String, required: false },
    relation: { type: String, required: false }
  }

}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;