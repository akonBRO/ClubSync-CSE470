// backend/routes/studentAuth.js
const express = require('express');
const router = express.Router();
const Student = require('../models/student.js'); // Ensure path is correct
const Recruitment = require('../models/recruitment.js');
const Club = require('../models/club.js')
console.log("✅ studentAuth.js loaded");

// --- AUTHENTICATION MIDDLEWARE ---
const authStudent = (req, res, next) => {
  if (req.session && req.session.student) {
    req.student = req.session.student; // Attach student info to request
    next(); // User is authenticated, proceed
  } else {
    console.warn("Auth failed: No active student session.");
    // Sending 401 means the client needs to authenticate
    res.status(401).json({ message: "Authentication failed. Please log in." });
  }
};
// --- END AUTHENTICATION MIDDLEWARE ---


// --- STUDENT LOGIN ---
router.post("/login", async (req, res) => {
    // ... (your existing login logic remains here) ...
    const { uid, upassword } = req.body;
    try {
        if (!uid || !upassword) {
            return res.status(400).json({ message: "Student ID and password are required" });
        }
        const studentUidNumber = Number(uid);
        if (isNaN(studentUidNumber)) {
             return res.status(400).json({ message: "Invalid Student ID format" });
        }
        const student = await Student.findOne({ uid: studentUidNumber });
        if (!student) {
            console.log(`Login attempt failed: UID ${studentUidNumber} not found.`);
            return res.status(401).json({ message: "Invalid Student ID or password" });
        }
        if (upassword === student.upassword) {
            req.session.student = {
                _id: student._id.toString(),
                uid: student.uid,
                uname: student.uname
            };
            req.session.save(err => {
                if (err) {
                    console.error("Session save error:", err);
                    return res.status(500).json({ message: "Server error during login (session save)" });
                }
                console.log(`Login successful for UID: ${student.uid}, Session student set:`, req.session.student);
                res.status(200).json({
                    message: "Login successful",
                    student: {
                        _id: student._id,
                        uid: student.uid,
                        uname: student.uname
                    }
                });
            });
        } else {
             console.log(`Login attempt failed: Incorrect password for UID ${studentUidNumber}.`);
            return res.status(401).json({ message: "Invalid Student ID or password" });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
});

// --- CHECK LOGIN STATUS ---
router.get("/check-auth", (req, res) => {
    // ... (your existing check-auth logic remains here) ...
    if (req.session && req.session.student) {
        res.status(200).json({ isLoggedIn: true, student: req.session.student });
    } else {
        console.log("Auth check: No active session found.");
        res.status(200).json({ isLoggedIn: false });
    }
});


// --- STUDENT LOGOUT ---
router.post("/logout", (req, res) => {
    // ... (your existing logout logic remains here) ...
    if (req.session) {
        const studentUid = req.session.student?.uid;
        req.session.destroy(err => {
            if (err) {
                console.error("Logout Error:", err);
                return res.status(500).json({ message: "Could not log out, please try again." });
            } else {
                res.clearCookie('connect.sid');
                 console.log(`Logout successful for UID: ${studentUid}`);
                return res.status(200).json({ message: "Logout successful" });
            }
        });
    } else {
        return res.status(200).json({ message: "No active session to log out from." });
    }
});

router.get("/:studentId", authStudent, async (req, res) => {
  const { studentId } = req.params;

  // Security Check: Ensure the requested ID matches the logged-in student's ID
  if (req.student._id !== studentId) {
      console.warn(`Auth Check: Student ${req.student.uid} attempted to access profile of student ${studentId}`);
      return res.status(403).json({ message: "Unauthorized access" });
  }

  try {
      // Use findById as we have the _id from the URL parameter
      const student = await Student.findById(studentId).select('-upassword'); // Exclude password

      if (!student) {
          console.log(`Profile fetch failed: Student ID ${studentId} not found.`);
          return res.status(404).json({ message: "Student not found" });
      }

      // Return the student data (excluding password)
      res.status(200).json(student);

  } catch (err) {
      console.error("Error fetching student profile:", err);
      // Mongoose cast errors (invalid ID format) will land here
      if (err.name === 'CastError') {
           return res.status(400).json({ message: "Invalid student ID format" });
      }
      res.status(500).json({ message: "Server error while fetching profile" });
  }
});

router.put("/:studentId/update", authStudent, async (req, res) => {
  const { studentId } = req.params;
  const updateData = req.body; // Data from the frontend

  // Security Check: Ensure the logged-in student can only update their own profile
  // req.student._id is a Mongoose ObjectId, studentId from params is a string.
  // Convert req.student._id to string for comparison.
  if (req.student._id.toString() !== studentId) {
      console.warn(`Auth Check: Student ${req.student.uid} attempted to update profile of student ${studentId} (Unauthorized)`);
      return res.status(403).json({ message: "Unauthorized to update this profile." });
  }

  // Optional: Filter allowed fields on the backend as a safety measure,
  // even though frontend is already excluding some.
  const allowedFields = ['dob', 'umail', 'umobile', 'ugender', 'major', 'semester'];
  const filteredUpdateData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
      }, {});

  // If you have date fields like 'dob', you might need to ensure they are
  // correctly parsed if sent as strings, or rely on Mongoose schema casting.

  try {
      // Find the student by ID and update
      // { new: true } option returns the updated document
      // { runValidators: true } ensures schema validators are run on updates
      const updatedStudent = await Student.findByIdAndUpdate(
          studentId,
          filteredUpdateData, // Use the filtered data
          { new: true, runValidators: true }
      ).select('-upassword'); // Exclude password from the returned document

      if (!updatedStudent) {
          // This case should ideally not be reached if the authorization check passes
          return res.status(404).json({ message: "Student not found." });
      }

      console.log(`Profile updated successfully for UID: ${updatedStudent.uid}`);
      res.status(200).json(updatedStudent); // Send back the updated student data

  } catch (err) {
      console.error("Error updating student profile:", err);
      // Handle specific Mongoose validation errors if needed
      if (err.name === 'ValidationError') {
           const messages = Object.values(err.errors).map(val => val.message);
           return res.status(400).json({ message: messages.join(', ') });
      }
       if (err.name === 'CastError') {
           return res.status(400).json({ message: "Invalid ID format or data format." });
      }
      res.status(500).json({ message: "Server error while updating profile." });
  }
});
// --- GET CLUBS FOR A STUDENT ---
router.get("/:studentId/clubs", async (req, res) => {
    // ... (your existing clubs logic remains here) ...
    const { studentId } = req.params;
    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.status(200).json({ clubs: student.clubs });
    } catch (err) {
        console.error("Error fetching student clubs:", err);
        res.status(500).json({ message: "Server error while fetching clubs" });
    }
});


// --- REGISTER STUDENT FOR CLUB RECRUITMENT ---
router.post('/register-club', authStudent, async (req, res) => {
    const { recruitmentId } = req.body;
    const studentUid = req.student.uid;
  
    try {
      const recruitment = await Recruitment.findById(recruitmentId);
      if (!recruitment) {
        return res.status(404).json({ message: 'Recruitment not found' });
      }
  
      // Check if already applied
      if (
        recruitment.pending_std.includes(studentUid) ||
        recruitment.approved_std.includes(studentUid) ||
        recruitment.rejected_std.includes(studentUid)
      ) {
        return res.status(400).json({ message: 'You have already applied to this club' });
      }
  
      // Add to pending list
recruitment.pending_std.push(studentUid);
await recruitment.save();

// Also update student's pending clubs
const student = await Student.findOne({ uid: studentUid });
if (student && !student.pen_clubs.includes(recruitment.cid)) {
  student.pen_clubs.push(recruitment.cid);
  await student.save();
}
      // Count total pending applications for this student
      const allRecruitments = await Recruitment.find({
        pending_std: studentUid
      });
      const pendingCount = allRecruitments.length;
  
      res.status(200).json({
        message: 'Registration successful',
        pendingCount
      });
  
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Server error during registration' });
    }
  });
  // --- GET PENDING INTERVIEWS COUNT ---
  router.get('/pending-count', authStudent, async (req, res) => {
    try {
      const student = await Student.findOne({ uid: req.student.uid });
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ pendingCount: student.pen_clubs.length });
    } catch (err) {
      console.error('Error getting pending count:', err);
      res.status(500).json({ message: 'Error getting pending count' });
    }
  });

// --- GET STUDENT'S CLUBS WITH DETAILS ---
// --- GET STUDENT'S CLUBS WITH DETAILS ---
// --- GET STUDENT'S CLUBS WITH DETAILS ---
router.get("/:studentId/myclubs", authStudent, async (req, res) => {
    const { studentId } = req.params;
    
    // Authorization check
    if (req.student._id !== studentId) {
      console.log(`Auth failed: ${req.student._id} vs ${studentId}`);
      return res.status(403).json({ message: "Unauthorized access" });
    }
  
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      // Get all clubs where cid is in student's clubs array
      const clubs = await Club.find({ cid: { $in: student.clubs } });
      
      
      res.status(200).json(clubs);
    } catch (err) {
      console.error("Error fetching student's clubs:", err);
      res.status(500).json({ 
        message: "Server error while fetching clubs",
        error: err.message 
      });
    }
  });
  

  // --- SEARCH CLUBS (FOR MYCLUBS PAGE) ---
router.get("/:studentId/myclubs/search", authStudent, async (req, res) => {
    const { studentId } = req.params;
    const { query } = req.query;
  
    // Authorization check
    if (req.student._id !== studentId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
  
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      // Create search conditions
      const searchConditions = {
        cid: { $in: student.clubs } // Only search in student's clubs
      };
  
      // Add search query if provided
      if (query) {
        const isNumericQuery = !isNaN(query);
        
        searchConditions.$or = [
          { cname: { $regex: query, $options: 'i' } },
          { cshortname: { $regex: query, $options: 'i' } }
        ];
  
        if (isNumericQuery) {
          searchConditions.$or.push({ cid: Number(query) });
        }
      }
  
      const clubs = await Club.find(searchConditions);
      res.status(200).json(clubs);
    } catch (err) {
      console.error("Error searching clubs:", err);
      res.status(500).json({ message: "Server error while searching clubs" });
    }
  });
// In your student routes
router.get('/count', async (req, res) => {
  try {
      const count = await Student.countDocuments();
      res.json({ count });
  } catch (err) {
      console.error('Error counting students:', err);
      res.status(500).json({ message: 'Error counting students' });
  }
});

module.exports = {
    router: router,       // Export the router under the 'router' key
    authStudent: authStudent // Export the middleware under the 'authStudent' key
};