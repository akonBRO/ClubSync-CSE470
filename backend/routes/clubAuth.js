const express = require('express');
const router = express.Router();
const Club = require('../models/club');
const Event = require('../models/eventModel'); // Import the Event model
const Recruitment = require('../models/recruitment');
const Student= require('../models/student')
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../frontend/public/images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
// const bcrypt = require('bcrypt'); // Comment out bcrypt import


router.post('/login', async (req, res) => {
  const { cid, cpassword } = req.body;

  try {
    const club = await Club.findOne({ cid: Number(cid) }); // Ensure cid is a number

    if (club) {
      if (cpassword === club.cpassword) {
        req.session.clubId = club._id;
        req.session.clubName = club.cname;
        req.session.clubCid = club.cid;
        res.json({ 
          success: true, 
          message: 'Login successful', 
          club: { 
            _id: club._id,
            cid: club.cid,  // Make sure to return the numeric cid
            cname: club.cname 
          } 
        });
      } else {
        res.status(401).json({ success: false, message: 'Invalid ID or password' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Invalid ID or password' });
    }
  } catch (error) {
    console.error('Error during club login:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// Logout Route (add this if you don't have it already)
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Middleware to check if the user is logged in (add this if you don't have it already)
const requireLogin = (req, res, next) => {
  if (req.session && req.session.clubId) {
    next(); // User is logged in, proceed
  } else {
    res.status(401).json({ message: 'Unauthorized' }); // User is not logged in
  }
};

// Example protected route (add this if you don't have a protected dashboard route)
router.get('/dashboard', requireLogin, async (req, res) => {
  try {
      const clubId = req.session.clubId; // MongoDB _id from session
      const clubCid = req.session.clubCid; // Club CID from session
      const clubName = req.session.clubName; // Club Name from session

      // 1. Fetch Club details (for members, fund, etc.)
      const club = await Club.findById(clubId).select('-cpassword');

      if (!club) {
          // This should ideally not happen if session is valid, but handle defensively
          console.error(`Club not found for session ID: ${clubId}`);
          req.session.destroy(); // Clear potentially stale session
          return res.status(404).json({ message: 'Club data not found. Please log in again.' });
      }

      // 2. Fetch Event counts
      const now = new Date();
      const upcomingApprovedEventsCount = await Event.countDocuments({
          club_name: clubName,
          status: 'Approved',
          event_date: { $gte: now } // Events on or after today
      });

      const pendingEventsCount = await Event.countDocuments({
          club_name: clubName,
          status: 'Pending',
           event_date: { $gte: now } // Count pending events on or after today
      });

      // 3. Fetch Recruitment status and applicant count
      // Find the most recent recruitment entry for this club
      const latestRecruitment = await Recruitment.findOne({ clubId: clubId })
                                              .sort({ createdAt: -1 }) // Sort by creation date descending
                                              .limit(1); // Get only the latest one

      let recruitmentStatus = 'Not Recruiting'; // Default status
      let totalApplicants = 0;

      if (latestRecruitment) {
          recruitmentStatus = latestRecruitment.status === 'yes' ? 'Recruiting' : 'Not Recruiting';
          // Sum applicants from pending, approved, and rejected arrays for the latest recruitment
          totalApplicants = (latestRecruitment.pending_std?.length || 0) +
                            (latestRecruitment.approved_std?.length || 0) +
                            (latestRecruitment.rejected_std?.length || 0);
      }


      // 4. Collect data for the response
       const dashboardData = {
        message: `Welcome to the club dashboard, ${club.cname}!`,
        clubId: club._id,
        clubCid: club.cid,
        clubName: club.cname,
        // Add clubDetails back here:
       clubDetails: club, // <--- ADD THIS LINE
        // Use fetched data
         totalMembers: club.cmembers ? club.cmembers.length : 0,
         currentBalance: club.cfund || 0,
         upcomingEventsCount: upcomingApprovedEventsCount,
         pendingEventsCount: pendingEventsCount,
        recruitmentStatus: recruitmentStatus,
      totalApplicants: totalApplicants,
        // Note: activeAnnouncementsCount and recentActivities are not available
         activeAnnouncementsCount: 0,
         recentActivities: [],
       };
        
       res.json(dashboardData);

  } catch (error) {
      console.error('Error fetching club dashboard data:', error);
       if (error.name === 'CastError') {
           // Handle cases where clubId from session might be invalid format
           return res.status(400).json({ message: 'Invalid club ID format in session.' });
       }
      res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// PUT /api/clubs/:cid/edit
router.put('/:cid/edit', upload.single('logo'), async (req, res) => {
  try {
    const { cid } = req.params;
    let updateData = req.body.clubData ? JSON.parse(req.body.clubData) : {};

    // If a file was uploaded, update the logo path
    if (req.file) {
      updateData.clogo = `/images/${req.file.filename}`;
    }

    // Disallow editing protected fields
    delete updateData.cid;
    delete updateData.cname;
    delete updateData.cshortname;

    const updatedClub = await Club.findOneAndUpdate(
      { cid: Number(cid) },
      updateData,
      { new: true }
    );

    if (!updatedClub) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.status(200).json(updatedClub);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Failed to update club profile' });
  }
});

/// GET /api/clubs/members
// Fetches members for the logged-in club with search functionality
router.get('/members', async (req, res) => {
  // Internal Check: Verify session exists and contains clubId
  if (!req.session || !req.session.clubId) {
     console.warn("Access denied to members: Club not logged in (internal check).");
     return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  try {
      const clubId = req.session.clubId; // Get the logged-in club's _id from the session
      const searchQuery = req.query.search || ''; // Get search query from URL parameters

      // Find the club document to get its list of member UIDs
      const club = await Club.findById(clubId);

      if (!club) {
          // This should not happen if the session clubId is valid, but handle defensively
          console.error(`Club not found for member fetch, session ID: ${clubId}`);
          return res.status(404).json({ message: 'Club data not found.' });
      }

      const memberUids = club.cmembers;
      const totalMemberCount = memberUids.length; // Total count of members in the club

      // Start with the base condition: students whose UID is in the club's cmembers array
      let studentQueryConditions = {
          uid: { $in: memberUids }
      };

      // If a search query is provided, add search conditions
      if (searchQuery) {
          const isNumericQuery = !isNaN(searchQuery);

          // Combine the base $in condition with search $or conditions using $and
          studentQueryConditions = {
              $and: [
                  { uid: { $in: memberUids } }, // Condition 1: Student must be a member of this club
                  { // Condition 2: Student must match the search criteria (name or UID)
                      $or: [
                           // Case-insensitive search by student name (uname)
                           { uname: { $regex: searchQuery, $options: 'i' } }
                      ]
                       // Add UID search condition only if the query is numeric
                      .concat(isNumericQuery ? [{ uid: Number(searchQuery) }] : [])
                  }
              ]
          };
      }

      // Find the student documents based on the combined conditions
      // Select only the fields needed for the members list display
      const members = await Student.find(studentQueryConditions).select('uid uname umail major semester');

      // Respond with the filtered list of members and the total member count
      res.status(200).json({
          members: members, // The list of students matching search criteria (subset of total)
          totalCount: totalMemberCount // The total number of members in the club (unfiltered count)
      });

  } catch (error) {
      console.error('Error fetching club members:', error);
       if (error.name === 'CastError') {
           return res.status(400).json({ message: 'Invalid club ID format from session.' });
      }
      res.status(500).json({ message: 'Server error while fetching members.' });
  }
});

// In your club routes
router.get('/count', async (req, res) => {
  try {
      const count = await Club.countDocuments();
      res.json({ count });
  } catch (err) {
      console.error('Error counting clubs:', err);
      res.status(500).json({ message: 'Error counting clubs' });
  }
});
// In your club routes
router.get('/recent', async (req, res) => {
  try {
      const recentClubs = await Club.find()
          .sort({ cdate: -1 }) // Sort by creation date descending
          .limit(5); // Get 5 most recent
      res.json(recentClubs);
  } catch (err) {
      console.error('Error fetching recent clubs:', err);
      res.status(500).json({ message: 'Error fetching recent clubs' });
  }
});
module.exports = router;