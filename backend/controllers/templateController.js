const Template = require('../models/Template');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Create a new template
 * @route   POST /api/templates
 * @access  Private/Admin
 */
exports.createTemplate = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Add user ID to request body
    req.body.createdBy = req.user._id;

    // Create template
    const template = await Template.create(req.body);

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all templates
 * @route   GET /api/templates
 * @access  Private
 */
exports.getTemplates = async (req, res, next) => {
  try {
    // Build query
    const query = { isActive: true };

    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Execute query
    const templates = await Template.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single template
 * @route   GET /api/templates/:id
 * @access  Private
 */
exports.getTemplate = async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update template
 * @route   PUT /api/templates/:id
 * @access  Private/Admin
 */
exports.updateTemplate = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Find template
    let template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Update template
    template = await Template.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete template
 * @route   DELETE /api/templates/:id
 * @access  Private/Admin
 */
exports.deleteTemplate = async (req, res, next) => {
  try {
    // Find template
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Instead of deleting, mark as inactive
    template.isActive = false;
    await template.save();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload template logo
 * @route   PUT /api/templates/:id/logo
 * @access  Private/Admin
 */
exports.uploadLogo = async (req, res, next) => {
  try {
    // Find template
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    // Delete old logo if exists
    if (template.header.logo) {
      const oldLogoPath = path.join(
        __dirname,
        '..',
        template.header.logo.replace(/^\/uploads/, process.env.UPLOAD_PATH || 'uploads')
      );
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Get file path
    const logoPath = `/uploads/logos/${req.file.filename}`;

    // Update template logo
    template.header.logo = logoPath;
    await template.save();

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get template categories
 * @route   GET /api/templates/categories
 * @access  Private
 */
exports.getCategories = async (req, res, next) => {
  try {
    // Get distinct categories
    const categories = await Template.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};