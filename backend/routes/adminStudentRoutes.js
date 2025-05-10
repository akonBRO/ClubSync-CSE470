const express = require('express');
const router = express.Router();
const Student = require('../models/student'); // Ensure path is correct
const Club = require('../models/club'); // Ensure path is correct for Club model
const { authAdmin } = require('./adminAuth'); // Import admin authentication middleware
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

console.log("✅ adminStudentRoutes.js loaded");

// Protect all routes in this router with admin authentication
router.use(authAdmin);

// GET /api/admins/students/count
// Get the total count of students
router.get('/count', async (req, res) => {
    try {
        const count = await Student.countDocuments();
        res.status(200).json({ totalCount: count });
    } catch (error) {
        console.error("Error fetching total student count:", error);
        res.status(500).json({ message: 'Error fetching total student count', error: error.message });
    }
});

// GET /api/admins/students/majors
// Get a list of all unique majors from students
router.get('/majors', async (req, res) => {
    try {
        const majors = await Student.distinct('major');
        // 'distinct' returns an array of unique values
        res.status(200).json(majors.filter(major => major !== null && major !== undefined && major !== '')); // Filter out null/empty majors
    } catch (error) {
        console.error("Error fetching unique student majors:", error);
        res.status(500).json({ message: 'Error fetching majors', error: error.message });
    }
});


// GET /api/admins/students
// Get all students with optional search (by uid or uname) and filter (by major)
router.get('/', async (req, res) => {
    try {
        const { search, major } = req.query;
        let query = {};

        // Build search query for uid or uname
        if (search) {
            const isNumericSearch = !isNaN(search);
            query.$or = [
                { uname: { $regex: search, $options: 'i' } }, // Case-insensitive name search
            ];
             // Add UID search condition only if the query is numeric
            if (isNumericSearch) {
                 query.$or.push({ uid: Number(search) });
            }
        }

        // Add major filter
        if (major && major !== 'All Majors') {
            query.major = major;
        }

        // Fetch students, select relevant fields only
        const students = await Student.find(query).select('uid uname umail umobile major dob clubs semester'); // Select fields
        // Note: 'clubs' is included to get club CIDs for the "Show Clubs" button

        res.status(200).json(students);

    } catch (error) {
        console.error("Error fetching students for admin:", error);
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// PUT /api/admins/students/:studentId
// Update student details (uname, major, umobile, dob)
router.put('/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params; // This is the MongoDB _id
        const { uname, major, umobile, dob } = req.body; // Fields allowed to be updated

        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'Invalid student ID format.' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Update fields if provided in the request body
        if (uname !== undefined) student.uname = uname;
        if (major !== undefined) student.major = major;
        if (umobile !== undefined) student.umobile = umobile;
        if (dob !== undefined) student.dob = dob; // Assuming DOB is stored as String

        await student.save();

        // Respond with the updated student data
        res.status(200).json({ message: 'Student updated successfully', student });

    } catch (error) {
        console.error(`Error updating student ${req.params.studentId}:`, error);
        // Check for validation errors if you add validation to the schema later
        // if (error.name === 'ValidationError') {
        //     return res.status(400).json({ message: error.message });
        // }
        res.status(500).json({ message: 'Failed to update student', error: error.message });
    }
});

// GET /api/admins/students/:studentId/clubs
// Get club names for a specific student
router.get('/:studentId/clubs', async (req, res) => {
     try {
     const { studentId } = req.params; // Student's MongoDB _id
    
   if (!mongoose.Types.ObjectId.isValid(studentId)) {
     return res.status(400).json({ message: 'Invalid student ID format.' });
  }
    
     const student = await Student.findById(studentId).select('clubs'); // Get the student's club CIDs
     if (!student) {
     return res.status(404).json({ message: 'Student not found.' });
    }
    
   const clubCids = student.clubs; // Array of club CIDs (numbers)
    
     if (!clubCids || clubCids.length === 0) {
    return res.status(200).json([]); // Return empty array if no clubs
     }
    
    // Find clubs whose cid is in the student's clubs array
     // Project only the club name (cname) and explicitly exclude _id
    const clubs = await Club.find({ cid: { $in: clubCids } }).select('cname -_id');
    
    // 'find' with select('cname -_id') returns an array of objects like [{ cname: 'Club A'}, { cname: 'Club B' }]
   // Map to an array of just names (strings) for simplicity in the frontend
    const clubNames = clubs.map(club => club.cname); // <-- This correctly extracts the 'cname' strings
    
    res.status(200).json(clubNames); // <-- The backend sends an array of strings (club names)
    
     } catch (error) {
    console.error(`Error fetching clubs for student ${req.params.studentId}:`, error);
    if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid club ID format in student data.' });
 }
 res.status(500).json({ message: 'Error fetching student clubs', error: error.message });
    }
    });


module.exports = router;