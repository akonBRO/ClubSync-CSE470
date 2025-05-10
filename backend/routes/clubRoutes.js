const express = require('express');
const router = express.Router();
const Club = require('../models/club');

router.post('/register', async (req, res) => {
  console.log(req.body);
  const { cname, caname, cpname, cshortname, cmail, cmobile, cid, cpassword } = req.body;

  try {
    if (!cname || !caname || !cpname || !cshortname || !cmail || !cmobile || !cid || !cpassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newClub = new Club({
      cname,
      caname,
      cpname,
      cshortname,
      cmail,
      cmobile,
      cid,
      cpassword,
      cdescription: '',       // default empty
      cdate: null,            // default null (can be filled later)
      cachievement: '',       // default empty
      clogo: '',              // default empty
      csocial: '',            // default empty (or could be '{}')
      cmembers: [] ,
      cfund:0,            // default 0
      creq: 'No',
      semester:[],
      
    });

    await newClub.save();
    res.status(200).json({ message: 'Club registration successful' });

  } catch (err) {
    console.error('MongoDB Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/all', async (req, res) => {
  try {
    const clubs = await Club.find();
    res.status(200).json(clubs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch clubs' });
  }
});

// Get club by cid (e.g., after login or from session)
router.get('/:cid', async (req, res) => {
  try {
    const club = await Club.findOne({ cid: Number(req.params.cid) });

    if (!club) return res.status(404).json({ message: 'Club not found' });
    res.status(200).json(club);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching club data' });
  }
});



module.exports = router;
