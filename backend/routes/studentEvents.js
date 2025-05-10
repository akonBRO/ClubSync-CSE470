// backend/routes/studentEvents.js
const express = require('express');
const Event = require('../models/eventModel'); // Adjust path if necessary
const mongoose = require('mongoose');
// Import authStudent specifically using destructuring
const { authStudent } = require('./studentAuth');

// Create a NEW router instance for student events
const studentEventsRouter = express.Router(); // <-- Create a new router here


// --- GET Approved Events for Students ---
// Apply authStudent middleware to protect the route
studentEventsRouter.get('/upcoming', authStudent, async (req, res) => {
    try {
        const upcomingEvents = await Event.find({ status: 'Approved' })
                                        .sort({ event_date: 1 });

        if (!upcomingEvents || upcomingEvents.length === 0) {
             console.log("No upcoming approved events found.");
            return res.status(200).json([]);
        }

        res.status(200).json(upcomingEvents);
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        res.status(500).json({ message: 'Server error fetching upcoming events', error: error.message });
    }
});

// --- POST Register Student for an Event ---
// Apply authStudent middleware to protect the route
studentEventsRouter.post('/register/:eventId', authStudent, async (req, res) => {
    const { eventId } = req.params;
    // req.student is available because authStudent middleware ran
    const studentUid = req.student.uid; // Use the numeric UID from session

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
         return res.status(400).json({ message: 'Invalid Event ID format.' });
    }

    try {
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        if (event.status !== 'Approved') {
            return res.status(400).json({ message: 'Event is not approved for registration.' });
        }

        if (event.std_reg !== 'Yes') {
            return res.status(400).json({ message: 'Registration is not open for this event.' });
        }

        if (event.reg_std.includes(studentUid)) {
            console.log(`Student UID ${studentUid} already registered for event ${eventId}`);
            return res.status(200).json({ message: 'You are already registered for this event.', alreadyRegistered: true, event });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { $addToSet: { reg_std: studentUid } }, // Add the numeric UID
            { new: true }
        );

        if (!updatedEvent) {
             return res.status(404).json({ message: 'Event not found during update.' });
        }
         console.log(`Student UID ${studentUid} successfully registered for event ${eventId}`);
         res.status(200).json({ message: 'Successfully registered for the event.', event: updatedEvent });

    } catch (error) {
        console.error(`Error registering student UID ${studentUid} for event ${eventId}:`, error);
        res.status(500).json({ message: 'Server error registering for event', error: error.message });
    }
});

// --- GET Registered Events for a Student ---
// New route to fetch events where the logged-in student's UID is in the reg_std array
studentEventsRouter.get('/registered', authStudent, async (req, res) => {
    try {
        // Get the logged-in student's UID from the session (provided by authStudent middleware)
        const studentUid = req.student.uid;

        if (!studentUid) {
            // This case should ideally be caught by authStudent, but as a fallback
            return res.status(401).json({ message: "Student UID not found in session." });
        }

        // Find events where the student's UID is present in the reg_std array
        const registeredEvents = await Event.find({ reg_std: studentUid })
                                            .sort({ event_date: 1 }); // Sort by date

        if (!registeredEvents || registeredEvents.length === 0) {
            console.log(`No registered events found for student UID: ${studentUid}`);
            return res.status(200).json([]); // Return empty array if no registered events
        }

        console.log(`Found ${registeredEvents.length} registered events for student UID: ${studentUid}`);
        res.status(200).json(registeredEvents);

    } catch (error) {
        console.error(`Error fetching registered events for student UID ${req.student?.uid}:`, error);
        res.status(500).json({ message: 'Server error fetching registered events', error: error.message });
    }
});


// Export the NEW studentEventsRouter
module.exports = studentEventsRouter; // <-- Export the new router instance
