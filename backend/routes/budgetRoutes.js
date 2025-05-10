const mongoose = require("mongoose");
const express = require('express');
const router = express.Router();
const Budget = require('../models/budgetModel');
const Event = require('../models/eventModel');

router.get('/by-booking/:bookingId', async (req, res) => { // Renamed param for clarity
  try {
    const { bookingId } = req.params; // Get the booking_id (UUID string) from URL

    // No need to find the Event first anymore

    // Find the budget directly using the booking_id
    const budget = await Budget.findOne({ booking_id: bookingId });

    if (!budget) {
      // Budget not found for this booking_id, return null as data
      // It's not necessarily an error if no budget exists yet
      return res.status(200).json({ budget: null });
    }

    // Budget found, return it
    res.status(200).json({ budget });

  } catch (error) {
    console.error('Error fetching budget by booking ID:', error);
    res.status(500).json({ message: 'Server error while fetching budget.' });
  }
});
// Create or update budget for an event

router.post('/:eventId', async (req, res) => { // eventId is Event's MongoDB _id
  try {
    const { eventId } = req.params;
    const { items } = req.body; // These are the NEW/EDITED items from the user

    // --- Validate incoming items ---
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items data must be an array.' });
    }
    // Add more robust validation per item if necessary
    const invalidItem = items.some(item =>
         !item.category || !item.item_name ||
         isNaN(Number(item.quantity)) || Number(item.quantity) <= 0 ||
         isNaN(Number(item.unit_price)) || Number(item.unit_price) < 0
    );
    if (invalidItem) {
        return res.status(400).json({ message: 'Invalid item data received. Please check quantities and prices.' });
    }


    // --- Find the associated Event ---
    const event = await Event.findById(eventId);
    if (!event) {
       return res.status(404).json({ message: 'Associated event not found.' });
    }

    // --- Find the existing Budget using event's booking_id ---
    let budget = await Budget.findOne({ booking_id: event.booking_id });

    // --- >>> CRITICAL: Recalculate totals using the INCOMING items <<< ---
    let calculated_total_budget = 0;
    const processedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const unit_price = Number(item.unit_price);
      const total_price = quantity * unit_price;
      calculated_total_budget += total_price;
      // Ensure the returned object matches your budgetItemSchema
      return {
          category: item.category,
          item_name: item.item_name,
          quantity: quantity,
          unit_price: unit_price,
          total_price: total_price // Make sure schema expects this
       };
    });
    // --- Calculation Complete ---


    if (budget) {
      // *** BUDGET EXISTS - UPDATE LOGIC ***
      console.log(`Updating budget for booking_id: ${event.booking_id}. Current status: ${budget.status}`); // Log status before check

      // Check if status allows update
      if (budget.status !== 'pending') {
        console.log(`Update rejected: Budget status is '${budget.status}', not 'pending'.`);
        return res.status(400).json({ message: `Cannot edit budget because its status is currently '${budget.status}'. It must be 'pending'.` });
      }

      // Update existing budget document with newly calculated values
      budget.items = processedItems;
      budget.total_budget = calculated_total_budget;
      budget.status = 'hold'; // Set status back to 'hold' after update
      budget.markModified('items'); // Recommended for arrays of objects (Mixed type)

      console.log('Attempting to save updated budget...');
      await budget.save(); // Save the changes
      console.log('Budget updated successfully.');

      // Send back the UPDATED budget object
      res.status(200).json({ message: 'Budget updated successfully.', budget });

    } else {
      // *** BUDGET DOESN'T EXIST - CREATE LOGIC ***
      console.log(`Creating new budget for booking_id: ${event.booking_id}`);
      budget = new Budget({
        booking_id: event.booking_id,
        event_name: event.event_name,
        items: processedItems, // Use calculated items
        total_budget: calculated_total_budget, // Use calculated total
        status: 'hold', // Set status to hold on creation
      });

      await budget.save();
      // Update event status

      event.status = 'Budget';

      await event.save();
      console.log('New budget created successfully.');

      // Optionally update event status if needed
      // event.status = 'Budget';
      // await event.save();

      // Send back the NEW budget object with 201 status
      res.status(201).json({ message: 'Budget created successfully.', budget });
    }

  } catch (error) {
    console.error('Error processing budget submission:', error);
    // Provide more specific error feedback if possible
    if (error.name === 'ValidationError') {
         return res.status(400).json({ message: 'Validation Error: ' + error.message });
    }
    res.status(500).json({ message: 'Server error processing budget submission.' });
  }
});



// Get budget by event ID
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params; // This is the Event's _id

    // Optional: Validate if eventId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
         return res.status(400).json({ message: 'Invalid Event ID format.' });
    }

    // Find the event to get its booking_id
    const event = await Event.findById(eventId);
    if (!event) {
        // If the event itself doesn't exist, we can't find a budget for it.
        return res.status(404).json({ message: 'Event not found.' });
    }

    // Find the budget using the event's booking_id
    const budget = await Budget.findOne({ booking_id: event.booking_id });

    if (!budget) {
      // It's not an error if budget doesn't exist yet.
      // Return null or an empty object, frontend will handle it.
      return res.status(200).json({ budget: null });
    }

    // Budget found, return it
    res.status(200).json({ budget });

  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ message: 'Server error while fetching budget.' });
  }
});

module.exports = router;
