const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

// Helper function to sign JWT access tokens
const signAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_interviewai_pro_2026', {
    expiresIn: '15m'
  });
};

// Helper function to sign JWT refresh tokens
const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_REFRESH || process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_interviewai_pro_2026', {
    expiresIn: '7d'
  });
};

// 1. Register User
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
      email,
      password,
      verificationToken,
      verificationTokenExpires,
      profile: {
        name: name || email.split('@')[0],
        title: 'Aspiring Software Engineer',
        achievements: ['Welcome Aboard']
      }
    });

    // Initialize blank analytics record for tracking stats
    await Analytics.create({
      userId: user._id,
      dailyStudyHours: [],
      interviewScoreHistory: [],
      skillProgress: [],
      codingProgress: { easyCompleted: 0, mediumCompleted: 0, hardCompleted: 0 },
      resumeImprovementTrend: []
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile,
        subscription: { plan: 'free', status: 'none', expiresAt: null },
        streak: user.streak
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Login User
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update streak logic
    let currentStreak = user.streak.currentStreak || 0;
    const lastActive = user.streak.lastActiveDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lastActive) {
      const lastActiveDate = new Date(lastActive);
      lastActiveDate.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today - lastActiveDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    user.streak.currentStreak = currentStreak;
    user.streak.lastActiveDate = new Date();

    if (currentStreak >= 3 && !user.profile.achievements.includes('Streak Starter')) {
      user.profile.achievements.push('Streak Starter');
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile,
        subscription: { plan: 'free', status: 'none', expiresAt: null },
        streak: user.streak
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Google OAuth Login Mock (for development and showcase)
const googleLogin = async (req, res, next) => {
  try {
    const { email, name, googleId, avatar } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        password: crypto.randomBytes(16).toString('hex'), // Random password for oauth
        googleId,
        isVerified: true, // Google accounts are pre-verified
        profile: {
          name: name || email.split('@')[0],
          avatar: avatar || '',
          title: 'Developer'
        }
      });

      // Initialize analytics
      await Analytics.create({
        userId: user._id,
        dailyStudyHours: [],
        interviewScoreHistory: [],
        skillProgress: [],
        codingProgress: { easyCompleted: 0, mediumCompleted: 0, hardCompleted: 0 },
        resumeImprovementTrend: []
      });
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile,
        subscription: { plan: 'free', status: 'none', expiresAt: null },
        streak: user.streak
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Verify Email
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
};

// 5. Forgot Password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    next(error);
  }
};

// 6. Reset Password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password; // pre-save hook will hash it automatically
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
};

// 7. Get logged-in user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// 8. Update Profile details
const updateProfile = async (req, res, next) => {
  try {
    const { name, title, skills, education, projects, certifications, github, linkedin, avatar } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.profile.name = name;
    if (title) user.profile.title = title;
    if (skills) user.profile.skills = skills;
    if (education) user.profile.education = education;
    if (projects) user.profile.projects = projects;
    if (certifications) user.profile.certifications = certifications;
    if (github !== undefined) user.profile.github = github;
    if (linkedin !== undefined) user.profile.linkedin = linkedin;
    if (avatar) user.profile.avatar = avatar;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile,
        subscription: { plan: 'free', status: 'none', expiresAt: null },
        streak: user.streak
      }
    });
  } catch (error) {
    next(error);
  }
};

// 9. Rotate Refresh Tokens to issue new Access Tokens
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH || process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_interviewai_pro_2026');
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const accessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// 10. Logout and invalidate refresh token
const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = '';
        await user.save();
      }
    }
    res.status(200).json({ message: 'Logged out successfully from session' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  refresh,
  logoutUser
};
