const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Club = require('../models/club');
const { authAdmin } = require('./adminAuth'); // Import admin auth middleware

// Admin middleware - only accessible by authenticated admins
router.use(authAdmin);

// Get student count
router.get('/students/count', async (req, res) => {
    try {
        const count = await Student.countDocuments();
        res.json({ count });
    } catch (err) {
        console.error('Error counting students:', err);
        res.status(500).json({ message: 'Error counting students' });
    }
});

// Get club count
router.get('/clubs/count', async (req, res) => {
    try {
        const count = await Club.countDocuments();
        res.json({ count });
    } catch (err) {
        console.error('Error counting clubs:', err);
        res.status(500).json({ message: 'Error counting clubs' });
    }
});

// Get recent clubs
router.get('/clubs/recent', async (req, res) => {
    try {
        const recentClubs = await Club.find()
            .sort({ cdate: -1 })
            .limit(5);
        res.json(recentClubs);
    } catch (err) {
        console.error('Error fetching recent clubs:', err);
        res.status(500).json({ message: 'Error fetching recent clubs' });
    }
});

module.exports = router;