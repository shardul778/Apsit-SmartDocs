const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, password, department, position } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      department,
      position,
      // Default role is 'user', admin role is assigned manually
    });

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    // User is already available in req.user from auth middleware
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        position: req.user.position,
        hasProfileImage: req.user.profileImage && req.user.profileImage.data ? true : false,
        hasSignature: req.user.signature && req.user.signature.data ? true : false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, department, position } = req.body;

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        department,
        position,
        // Handle profile image and signature in separate routes
      },
      { new: true, runValidators: true }
    );

    // Return updated user data
    res.status(200).json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        position: updatedUser.position,
        profileImage: updatedUser.profileImage,
        signature: updatedUser.signature,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload profile image
 * @route   PUT /api/auth/profile/image
 * @access  Private
 */
exports.uploadProfileImage = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    // Store image data in database
    const profileImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    // Update user profile image
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage },
      { new: true }
    );

    // Return updated user data
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload signature
 * @route   PUT /api/auth/profile/signature
 * @access  Private
 */
exports.uploadSignature = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    // Store signature data in database
    const signature = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    // Update user signature
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { signature },
      { new: true }
    );

    // Return updated user data
    res.status(200).json({
      success: true,
      message: 'Signature uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Return success message
    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get profile image
 * @route   GET /api/auth/profile/image
 * @access  Private
 */
exports.getProfileImage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || !user.profileImage || !user.profileImage.data) {
      return res.status(404).json({
        success: false,
        message: 'Profile image not found',
      });
    }
    
    res.set('Content-Type', user.profileImage.contentType);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return res.send(user.profileImage.data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get signature
 * @route   GET /api/auth/profile/signature
 * @access  Private
 */
exports.getSignature = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || !user.signature || !user.signature.data) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found',
      });
    }
    
    res.set('Content-Type', user.signature.contentType);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return res.send(user.signature.data);
  } catch (error) {
    next(error);
  }
};