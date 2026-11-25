const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { q, role, department } = req.query;
    const filter = {};
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (role) filter.role = role;
    if (department) filter.department = new RegExp(department, 'i');
    const users = await User.find(filter).select('-password').limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'department', 'avatar', 'year', 'clubName'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get users by role
router.get('/role/:role', auth, async (req, res) => {
  try {
    const users = await User.find({ role: req.params.role }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add academic record
router.post('/academic-records', auth, async (req, res) => {
  try {
    const { subject, grade, marks, examName } = req.body;
    const user = await User.findById(req.user._id);
    user.academicRecords.push({ subject, grade, marks, examName });
    await user.save();
    res.json(user.academicRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
