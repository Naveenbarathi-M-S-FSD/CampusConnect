const router = require('express').Router();
const Classroom = require('../models/Classroom');
const auth = require('../middleware/auth');

// Create classroom (Professor/HoD only)
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!['professor', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const classroom = new Classroom({
      name,
      teacher: req.user._id
    });
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get classrooms for user
router.get('/', auth, async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      $or: [
        { teacher: req.user._id },
        { students: req.user._id }
      ]
    }).populate('teacher', 'name').populate('students', 'name');
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add student to classroom
router.post('/:id/students', auth, async (req, res) => {
  try {
    const { studentId } = req.body;
    const classroom = await Classroom.findById(req.params.id);
    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the teacher can add students' });
    }
    if (!classroom.students.includes(studentId)) {
      classroom.students.push(studentId);
      await classroom.save();
    }
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add note to classroom
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const classroom = await Classroom.findById(req.params.id);
    
    // Only teacher can add notes
    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only teachers can add notes' });
    }

    classroom.notes.push({ title, content, author: req.user._id });
    await classroom.save();
    res.json(classroom.notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
