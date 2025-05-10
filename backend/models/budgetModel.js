const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Budget Item Schema
const budgetItemSchema = new mongoose.Schema({
  
  category: {
    type: String,
    enum: ['Food', 'Logistic', 'Transport', 'Other'],
  },
  item_name: String,
  quantity: {
    type: Number,
    min: 1,
  },
  unit_price: {
    type: Number,
    min: 0,
  },
  total_price: {
    type: Number,
    min: 0,
  },
});

// Budget Schema
const budgetSchema = new mongoose.Schema({
  booking_id: {
    type: String,
    required: true,
    unique: true,
  },
  event_name: String,
  items: [budgetItemSchema],
  total_budget: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hold'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
