const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  uploadProfileImage, 
  getProfileImage,
  uploadSignature, 
  getSignature,
  getAdminSignature,
  changePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload, handleUploadError, fileFilter } = require('../middleware/upload');

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
  multer({ storage: multer.memoryStorage(), fileFilter }).single('profileImage'),
  handleUploadError,
  uploadProfileImage
);

// Get profile image
router.get('/profile/image', protect, getProfileImage);

// Upload signature
router.put(
  '/profile/signature',
  protect,
  multer({ storage: multer.memoryStorage(), fileFilter }).single('signature'),
  handleUploadError,
  uploadSignature
);

// Get signature
router.get('/profile/signature', protect, getSignature);

// Get admin signature (for testing PDF generation)
router.get('/admin/signature', protect, getAdminSignature);

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