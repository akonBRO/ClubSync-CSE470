const express = require('express');
const router = express.Router();
const Student = require('../models/student.js');
console.log("✅ studentroute.js loaded");
router.post("/register", async (req, res) => {
    const {uname, dob , umail, uid, umobile, ugender, upassword } = req.body;
  
    try {
      if (!uname || !dob || !umail || !uid || !umobile || !ugender || !upassword) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const newStudent = new Student({
        uname,
        dob,
        umail,
        uid,
        umobile,
        ugender,
        upassword, 
        major:'',
        semester:'',
        clubs:[],
        pen_clubs:[],
      });
  
      await newStudent.save();
      res.status(200).json({ message: "Registration successful" });
  
    } catch (err) {
      console.error("MongoDB Error:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  });
  
module.exports = router;
