const express = require('express');
const router = express.Router();
const Club = require('../models/club'); // Ensure path is correct
const Recruitment = require('../models/recruitment'); // Ensure path is correct for Recruitment model
const { authAdmin } = require('./adminAuth'); // Import admin authentication middleware
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

console.log("✅ adminClubRoutes.js loaded");

// Protect all routes in this router with admin authentication
router.use(authAdmin);

// GET /api/admins/clubs/count
// Get the total count of clubs
router.get('/count', async (req, res) => {
    try {
        const count = await Club.countDocuments();
        res.status(200).json({ totalCount: count });
    } catch (error) {
        console.error("Error fetching total club count:", error);
        res.status(500).json({ message: 'Error fetching total club count', error: error.message });
    }
});


// GET /api/admins/clubs
// Get all clubs with optional search (by cid or cname) and filter (by recruiting status)
router.get('/', async (req, res) => {
    try {
        const { recruitingStatus } = req.query; // Only recruitingStatus filter handled here
        const { search } = req.query; // Search added back for server-side

        let matchQuery = {}; // Initial match criteria for clubs

         // Build search query for cid or cname
         if (search) {
             const isNumericSearch = !isNaN(search);
             const searchConditions = [
                 { cname: { $regex: search, $options: 'i' } }, // Case-insensitive name search
             ];
              // Add CID search condition only if the query is numeric
             if (isNumericSearch) {
                  searchConditions.push({ cid: Number(search) });
             }
              matchQuery.$or = searchConditions;
         }


        // Aggregation pipeline to join with Recruitment and determine recruiting status
        const pipeline = [
            {
                $match: matchQuery // Apply initial search filter here
            },

            {
                // Left join with the 'recruitments' collection
                $lookup: {
                    from: 'recruitments', // The collection name for Recruitment model
                    let: { clubObjectId: '$_id' }, // Variable to hold the club's _id
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    // Match recruitments where clubId (ObjectId) equals the club's _id
                                    $eq: ['$clubId', '$$clubObjectId']
                                },
                                status: 'yes' // Filter for active recruitments
                            }
                        },
                         // Optional: Limit to one active recruitment per club if multiple are possible
                         // { $limit: 1 }
                    ],
                    as: 'activeRecruitments' // Array field to add to the input documents
                }
            },
            {
                // Add a field 'isRecruiting' based on whether activeRecruitments is non-empty
                $addFields: {
                    isRecruiting: { $gt: [{ $size: '$activeRecruitments' }, 0] }
                }
            },
            {
                // --- CORRECTED $project STAGE (Same as previous fix, already correct) ---
                // Use only inclusions to avoid the "inclusion and exclusion" error
                $project: {
                     _id: 1, // Include _id explicitly
                     cname: 1,
                     caname: 1,
                     cpname: 1,
                     cshortname: 1,
                     cmail: 1,
                     cmobile: 1,
                     cid: 1,
                     cdescription: 1,
                     cdate: 1,
                     cachievement: 1,
                     clogo: 1,
                     csocial: 1,
                     cmembers: 1, // Keep cmembers to show count
                     isRecruiting: 1 // Include the new field
                     // activeRecruitments is implicitly excluded by not including it
                }
            }
        ];

        // Apply the recruiting status filter AFTER determining the status
        if (recruitingStatus === 'Recruiting') {
            pipeline.push({ $match: { isRecruiting: true } });
        } else if (recruitingStatus === 'Not Recruiting') {
            pipeline.push({ $match: { isRecruiting: false } });
        }

         // Add sorting if desired (e.g., by cname)
        pipeline.push({ $sort: { cname: 1 } });


        const clubs = await Club.aggregate(pipeline);

        res.status(200).json(clubs);

    } catch (error) {
        console.error("Error fetching clubs for admin:", error);
        console.error(error.stack); // Log the full error object, including stack trace
        res.status(500).json({ message: 'Server error fetching clubs. Check server logs for details.' });
    }
});


// PUT /api/admins/clubs/:clubId
// Update club details (uname, major, umobile, dob)
router.put('/:clubId', async (req, res) => {
    try {
        const { clubId } = req.params; // This is the MongoDB _id
        // --- ACCEPTING NEW SET OF EDITABLE FIELDS ---
        const { cname, cshortname, cmail, cmobile, cdescription, cdate } = req.body; // Fields allowed to be updated

        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ message: 'Invalid club ID format.' });
        }

        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).json({ message: 'Club not found.' });
        }

        // Update fields if provided in the request body
        if (cname !== undefined) club.cname = cname;
        if (cshortname !== undefined) club.cshortname = cshortname;
        if (cmail !== undefined) club.cmail = cmail;
         // Basic check for mobile (assuming it's a Number)
        if (cmobile !== undefined) {
            const mobileNum = Number(cmobile);
            if (!isNaN(mobileNum)) {
                 club.cmobile = mobileNum;
            } else {
                 // Optionally return a specific error for invalid mobile
                 console.warn(`Invalid mobile number format for club ${clubId}: ${cmobile}`);
                 // Decide how to handle: skip update or return error. Returning error is safer.
                 // return res.status(400).json({ message: 'Invalid mobile number format.' });
                 // For now, just log and skip the update for this field if invalid
            }
        }

        if (cdescription !== undefined) club.cdescription = cdescription;
        if (cdate !== undefined) {
            // Attempt to parse the date string (e.g., from YYYY-MM-DD input)
            const date = new Date(cdate);
            // Check if the date is valid before saving
            if (!isNaN(date.getTime())) {
                 club.cdate = date;
            } else {
                 console.warn(`Invalid date format for club ${clubId}: ${cdate}`);
                 // Decide how to handle: skip update or return error.
                 // return res.status(400).json({ message: 'Invalid date format.' });
                 // For now, just log and skip the update for this field if invalid
            }
        }


        await club.save();

        // Respond with the updated club data
        res.status(200).json({ message: 'Club updated successfully', club });

    } catch (error) {
        console.error(`Error updating club ${req.params.clubId}:`, error);
        // Check for validation errors if you add validation to the schema later
        // if (error.name === 'ValidationError') {
        //     return res.status(400).json({ message: error.message });
        // }
        res.status(500).json({ message: 'Failed to update club', error: error.message });
    }
});


module.exports = router;