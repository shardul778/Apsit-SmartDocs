const Document = require('../models/Document');
const Template = require('../models/Template');
const { validationResult } = require('express-validator');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * @desc    Create a new document
 * @route   POST /api/documents
 * @access  Private
 */
exports.createDocument = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { title, templateId, content, metadata } = req.body;

    // Check if template exists
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Create document
    const document = await Document.create({
      title,
      template: templateId,
      content,
      createdBy: req.user._id,
      metadata: {
        ...metadata,
        department: req.user.department,
      },
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload attachment to a document
 * @route   POST /api/documents/:id/attachments
 * @access  Private
 */
exports.uploadAttachment = async (req, res) => {
  try {
    // Check if document exists and user has permission
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user is admin or document creator
    if (!req.user.isAdmin && document.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to upload attachments to this document' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Create attachment object
    const attachment = {
      filename: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };
    
    // Add attachment to document
    document.attachments = document.attachments || [];
    document.attachments.push(attachment);
    
    // Save document
    await document.save();
    
    res.status(200).json({
      success: true,
      data: attachment,
      message: 'Attachment uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid document ID format' });
    }
    res.status(500).json({ message: 'Server error uploading attachment' });
  }
};

/**
 * @desc    Delete attachment from a document
 * @route   DELETE /api/documents/:id/attachments/:attachmentId
 * @access  Private
 */
exports.deleteAttachment = async (req, res) => {
  try {
    // Check if document exists and user has permission
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user is admin or document creator
    if (!req.user.isAdmin && document.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete attachments from this document' });
    }
    
    // Find the attachment by ID
    const attachmentId = req.params.attachmentId;
    const attachmentIndex = document.attachments.findIndex(a => a._id.toString() === attachmentId);
    
    if (attachmentIndex === -1) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    
    // Get the attachment to delete its file
    const attachmentToDelete = document.attachments[attachmentIndex];
    
    // Remove the file from the filesystem
    try {
      if (fs.existsSync(attachmentToDelete.path)) {
        fs.unlinkSync(attachmentToDelete.path);
      }
    } catch (err) {
      console.error('Error deleting attachment file:', err);
      // Continue with removing from database even if file deletion fails
    }
    
    // Remove attachment from document
    document.attachments.splice(attachmentIndex, 1);
    
    // Save document
    await document.save();
    
    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid document or attachment ID format' });
    }
    res.status(500).json({ message: 'Server error deleting attachment' });
  }
};

/**
 * @desc    Get all documents
 * @route   GET /api/documents
 * @access  Private
 */
exports.getDocuments = async (req, res, next) => {
  try {
    // Build query
    const query = {};

    // If user is not admin, only show their documents
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by category if provided
    if (req.query.category) {
      query['metadata.category'] = req.query.category;
    }

    // Filter by department if provided
    if (req.query.department) {
      query['metadata.department'] = req.query.department;
    }

    // Title search (case-insensitive contains) if 'search' provided
    if (req.query.search && req.query.search.trim()) {
      const search = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: search, $options: 'i' };
    }

    // Execute query with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const documents = await Document.find(query)
      .populate('template', 'name category')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await Document.countDocuments(query);

    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single document
 * @route   GET /api/documents/:id
 * @access  Private
 */
exports.getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('template')
      .populate('createdBy', 'name email department position')
      .populate('approvedBy', 'name email department position');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check if user has access to document
    if (req.user.role !== 'admin' && document.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document',
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update document
 * @route   PUT /api/documents/:id
 * @access  Private
 */
exports.updateDocument = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Find document
    let document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check if user has access to document
    if (req.user.role !== 'admin' && document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this document',
      });
    }

    // Check if document is already approved
    if (document.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update an approved document',
      });
    }

    // Store previous version if document is not a draft
    if (document.status !== 'draft') {
      document.previousVersions.push({
        version: document.version,
        content: document.content,
        updatedAt: document.updatedAt,
        updatedBy: document.createdBy,
        pdfUrl: document.pdfUrl,
      });

      // Increment version
      document.version += 1;
    }

    // Update document
    const { title, content, metadata } = req.body;
    document.title = title || document.title;
    document.content = content || document.content;
    if (metadata) {
      document.metadata = {
        ...document.metadata,
        ...metadata,
      };
    }

    // Reset status to draft if it was rejected
    if (document.status === 'rejected') {
      document.status = 'draft';
      document.rejectionReason = null;
    }

    await document.save();

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete document
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    // Find document
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check if user has access to document
    if (req.user.role !== 'admin' && document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document',
      });
    }

    // Delete PDF file if exists
    if (document.pdfUrl) {
      const pdfPath = path.join(
        __dirname,
        '..',
        document.pdfUrl.replace(/^\/uploads/, process.env.UPLOAD_PATH || 'uploads')
      );
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

    // Delete document using deleteOne (avoid remove() deprecation/behavior issues)
    await Document.deleteOne({ _id: document._id });

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

/**
 * @desc    Submit document for approval
 * @route   PUT /api/documents/:id/submit
 * @access  Private
 */
exports.submitDocument = async (req, res, next) => {
  try {
    // Find document
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check if user has access to document
    if (document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this document',
      });
    }

    // Check if document is already submitted or approved
    if (document.status !== 'draft' && document.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Document is already ${document.status}`,
      });
    }

    // Update document status
    document.status = 'pending';
    await document.save();

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve document
 * @route   PUT /api/documents/:id/approve
 * @access  Private/Admin
 */
exports.approveDocument = async (req, res, next) => {
  try {
    // Find document
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check if document is pending
    if (document.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Document is not pending approval',
      });
    }

    // Update document status
    document.status = 'approved';
    document.approvedBy = req.user._id;
    document.approvalDate = Date.now();
    await document.save();

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject document
 * @route   PUT /api/documents/:id/reject
 * @access  Private/Admin
 */
exports.rejectDocument = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { reason } = req.body;

    // Find document
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check if document is pending
    if (document.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Document is not pending approval',
      });
    }

    // Update document status
    document.status = 'rejected';
    document.rejectionReason = reason;
    await document.save();

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate PDF
 * @route   POST /api/documents/:id/pdf
 * @access  Private
 */
exports.generatePDF = async (req, res, next) => {
  try {
    // Find document with template
    const document = await Document.findById(req.params.id).populate('template');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check if user has access to document
    if (req.user.role !== 'admin' && document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document',
      });
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page
    const page = pdfDoc.addPage();
    
    // Get page dimensions
    const { width, height } = page.getSize();
    
    // Set font
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    // Set margins from template
    const margins = document.template.styling.margins;
    
    // Draw header
    if (document.template.header.logo) {
      // Logo would be embedded here
      // This is a simplified version without actual image embedding
      page.drawText('LOGO', {
        x: margins.left,
        y: height - margins.top,
        size: 12,
        font: boldFont,
      });
    }
    
    // Draw title
    page.drawText(document.title, {
      x: margins.left,
      y: height - margins.top - 40,
      size: 16,
      font: boldFont,
    });
    
    // Draw content
    // This is a simplified version - in a real implementation,
    // you would iterate through the content object and render each field
    let yPosition = height - margins.top - 80;
    
    // Example of rendering a few fields
    Object.entries(document.content).forEach(([key, value]) => {
      // Skip image fields or handle them separately
      if (typeof value === 'string') {
        page.drawText(`${key}: ${value}`, {
          x: margins.left,
          y: yPosition,
          size: 12,
          font,
          maxWidth: width - margins.left - margins.right,
        });
        yPosition -= 20;
      }
    });
    
    // Draw footer
    if (document.template.footer.text) {
      page.drawText(document.template.footer.text, {
        x: width / 2 - 100,
        y: margins.bottom,
        size: 10,
        font,
      });
    }
    
    // Add page numbers if enabled
    if (document.template.footer.includePageNumbers) {
      page.drawText(`Page 1 of 1`, {
        x: width - margins.right - 60,
        y: margins.bottom,
        size: 10,
        font,
      });
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    
    // Create uploads/pdfs directory if it doesn't exist
    const pdfDir = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    
    // Generate filename
    const filename = `${document.metadata.documentNumber || document._id}-${Date.now()}.pdf`;
    const filePath = path.join(pdfDir, filename);
    
    // Write file
    fs.writeFileSync(filePath, pdfBytes);
    
    // Update document with PDF URL
    const pdfUrl = `/uploads/pdfs/${filename}`;
    document.pdfUrl = pdfUrl;
    await document.save();
    
    res.status(200).json({
      success: true,
      pdfUrl,
    });
  } catch (error) {
    next(error);
  }
};