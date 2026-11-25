const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['student', 'assistant_professor', 'professor', 'hod', 'principal', 'office_staff', 'librarian', 'ped_teacher', 'club_member', 'admin'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ROLES, required: true },
  department: { type: String, default: '' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  registerNumber: { type: String, default: '' },
  year: { type: String, default: '' },
  clubName: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  academicRecords: [{
    subject: { type: String, required: true },
    grade: { type: String },
    marks: { type: Number },
    examName: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(pwd) {
  return bcrypt.compare(pwd, this.password);
};

module.exports = mongoose.model('User', userSchema);
