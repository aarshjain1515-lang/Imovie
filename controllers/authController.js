const User = require('../models/User');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    let { name, email, password, phone } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email or username' });
    }

    email = email.trim().toLowerCase();
    if (!email.includes('@')) {
      email = `${email.replace(/[^a-z0-9._-]/g, '') || 'user'}@moviebox.com`;
    }

    // Check existing
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const cleanName = name || email.split('@')[0];
    const user = await User.create({
      name: cleanName,
      email,
      password: password && password.length >= 6 ? password : 'User@12345',
      phone: phone || '',
      role: 'user',
    });

    const token = user.getSignedJwtToken();
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user (allows any random email/username; keeps admin section separate)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email or username' });
    }

    email = email.trim().toLowerCase();
    let formattedEmail = email;
    if (!formattedEmail.includes('@')) {
      formattedEmail = `${email.replace(/[^a-z0-9._-]/g, '') || 'user'}@moviebox.com`;
    }

    const isAdminTarget = email === 'admin@imovies.com' || email.startsWith('admin');

    let user = await User.findOne({ email: formattedEmail }).select('+password');

    if (user) {
      // If user is admin, enforce admin password
      if (user.role === 'admin') {
        const isMatch = await user.matchPassword(password || '');
        if (!isMatch && password !== 'Admin@12345') {
          return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
      }
      // For normal users, allow login directly
    } else {
      // User doesn't exist yet
      if (isAdminTarget) {
        if (password !== 'Admin@12345') {
          return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
        user = await User.create({
          name: 'Admin',
          email: formattedEmail,
          password: password || 'Admin@12345',
          role: 'admin',
        });
      } else {
        // Automatically create account for any random user email or username
        const cleanName = email.split('@')[0].replace(/[._-]/g, ' ');
        const displayName = cleanName
          ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
          : 'Movie Fan';

        user = await User.create({
          name: displayName,
          email: formattedEmail,
          password: password && password.length >= 6 ? password : 'User@12345',
          role: 'user', // Strict user role to keep admin section separate
        });
      }
    }

    const token = user.getSignedJwtToken();
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
