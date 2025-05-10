// migration.js
const mongoose = require('mongoose');
const Event = require('./models/eventModel'); // Adjust path as needed

mongoose.connect('mongodb://localhost:27017/clubsync-db')
  .then(async () => {
    console.log('Connected to MongoDB');

    const eventsToUpdate = await Event.find({ time_slots: { $type: 'string' } }); // Find events where time_slots is a string

    for (const event of eventsToUpdate) {
      if (event.time_slots && typeof event.time_slots === 'string') {
        event.time_slots = event.time_slots.split(', ').map(slot => slot.trim());
        await event.save();
        console.log(`Updated event: ${event.booking_id}`);
      }
    }

    console.log('Data migration complete.');
    mongoose.disconnect();
  })
  .catch(err => console.error('Error during migration:', err));