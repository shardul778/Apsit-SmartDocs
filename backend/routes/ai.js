const express = require('express');
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  generateText,
  getModels,
  classifyText
} = require('../controllers/aiController');

// All routes below this are protected (temporarily disabled for testing)
// router.use(protect);

// Get available AI models
router.get('/models', getModels);

// AI service health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI service is running',
    timestamp: new Date().toISOString(),
    available: true
  });
});

// Generate text
router.post(
  '/generate',
  [
    check('prompt', 'Prompt is required').not().isEmpty(),
    check('maxLength', 'Max length must be a number').optional().isNumeric(),
    check('temperature', 'Temperature must be a number between 0 and 1').optional().isFloat({ min: 0, max: 1 }),
    check('type', 'Type must be one of: generate, paraphrase, summarize, formal, expand').optional().isIn(['generate', 'paraphrase', 'summarize', 'formal', 'expand']),
  ],
  generateText
);

// Classify text/content
router.post('/classify', classifyText);

module.exports = router;