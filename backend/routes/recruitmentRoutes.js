const express = require('express');
const router = express.Router();
const Recruitment = require('../models/recruitment');
const Club = require('../models/club');
const Student = require('../models/student');

// Get all recruitments for a club
router.get('/:clubId', async (req, res) => {
  try {
    const recruitments = await Recruitment.find({ clubId: req.params.clubId }).sort({ semester: -1 });
    res.json(recruitments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching recruitments' });
  }
});

// Create or update recruitment for a semester
router.post('/create', async (req, res) => {
  const { clubId, clubName, semester, application_deadline, description } = req.body;

  try {
    const existing = await Recruitment.findOne({ clubId, semester });

    if (existing) {
      existing.status = 'yes';
      existing.application_deadline = application_deadline;
      existing.description = description;
      await existing.save();
      return res.json({ message: 'Recruitment updated', recruitment: existing });
    }

    const newRec = new Recruitment({
      clubId,
      clubName,
      semester,
      application_deadline,
      description,
      status: 'yes',
      pending_std: [],
      approved_std: [],
      rejected_std: []
    });

    await newRec.save();
    res.json({ message: 'Recruitment started', recruitment: newRec });

  } catch (err) {
    res.status(500).json({ message: 'Failed to start recruitment' });
  }
});

// Stop recruitment
router.put('/stop', async (req, res) => {
  const { clubId, semester } = req.body;
  try {
    await Recruitment.findOneAndUpdate({ clubId, semester }, { status: 'no' });
    res.json({ message: 'Recruitment stopped' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to stop recruitment' });
  }
});

// Inside GET /api/recruitment/applicants/:clubId/:semester
router.get('/applicants/:clubId/:semester', async (req, res) => {
  const { clubId, semester } = req.params; // clubId here is the ObjectId from the URL
  try {
    // Find the specific recruitment document
    const recruitment = await Recruitment.findOne({ clubId: clubId, semester: semester });
    if (!recruitment) {
        return res.status(404).json({ message: "Recruitment not found for this club and semester" });
    }

    // Get all unique student UIDs from pending, approved, rejected lists
    const allUids = [...new Set([...recruitment.pending_std, ...recruitment.approved_std, ...recruitment.rejected_std])];

    if (allUids.length === 0) {
        return res.json({ applicants: [] }); // No applicants found
    }

    // Fetch student details for all applicants, selecting specific fields
    const students = await Student.find(
        { uid: { $in: allUids } }, // Query by UID
        // Projection: Select specific fields to return
        'uid uname umail umobile ugender major semester'
    ).lean(); // Use .lean() for plain JS objects

    // Function to determine the current status of a student in this recruitment
    const mapStatus = (uid) => {
      if (recruitment.approved_std.includes(uid)) return 'approved';
      if (recruitment.rejected_std.includes(uid)) return 'rejected';
      return 'pending'; // Default to pending
    };

    // Combine student details with their status
    const formattedApplicants = students.map(student => ({
      ...student, // Spread all selected student fields
      status: mapStatus(student.uid), // Add the current status
      selectedStatus: mapStatus(student.uid) // Initialize dropdown selection
    }));

     res.json({ applicants: formattedApplicants });

   } catch (err) {
     console.error("Error fetching applicants:", err);
     res.status(500).json({ message: "Server error while fetching applicants" });
   }
 });


// POST /api/recruitment/evaluate
// Updates applicant status and manages club membership list
router.post('/evaluate', async (req, res) => {
const { clubId, semester, uid, action } = req.body; // action is the new status

// Input validation
if (!clubId || !semester || uid === undefined || !action || !['approved', 'rejected', 'pending'].includes(action)) {
  return res.status(400).json({ message: "Missing or invalid required fields: clubId, semester, uid, action (approved/rejected/pending)" });
}

try {
  // Fetch recruitment, club, and student documents concurrently
  // Fetch the full Club document now, as we need to modify cmembers
  const [recruitment, clubDoc, student] = await Promise.all([
      Recruitment.findOne({ clubId: clubId, semester: semester }),
      Club.findById(clubId), // Fetch the full club document
      Student.findOne({ uid: uid })
  ]);

  // --- Validation ---
  if (!recruitment) return res.status(404).json({ message: "Recruitment process not found for this club/semester" });
  if (!student) return res.status(404).json({ message: "Student not found" });
  if (!clubDoc) return res.status(404).json({ message: "Club not found (for evaluation)"});

  const numericClubId = clubDoc.cid; // The numeric ID of the club (used for student's lists)
  const studentUid = student.uid; // The numeric UID of the student

  // --- Flags for saving ---
  let recruitmentNeedsSave = false;
  let studentNeedsSave = false;
  let clubNeedsSave = false;

  // --- Update Recruitment Document ---
  const originalPending = [...recruitment.pending_std];
  const originalApproved = [...recruitment.approved_std];
  const originalRejected = [...recruitment.rejected_std];

  // Remove student UID from all status lists first
  recruitment.pending_std = recruitment.pending_std.filter(id => id !== studentUid);
  recruitment.approved_std = recruitment.approved_std.filter(id => id !== studentUid);
  recruitment.rejected_std = recruitment.rejected_std.filter(id => id !== studentUid);

  // Add student UID to the appropriate new status list
  if (action === 'approved' && !recruitment.approved_std.includes(studentUid)) {
      recruitment.approved_std.push(studentUid);
  } else if (action === 'rejected' && !recruitment.rejected_std.includes(studentUid)) {
      recruitment.rejected_std.push(studentUid);
  } else if (action === 'pending' && !recruitment.pending_std.includes(studentUid)) {
      recruitment.pending_std.push(studentUid);
  }

  // Check if recruitment document actually changed
  if (
      JSON.stringify(originalPending) !== JSON.stringify(recruitment.pending_std) ||
      JSON.stringify(originalApproved) !== JSON.stringify(recruitment.approved_std) ||
      JSON.stringify(originalRejected) !== JSON.stringify(recruitment.rejected_std)
  ) {
      recruitmentNeedsSave = true;
  }


  // --- Update Student Document ---
  const originalPenClubs = [...student.pen_clubs];
  const originalClubs = [...student.clubs];

  // Always remove the numeric club ID from the student's pending list first
  student.pen_clubs = student.pen_clubs.filter(cIdNum => cIdNum !== numericClubId);
  // Also remove from the main clubs list initially
  student.clubs = student.clubs.filter(cIdNum => cIdNum !== numericClubId);

  if (action === 'approved') {
      // Add numeric Club ID to student's main clubs list if not present
      if (!student.clubs.includes(numericClubId)) {
          student.clubs.push(numericClubId);
      }
  } else if (action === 'pending') {
      // Add numeric Club ID back to pending list if not already there
      if (!student.pen_clubs.includes(numericClubId)) {
          student.pen_clubs.push(numericClubId);
      }
  }
  // If action is 'rejected', the club ID is removed from both pen_clubs and clubs (handled above)

  // Check if student document actually changed
  if (
      JSON.stringify(originalPenClubs) !== JSON.stringify(student.pen_clubs) ||
      JSON.stringify(originalClubs) !== JSON.stringify(student.clubs)
  ) {
      studentNeedsSave = true;
  }


  // --- Update Club Document (cmembers) ---
  const originalMembers = [...clubDoc.cmembers];

  if (action === 'approved') {
      // Add student UID to club members if not already present
      if (!clubDoc.cmembers.includes(studentUid)) {
          clubDoc.cmembers.push(studentUid);
          clubNeedsSave = true;
      }
  } else { // action is 'rejected' or 'pending'
      // Remove student UID from club members if present
      const initialLength = clubDoc.cmembers.length;
      clubDoc.cmembers = clubDoc.cmembers.filter(memberUid => memberUid !== studentUid);
      if (clubDoc.cmembers.length !== initialLength) {
          clubNeedsSave = true;
      }
  }

  // --- Save Changes Conditionally ---
  const savePromises = [];
  if (recruitmentNeedsSave) savePromises.push(recruitment.save());
  if (studentNeedsSave) savePromises.push(student.save());
  if (clubNeedsSave) savePromises.push(clubDoc.save());

  if (savePromises.length > 0) {
      await Promise.all(savePromises);
  }

  // Respond with success
  res.json({
      message: `Student ${uid} status updated to ${action}${clubNeedsSave ? ' and club membership updated.' : '.'}`,
  });

} catch (err) {
  console.error("Evaluation error:", err);
  if (err.name === 'CastError') {
      return res.status(400).json({ message: "Invalid ID format provided." });
  }
  res.status(500).json({ message: "Server error during evaluation" });
}
});

// --- GET /recruiting/active (No changes needed here) ---
router.get('/recruiting/active', async (req, res) => {
  try {
    const activeRecruitments = await Recruitment.find({ status: 'yes' })
      .populate('clubId', 'cid cname') // Populate necessary club details
      .lean();

    const recruitingClubs = activeRecruitments.map(rec => ({
      _id: rec._id, // Recruitment document ID
      clubId: rec.clubId._id, // Club document ObjectId
      cid: rec.clubId.cid, // Club numeric ID
      clubName: rec.clubId.cname,
      semester: rec.semester,
      application_deadline: rec.application_deadline,
      description: rec.description,
      status: rec.status,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt
    }));

    res.json(recruitingClubs);
  } catch (err) {
    console.error('Error fetching recruiting clubs:', err);
    res.status(500).json({ message: 'Error fetching recruiting clubs' });
  }
});


module.exports = router;
