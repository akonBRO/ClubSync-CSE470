const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  cname: String,
  caname: String,
  cpname: String,
  cshortname: String,
  cmail: String,
  cmobile: Number,
  cid: Number,
  cpassword: String,
  cdescription: String,
  cdate: Date,
  cachievement: String,
  clogo: String,       // e.g. logo URL or file path
  csocial: String,     // e.g. social media links or JSON string
  cmembers: [Number],
  cfund: Number,
  semester: [String], // Array of semesters for recruitment
  
});

module.exports = mongoose.model('Club', clubSchema);