const express = require('express');
const { check } = require('express-validator');
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  uploadProfileImage, 
  uploadSignature, 
  changePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Register user
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('department', 'Department is required').not().isEmpty(),
  ],
  register
);

// Login user
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  login
);

// Get current user
router.get('/me', protect, getMe);

// Update profile
router.put(
  '/profile',
  protect,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty(),
  ],
  updateProfile
);

// Upload profile image
router.put(
  '/profile/image',
  protect,
  upload.single('profileImage'),
  handleUploadError,
  uploadProfileImage
);

// Upload signature
router.put(
  '/profile/signature',
  protect,
  upload.single('signature'),
  handleUploadError,
  uploadSignature
);

// Change password
router.put(
  '/password',
  protect,
  [
    check('currentPassword', 'Current password is required').not().isEmpty(),
    check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 }),
  ],
  changePassword
);

module.exports = router;