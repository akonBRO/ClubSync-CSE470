const express = require('express');
const router = express.Router();
const Event = require('../models/eventModel'); // Ensure path is correct
const Budget = require('../models/budgetModel'); // Ensure path is correct
const { authAdmin } = require('./adminAuth'); // Import admin authentication middleware
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

console.log("✅ adminEventRoutes.js loaded");

// Protect all routes in this router with admin authentication
router.use(authAdmin);

// GET /api/admins/events
// Get all events with optional search and filters
router.get('/', async (req, res) => {
    try {
        const { search, clubName, status } = req.query;
        let query = {};

        // Build search query for event_id or event_name
        if (search) {
            query.$or = [
                { eid: { $regex: search, $options: 'i' } },
                { event_name: { $regex: search, $options: 'i' } },
            ];
        }

        // Add club name filter
        if (clubName && clubName !== 'All Clubs') {
            query.club_name = clubName;
        }

        // Add status filter
        if (status && status !== 'All Statuses') {
             // Ensure status query matches the enum values exactly ('Pending', 'Approved', 'Rejected', 'Budget')
            query.status = status;
        }

        // Fetch events, potentially populate budget info if needed?
        // For now, let's just fetch events. Budget will be fetched separately in the modal.
        const events = await Event.find(query).sort({ event_date: 1, time_slots: 1 });

        res.status(200).json(events);

    } catch (error) {
        console.error("Error fetching all events for admin:", error);
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
});

// GET /api/admins/events/counts
// Get counts of events by status
router.get('/counts', async (req, res) => {
    try {
        const counts = await Event.aggregate([
            {
                $group: {
                    _id: '$status', // Group by the 'status' field
                    count: { $sum: 1 } // Count documents in each group
                }
            },
            {
                 $project: {
                     _id: 0, // Exclude the default _id field
                     status: '$_id', // Rename _id to status
                     count: 1 // Include the count
                 }
            }
        ]);

        // The result will be an array like [{ status: 'Pending', count: 5 }, { status: 'Approved', count: 10 }, ...]
        // Convert this array into a more convenient object: { Pending: 5, Approved: 10, ... }
        const statusCounts = counts.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
        }, {});

        // Ensure all expected statuses are present, even if count is 0
        const allStatuses = ['Pending', 'Approved', 'Rejected', 'Budget'];
        const finalCounts = {};
        allStatuses.forEach(status => {
            finalCounts[status] = statusCounts[status] || 0;
        });


        res.status(200).json(finalCounts);

    } catch (error) {
        console.error("Error fetching event counts for admin:", error);
        res.status(500).json({ message: 'Error fetching event counts', error: error.message });
    }
});


// --- NEW ROUTE: GET /api/admins/events/club-names ---
// Get a list of all unique club names from events
router.get('/club-names', async (req, res) => {
    try {
        const clubNames = await Event.distinct('club_name');

        // 'distinct' returns an array of unique values
        res.status(200).json(clubNames);

    } catch (error) {
        console.error("Error fetching unique club names from events:", error);
        res.status(500).json({ message: 'Error fetching club names', error: error.message });
    }
});


// PUT /api/admins/events/:eventId/status
// Update event status and/or comments directly from the grid
router.put('/:eventId/status', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { status, comments } = req.body;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID format.' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Update fields if provided
        if (status !== undefined) {
             // Validate incoming status against allowed values in the model
            const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Budget'];
             if (!allowedStatuses.includes(status)) {
                 return res.status(400).json({ message: `Invalid status value: ${status}. Allowed values are ${allowedStatuses.join(', ')}.` });
             }
            event.status = status;
        }
        if (comments !== undefined) {
            event.comments = comments;
        }

        await event.save();

        // No change needed for related budget status from this route

        res.status(200).json({ message: 'Event updated successfully', event });

    } catch (error) {
        console.error(`Error updating event ${req.params.eventId} status/comments:`, error);
        res.status(500).json({ message: 'Failed to update event', error: error.message });
    }
});


// PUT /api/admins/events/:eventId/budget
// Update budget status AND update associated event status/comments based on budget status
router.put('/:eventId/budget', async (req, res) => {
    try {
        const { eventId } = req.params; // Event ID (MongoDB _id)
        const { budgetStatus, eventComments } = req.body; // New budget status and event comments

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID format.' });
        }
         // Validate incoming budget status
         const allowedBudgetStatuses = ['pending', 'approved', 'rejected', 'hold']; // Matches budget model enum
          if (!allowedBudgetStatuses.includes(budgetStatus)) {
              return res.status(400).json({ message: `Invalid budget status value: ${budgetStatus}. Allowed values are ${allowedBudgetStatuses.join(', ')}.` });
          }


        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Associated event not found.' });
        }

        // Find the related budget using the event's booking_id
        const budget = await Budget.findOne({ booking_id: event.booking_id });

        if (!budget) {
             // It's possible an event exists without a budget request yet.
             // Decide how to handle this: deny budget update, or create a default budget?
             // For now, we'll return an error if a budget update is attempted for an event with no budget.
            return res.status(404).json({ message: 'Budget not found for this event.' });
        }

        // --- Apply the logic based on the NEW budget status ---
        let newEventStatus = event.status; // Keep current event status by default

        switch (budgetStatus) {
            case 'approved':
                newEventStatus = 'Approved'; // Budget approved -> Event Approved
                break;
            case 'pending':
                 // If budget goes back to pending, event should go back to pending
                 newEventStatus = 'Pending';
                 break;
             case 'rejected':
                 newEventStatus = 'Rejected'; // Budget rejected -> Event Rejected
                 break;
             case 'hold':
                 // If budget is put on hold, event should be in 'Budget' status
                 newEventStatus = 'Budget';
                 break;
            default:
                // Should not happen if budgetStatus is validated
                console.warn(`Unexpected budget status: ${budgetStatus}`);
                break;
        }


        // Update budget status
        budget.status = budgetStatus;
         // Ensure updatedAt is updated
        budget.updatedAt = new Date();


        // Update event status and comments
        event.status = newEventStatus;
        event.comments = eventComments !== undefined ? eventComments : event.comments; // Update comment if provided


        // Save both documents
        await budget.save();
        await event.save();


        res.status(200).json({ message: 'Budget and associated event updated successfully', event, budget });

    } catch (error) {
        console.error(`Error updating budget and event for event ${req.params.eventId}:`, error);
        res.status(500).json({ message: 'Failed to update budget and event', error: error.message });
    }
});


module.exports = router;