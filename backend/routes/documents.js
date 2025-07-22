const express = require('express');
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Import controllers
const {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  submitDocument,
  approveDocument,
  rejectDocument,
  generatePDF
} = require('../controllers/documentController');

// All routes below this are protected
router.use(protect);

// Get all documents
router.get('/', getDocuments);

// Get single document
router.get('/:id', getDocument);

// Create document
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('templateId', 'Template ID is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
  ],
  createDocument
);

// Update document
router.put(
  '/:id',
  [
    check('title', 'Title is required').optional().not().isEmpty(),
    check('content', 'Content is required').optional().not().isEmpty(),
  ],
  updateDocument
);

// Delete document
router.delete('/:id', deleteDocument);

// Submit document for approval
router.put('/:id/submit', submitDocument);

// Generate PDF
router.post('/:id/pdf', generatePDF);

// Admin only routes
router.use(authorize('admin'));

// Approve document
router.put('/:id/approve', approveDocument);

// Reject document
router.put(
  '/:id/reject',
  [
    check('reason', 'Rejection reason is required').not().isEmpty(),
  ],
  rejectDocument
);

module.exports = router;