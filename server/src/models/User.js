const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'recruiter'],
    default: 'user'
  },
  recruiterInfo: {
    companyName: { type: String, default: '' }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  googleId: String,
  profile: {
    name: { type: String, default: '' },
    avatar: { type: String, default: '' },
    title: { type: String, default: '' },
    skills: [{ type: String }],
    education: [{
      institution: String,
      degree: String,
      year: String
    }],
    projects: [{
      title: String,
      description: String,
      technologies: [String],
      link: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      year: String
    }],
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    achievements: [{ type: String, default: [] }]
  },
  streak: {
    currentStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null }
  },
  refreshToken: {
    type: String,
    default: ''
  },
  bookmarks: [{ type: String }],
  companyProgress: [{
    name: { type: String, required: true },
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' }
  }]
}, {
  timestamps: true
});

// Hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
