const express = require('express');
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Import controllers
const {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  uploadLogo,
  getCategories
} = require('../controllers/templateController');

// All routes below this are protected
router.use(protect);

// Get template categories
router.get('/categories', getCategories);

// Get all templates
router.get('/', getTemplates);

// Get single template
router.get('/:id', getTemplate);

// Admin only routes
router.use(authorize('admin'));

// Create template
router.post(
  '/',
  [
    check('name', 'Template name is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('fields', 'Fields are required').isArray(),
  ],
  createTemplate
);

// Update template
router.put(
  '/:id',
  [
    check('name', 'Template name is required').optional().not().isEmpty(),
    check('category', 'Category is required').optional().not().isEmpty(),
    check('fields', 'Fields must be an array').optional().isArray(),
  ],
  updateTemplate
);

// Delete template
router.delete('/:id', deleteTemplate);

// Upload template logo
router.put(
  '/:id/logo',
  upload.single('logo'),
  handleUploadError,
  uploadLogo
);

module.exports = router;