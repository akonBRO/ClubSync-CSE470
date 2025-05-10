const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  uname: String,
  dob: String,
  umail: String,
  uid: Number,
  umobile: String,
  ugender: String,
  upassword: String,
  major: String,
  semester: String,
  clubs: [Number],
  pen_clubs: [Number]
});

module.exports = mongoose.model('Student', studentSchema);
