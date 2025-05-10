const express = require('express');
const router = express.Router();
const Event = require('../models/eventModel');
const Student = require('../models/student'); // Import the Student model
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

// Assuming you have a club authentication middleware exported from clubAuth.js
// If your clubAuth exports an object like { router, authClub }, adjust import:
// const { authClub } = require('./clubAuth');
// If it exports just the middleware function:
const authClub = require('./clubAuth'); // Adjust this import based on your clubAuth.js export


const generateEId = async () => {
    let eid;
    let isUnique = false;

    while (!isUnique) {
        eid = Math.floor(10000000 + Math.random() * 90000000).toString();
        const existingEvent = await Event.findOne({ eid: eid });
        if (!existingEvent) {
            isUnique = true;
        }
    }
    return eid;
};

// Check if a room slot is available
const isSlotAvailable = async (eventDate, timeSlotToCheck, roomNumber) => {
    const existingEvent = await Event.findOne({
      event_date: eventDate,
      room_number: roomNumber,
      time_slots: { $in: [timeSlotToCheck] }
    });
    return !existingEvent;
  };


// 1. Create new event
router.post('/booking', async (req, res) => {
    try {
      const { club_name, event_name, event_date, time_slots, room_number, std_reg, event_details } = req.body;

      if (!event_name || !event_date || !time_slots || time_slots.length === 0 || !room_number || !club_name) {
        return res.status(400).json({ message: 'All required fields must be provided.' });
      }

      const availabilityResults = await Promise.all(
        time_slots.map(slot => isSlotAvailable(event_date, slot, room_number))
      );

      if (availabilityResults.some(available => !available)) {
        return res.status(400).json({ message: 'One or more selected slots are not available for this time and room.' });
      }
      const eid = await generateEId();

      const newEvent = new Event({
        booking_id: uuidv4(),
        eid: eid,
        club_name: club_name || null,
        event_name: event_name || null,
        event_date: event_date ? new Date(event_date) : null,
        time_slots: time_slots, // Save as an array
        room_number: room_number || null,
        std_reg: std_reg || null,
        reg_std: [], // Initialize registered students array
        event_details: event_details || null,
        status: 'Pending',
        comments: '',
      });

      await newEvent.save();
      res.status(201).json({ message: 'Event booked successfully!', event: newEvent });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to create event', error: error.message });
    }
  });

// 2. Get event by bookingId
router.get('/booking/:bookingId', async (req, res) => {
    try {
      const event = await Event.findOne({ booking_id: req.params.bookingId });
      if (!event) return res.status(404).json({ message: 'Event not found' });
      res.json({ event });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get event by bookingId', error: error.message });
    }
  });


// 3. Get events by club
router.get('/club/:clubName', async (req, res) => {
    try {
      const { clubName } = req.params;
      const { search } = req.query;

      let query = {
        club_name: clubName,
        status: { $in: ['Pending', 'Budget'] }
      };

      if (search) {
        query.eid = { $regex: search, $options: 'i' };
      }

      const events = await Event.find(query).sort({ event_date: 1 });

      res.json(events);

    } catch (error) {
      console.error(`Error fetching events for club=${req.params.clubName}:`, error);
      res.status(500).json({ message: 'Error fetching club events', error: error.message });
    }
  });


// 4. Update event
router.put('/:id', async (req, res) => {
    try {
      const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) return res.status(404).json({ message: 'Event not found' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Update failed', error: error.message });
    }
  });

// 5. Delete event (using MongoDB _id)
router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
           return res.status(400).json({ message: 'Invalid event ID format.' });
      }

      const deleted = await Event.findByIdAndDelete(id);

      if (!deleted) {
           return res.status(404).json({ message: 'Event not found with the provided ID.' });
      }

      res.status(200).json({ message: 'Event deleted successfully' });

    } catch (error) {
      console.error(`Error deleting event with id=${req.params.id}:`, error);
      res.status(500).json({ message: 'Deletion failed due to server error.', error: error.message });
    }
  });

// GET /api/events/status/:status?search=EID_VALUE
router.get('/status/:status', async (req, res) => {
    try {
      const { status } = req.params;
      const { search } = req.query;

      const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Budget'];
      if (!allowedStatuses.includes(status)) {
           return res.status(400).json({ message: 'Invalid status value.' });
      }

      let query = { status: status };

      if (search) {
        query.eid = { $regex: search, $options: 'i' };
      }

      const events = await Event.find(query).sort({ event_date: 1 });

      res.json(events);

    } catch (error) {
      console.error(`Error fetching events by status=${req.params.status}:`, error);
      res.status(500).json({ message: 'Error fetching events by status', error: error.message });
    }
  });

// --- NEW ROUTE: Get Registered Students for an Event ---
// Protected by club authentication middleware
router.post('/:eventId/registered-students', authClub, async (req, res) => {
    try {
        const { eventId } = req.params;
        // The request body should contain the array of student UIDs (reg_std)
        const { studentUids } = req.body;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID format.' });
        }

        if (!Array.isArray(studentUids) || studentUids.length === 0) {
            // If no UIDs are provided, return an empty array
            return res.status(200).json([]);
        }

        // Find students whose UID is in the provided studentUids array
        const registeredStudents = await Student.find(
            { uid: { $in: studentUids } },
            { uname: 1, uid: 1, umail: 1, _id: 0 } // Project only name, uid, email, exclude _id
        );

        console.log(`Found ${registeredStudents.length} registered students for event ${eventId}`);
        res.status(200).json(registeredStudents);

    } catch (error) {
        console.error(`Error fetching registered students for event ${req.params.eventId}:`, error);
        res.status(500).json({ message: 'Server error fetching registered students', error: error.message });
    }
});
// GET /api/events/:id - Get event by MongoDB _id
router.get('/:id', async (req, res) => {
  try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Invalid event ID format.' });
      }

      const event = await Event.findById(id);
      if (!event) {
          return res.status(404).json({ message: 'Event not found with the provided ID.' });
      }

      res.status(200).json({ event });

  } catch (error) {
      console.error(`Error fetching event with id=${req.params.id}:`, error);
      res.status(500).json({ message: 'Server error fetching event', error: error.message });
  }
});

module.exports = router;
