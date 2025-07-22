const express = require('express');
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Import controllers
// Note: These controller functions need to be implemented
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole
} = require('../controllers/userController');

// All routes below this are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Get all users
router.get('/', getUsers);

// Get single user
router.get('/:id', getUser);

// Create user
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('department', 'Department is required').not().isEmpty(),
    check('role', 'Role is required').isIn(['user', 'admin']),
  ],
  createUser
);

// Update user
router.put(
  '/:id',
  [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('department', 'Department is required').optional().not().isEmpty(),
    check('role', 'Role must be either user or admin').optional().isIn(['user', 'admin']),
  ],
  updateUser
);

// Delete user
router.delete('/:id', deleteUser);

// Update user role
router.put(
  '/:id/role',
  [
    check('role', 'Role must be either user or admin').isIn(['user', 'admin']),
  ],
  updateUserRole
);

module.exports = router;