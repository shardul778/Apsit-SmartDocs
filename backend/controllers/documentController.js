const Document = require('../models/Document');
const Template = require('../models/Template');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Helper function to convert HTML to formatted text while preserving structure
const htmlToFormattedText = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  let text = html;
  
  // Convert block elements to line breaks
  text = text.replace(/<\/?(div|p|h[1-6]|section|article|header|footer|main|aside|nav|blockquote|pre|ul|ol|li|table|tr|td|th|form|fieldset|legend)[^>]*>/gi, '\n');
  
  // Convert inline elements to appropriate spacing
  text = text.replace(/<\/?(br|hr)[^>]*>/gi, '\n');
  
  // Handle bold and italic by adding markers
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  // Handle headings
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n#$1\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n##$1\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n###$1\n');
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n\n####$1\n');
  text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n\n#####$1\n');
  text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n\n######$1\n');
  
  // Handle lists
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
  
  // Remove remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™');
  
  // Clean up whitespace while preserving structure
  text = text
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // Replace multiple line breaks with double line breaks
    .replace(/[ \t]+/g, ' ')           // Replace multiple spaces/tabs with single space
    .replace(/\n[ \t]+/g, '\n')        // Remove leading spaces from lines
    .replace(/[ \t]+\n/g, '\n')        // Remove trailing spaces from lines
    .trim();
  
  // Remove page number placeholders
  text = text.replace(/\{pagenumber\}/gi, '');
  text = text.replace(/\{page\}/gi, '');
  text = text.replace(/\{page number\}/gi, '');
  text = text.replace(/\{[^}]*page[^}]*\}/gi, '');
  
  return text;
};

// Helper function to format content for PDF
const formatContentForPDF = (content) => {
  if (!content) return '';
  
  let formattedContent = '';
  
  // Handle different content structures
  if (content.body) {
    // If content has a body field, use that
    formattedContent = htmlToFormattedText(content.body);
  } else if (typeof content === 'string') {
    // If content is a string, convert HTML to formatted text
    formattedContent = htmlToFormattedText(content);
  } else if (typeof content === 'object') {
    // If content is an object, iterate through key-value pairs
    Object.entries(content).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const cleanValue = htmlToFormattedText(value);
        if (cleanValue) {
          formattedContent += `${key}:\n${cleanValue}\n\n`;
        }
      }
    });
  }
  
  // AGGRESSIVE placeholder removal - remove ALL possible page number placeholders
  formattedContent = formattedContent
    .replace(/\{pagenumber\}/gi, '')
    .replace(/\{page\}/gi, '')
    .replace(/\{page number\}/gi, '')
    .replace(/\{pageNumber\}/gi, '')
    .replace(/\{PageNumber\}/gi, '')
    .replace(/\{PAGENUMBER\}/gi, '')
    .replace(/\{page_number\}/gi, '')
    .replace(/\{pageNumber\}/gi, '')
    .replace(/\{[^}]*page[^}]*\}/gi, '')
    .replace(/\{[^}]*Page[^}]*\}/gi, '')
    .replace(/\{[^}]*PAGE[^}]*\}/gi, '');
  
  return formattedContent.trim();
};

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
        // Respect explicitly chosen department; fallback to user's department
        department: (metadata && metadata.department) ? metadata.department : req.user.department,
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

    // Full-text search with fallback if 'search' provided
    let sort = { createdAt: -1 };
    let projection = {};
    if (req.query.search && req.query.search.trim()) {
      const search = req.query.search.trim();
      // Prefer text search when index is available
      query.$text = { $search: search };
      projection = { score: { $meta: 'textScore' } };
      sort = { score: { $meta: 'textScore' }, createdAt: -1 };
    }

    // Execute query with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let documents = await Document.find(query, projection)
      .populate('template', 'name category')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);

    // Fallback: if text search yields no results (or index missing), retry with safe regex across title and searchText
    if ((!documents || documents.length === 0) && req.query.search && req.query.search.trim()) {
      const safe = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      const regexQuery = { ...query };
      delete regexQuery.$text;
      documents = await Document.find({
        ...regexQuery,
        $or: [
          { title: regex },
          { searchText: regex },
        ],
      })
        .populate('template', 'name category')
        .populate('createdBy', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);
    }

    // Get total count (respect text or regex search)
    let total;
    if (req.query.search && req.query.search.trim()) {
      if (query.$text) {
        total = await Document.countDocuments(query);
      } else {
        const safe = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safe, 'i');
        total = await Document.countDocuments({
          ...query,
          $or: [{ title: regex }, { searchText: regex }],
        });
      }
    } else {
      total = await Document.countDocuments(query);
    }

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

    // Check if document is already approved (allow admins to edit approved documents)
    if (document.status === 'approved' && req.user.role !== 'admin') {
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

    // Check if user has access to document (creator or admin)
    if (req.user.role !== 'admin' && document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this document',
      });
    }

    // Allow submission from any status except 'pending'
    if (document.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Document is already pending approval',
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
    // Find document with template and users
    const document = await Document.findById(req.params.id)
      .populate('template')
      .populate('createdBy')
      .populate('approvedBy');
    
    // Find an admin user for signature (fallback)
    const adminUser = await User.findOne({ role: 'admin' });

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
    
    // Draw header with DS_header.png logo - centered and full width
    try {
      // Load DS_header.png from frontend public directory
      const logoPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'DS_header.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const logoImage = await pdfDoc.embedPng(logoBuffer);
        
        // Calculate logo dimensions to take full page width
        const availableWidth = width - margins.left - margins.right;
        const logoWidth = availableWidth; // Full width
        const logoHeight = (logoImage.height * logoWidth) / logoImage.width;
        
        // Center the logo horizontally
        const logoX = (width - logoWidth) / 2;
        
        // Draw logo at top of page, centered and full width
        page.drawImage(logoImage, {
          x: logoX,
          y: height - margins.top - logoHeight,
          width: logoWidth,
          height: logoHeight,
        });
      }
    } catch (logoError) {
      console.log('Logo not found or error loading logo:', logoError.message);
      // Fallback to text if logo not found
      page.drawText('APSIT SmartDocs', {
        x: width / 2 - 50, // Center the text
        y: height - margins.top - 20,
        size: 16,
        font: boldFont,
      });
    }
    
    // Draw title (positioned below logo)
    const titleY = height - margins.top - 120; // Adjusted for full-width logo space
    page.drawText(document.title, {
      x: margins.left,
      y: titleY,
      size: 16,
      font: boldFont,
    });
    
    // Draw content with proper pagination
    let currentPage = page;
    let yPosition = titleY - 40; // Start content below title
    let pageNumber = 1;
    const totalPages = [];
    
    // Format content for PDF (preserve formatting)
    let formattedContent = formatContentForPDF(document.content);
    
    // DEBUG: Log the content to see what we're working with
    console.log('DEBUG: Raw document content:', JSON.stringify(document.content, null, 2));
    console.log('DEBUG: Formatted content before cleanup:', formattedContent);
    
    // AGGRESSIVE: Clean the raw document content itself
    if (document.content && typeof document.content === 'object') {
      // If content is an object, clean all string values
      Object.keys(document.content).forEach(key => {
        if (typeof document.content[key] === 'string') {
          document.content[key] = document.content[key]
            .replace(/\{pagenumber\}/gi, '')
            .replace(/\{page\}/gi, '')
            .replace(/\{page number\}/gi, '')
            .replace(/\{pageNumber\}/gi, '')
            .replace(/\{PageNumber\}/gi, '')
            .replace(/\{PAGENUMBER\}/gi, '')
            .replace(/\{[^}]*page[^}]*\}/gi, '');
        }
      });
    } else if (typeof document.content === 'string') {
      // If content is a string, clean it directly
      document.content = document.content
        .replace(/\{pagenumber\}/gi, '')
        .replace(/\{page\}/gi, '')
        .replace(/\{page number\}/gi, '')
        .replace(/\{pageNumber\}/gi, '')
        .replace(/\{PageNumber\}/gi, '')
        .replace(/\{PAGENUMBER\}/gi, '')
        .replace(/\{[^}]*page[^}]*\}/gi, '');
    }
    
    // FINAL AGGRESSIVE placeholder removal - catch everything that might have been missed
    if (formattedContent) {
      // Remove ALL possible page number placeholders
      formattedContent = formattedContent
        .replace(/\{pagenumber\}/gi, '')
        .replace(/\{page\}/gi, '')
        .replace(/\{page number\}/gi, '')
        .replace(/\{pageNumber\}/gi, '')
        .replace(/\{PageNumber\}/gi, '')
        .replace(/\{PAGENUMBER\}/gi, '')
        .replace(/\{page_number\}/gi, '')
        .replace(/\{pageNumber\}/gi, '')
        .replace(/\{[^}]*page[^}]*\}/gi, '')
        .replace(/\{[^}]*Page[^}]*\}/gi, '')
        .replace(/\{[^}]*PAGE[^}]*\}/gi, '')
        .replace(/\{[^}]*pagenumber[^}]*\}/gi, '')
        .replace(/\{[^}]*PAGENUMBER[^}]*\}/gi, '');
      
      // Replace other placeholders
      formattedContent = formattedContent.replace(/\{date\}/gi, new Date().toLocaleDateString());
      formattedContent = formattedContent.replace(/\{title\}/gi, document.title || 'Document');
    }
    
    if (formattedContent) {
      // FINAL FINAL check - remove any remaining placeholders
      formattedContent = formattedContent
        .replace(/\{pagenumber\}/gi, '')
        .replace(/\{page\}/gi, '')
        .replace(/\{page number\}/gi, '')
        .replace(/\{pageNumber\}/gi, '')
        .replace(/\{PageNumber\}/gi, '')
        .replace(/\{PAGENUMBER\}/gi, '')
        .replace(/\{[^}]*page[^}]*\}/gi, '');
      
      console.log('DEBUG: Final formatted content:', formattedContent);
      
      const maxWidth = width - margins.left - margins.right;
      const lines = formattedContent.split('\n');
      
      // Function to add page numbers
      const addPageNumber = (page, pageNum, totalPages) => {
        // Always add page numbers
        page.drawText(`Page ${pageNum} of ${totalPages}`, {
          x: width - margins.right - 60,
          y: margins.bottom + 10,
          size: 10,
          font,
        });
      };
      
      // Function to create a new page
      const createNewPage = async () => {
        const newPage = pdfDoc.addPage();
        pageNumber++;
        totalPages.push(newPage);
        
        // Draw header logo on new page - centered and full width
        try {
          const logoPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'DS_header.png');
          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const logoImage = await pdfDoc.embedPng(logoBuffer);
            
            // Calculate logo dimensions to take full page width
            const availableWidth = newPage.getSize().width - margins.left - margins.right;
            const logoWidth = availableWidth; // Full width
            const logoHeight = (logoImage.height * logoWidth) / logoImage.width;
            
            // Center the logo horizontally
            const logoX = (newPage.getSize().width - logoWidth) / 2;
            
            newPage.drawImage(logoImage, {
              x: logoX,
              y: newPage.getSize().height - margins.top - logoHeight,
              width: logoWidth,
              height: logoHeight,
            });
          }
        } catch (logoError) {
          console.log('Logo not found on new page:', logoError.message);
          newPage.drawText('APSIT SmartDocs', {
            x: newPage.getSize().width / 2 - 50, // Center the text
            y: newPage.getSize().height - margins.top - 20,
            size: 16,
            font: boldFont,
          });
        }
        
        // Draw title on new page
        newPage.drawText(document.title, {
          x: margins.left,
          y: newPage.getSize().height - margins.top - 120, // Adjusted for full-width logo
          size: 16,
          font: boldFont,
        });
        
        return newPage;
      };

      // Helper function to check if we need a new page
      const needsNewPage = (requiredHeight) => {
        return yPosition - requiredHeight < margins.bottom + 50;
      };

      // Helper function to get proper starting Y position for new page
      const getNewPageStartY = (page) => {
        return page.getSize().height - margins.top - 160; // Account for logo + title + spacing
      };
      
      // Process each line with proper pagination
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip empty lines but preserve spacing
        if (line.trim() === '') {
          yPosition -= 10;
          continue;
        }
        
        // Handle special formatting
        let fontSize = 12;
        let currentFont = font;
        let lineText = line;
        let lineHeight = fontSize + 2;
        
        // Handle headings
        if (line.startsWith('#')) {
          fontSize = 16;
          currentFont = boldFont;
          lineText = line.replace(/^#+\s*/, '');
          lineHeight = fontSize + 4;
        } else if (line.startsWith('**') && line.endsWith('**')) {
          currentFont = boldFont;
          lineText = line.replace(/\*\*/g, '');
        } else if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
          lineText = line.replace(/\*/g, '');
        } else if (line.startsWith('•')) {
          lineText = '  ' + line;
        }
        
        // Word wrap the line if it's too long
        const words = lineText.split(' ');
        let currentLine = '';
        
        for (let j = 0; j < words.length; j++) {
          const word = words[j];
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = currentFont.widthOfTextAtSize(testLine, fontSize);
          
          if (textWidth > maxWidth && currentLine) {
            // Check if we need a new page for this wrapped line
            if (needsNewPage(lineHeight)) {
              currentPage = await createNewPage();
              yPosition = getNewPageStartY(currentPage);
            }
            
            // Draw current line
            currentPage.drawText(currentLine, {
              x: margins.left,
              y: yPosition,
              size: fontSize,
              font: currentFont,
              maxWidth: maxWidth,
            });
            yPosition -= lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        // Draw the remaining line
        if (currentLine) {
          // Final check for page space
          if (needsNewPage(lineHeight)) {
            currentPage = await createNewPage();
            yPosition = getNewPageStartY(currentPage);
          }
          
          currentPage.drawText(currentLine, {
            x: margins.left,
            y: yPosition,
            size: fontSize,
            font: currentFont,
            maxWidth: maxWidth,
          });
          yPosition -= lineHeight;
        }
      }
      
      // Resolve which user's signature to use: approving admin > any admin > current admin
      let signerUser = (document.approvedBy && document.approvedBy.signature && document.approvedBy.signature.data)
        ? document.approvedBy
        : (adminUser && adminUser.signature && adminUser.signature.data)
          ? adminUser
          : null;
      if (!signerUser && req.user && req.user.role === 'admin') {
        const currentAdmin = await User.findById(req.user._id);
        if (currentAdmin && currentAdmin.signature && currentAdmin.signature.data) {
          signerUser = currentAdmin;
        }
      }

      // ALWAYS add signature section - use image if available, fallback to text
      console.log('Adding signature to PDF. Signer user:', signerUser ? signerUser.name : 'None');
      
      // Add signature at the end of the document
      if (signerUser && signerUser.signature && signerUser.signature.data) {
        try {
          // Add some space before signature
          yPosition -= 40;
          
          // Check if we need a new page for signature
          if (needsNewPage(100)) {
            currentPage = await createNewPage();
            yPosition = getNewPageStartY(currentPage);
          }
          
          // Draw signature label
          currentPage.drawText('Signature:', {
            x: margins.left,
            y: yPosition,
            size: 12,
            font: boldFont,
          });
          
          yPosition -= 20;
          
          // Embed and draw signature image (support PNG and JPEG)
          let signatureImage;
          try {
            if (signerUser.signature.contentType && signerUser.signature.contentType.includes('png')) {
              signatureImage = await pdfDoc.embedPng(signerUser.signature.data);
            } else if (signerUser.signature.contentType && (signerUser.signature.contentType.includes('jpeg') || signerUser.signature.contentType.includes('jpg'))) {
              signatureImage = await pdfDoc.embedJpg(signerUser.signature.data);
            } else {
              // Try PNG first, then JPEG as fallback if contentType is missing/unknown
              try {
                signatureImage = await pdfDoc.embedPng(signerUser.signature.data);
              } catch (e) {
                signatureImage = await pdfDoc.embedJpg(signerUser.signature.data);
              }
            }
          } catch (embedErr) {
            throw new Error('Unsupported signature image format');
          }
          
          // Calculate signature dimensions (moderate size - 80px width, 50px height)
          const signatureMaxWidth = 80;
          const signatureWidth = Math.min(signatureMaxWidth, signatureImage.width);
          const signatureHeight = (signatureImage.height * signatureWidth) / signatureImage.width;
          
          // Moderate height constraint (max height 50px)
          const signatureMaxHeight = 50;
          if (signatureHeight > signatureMaxHeight) {
            const heightScale = signatureMaxHeight / signatureHeight;
            const adjustedWidth = signatureWidth * heightScale;
            const adjustedHeight = signatureMaxHeight;
            
            // Draw signature with adjusted dimensions
            currentPage.drawImage(signatureImage, {
              x: margins.left,
              y: yPosition - adjustedHeight,
              width: adjustedWidth,
              height: adjustedHeight,
            });
            
            yPosition -= adjustedHeight + 20;
          } else {
            // Draw signature with original calculated dimensions
            currentPage.drawImage(signatureImage, {
              x: margins.left,
              y: yPosition - signatureHeight,
              width: signatureWidth,
              height: signatureHeight,
            });
            
            yPosition -= signatureHeight + 20;
          }
          
          // Draw signer name below signature
          if (signerUser.name) {
            currentPage.drawText(signerUser.name, {
              x: margins.left,
              y: yPosition,
              size: 10,
              font,
            });
          }
          if (signerUser.position) {
            yPosition -= 12;
            currentPage.drawText(signerUser.position, {
              x: margins.left,
              y: yPosition,
              size: 10,
              font,
            });
          }
        } catch (signatureError) {
          console.log('Error adding admin signature:', signatureError.message);
          // Fallback to text signature
          currentPage.drawText('Signature: _________________', {
            x: margins.left,
            y: yPosition,
            size: 12,
            font,
          });
        }
      } else {
        // NO SIGNATURE IMAGE AVAILABLE - Add text signature with admin info
        console.log('No signature image available, adding text signature');
        
        // Add some space before signature
        yPosition -= 40;
        
        // Check if we need a new page for signature
        if (needsNewPage(100)) {
          currentPage = await createNewPage();
          yPosition = getNewPageStartY(currentPage);
        }
        
        // Draw signature label
        currentPage.drawText('Signature:', {
          x: margins.left,
          y: yPosition,
          size: 12,
          font: boldFont,
        });
        
        yPosition -= 20;
        
        // Draw signature line
        currentPage.drawText('_________________________', {
          x: margins.left,
          y: yPosition,
          size: 12,
          font,
        });
        
        yPosition -= 30;
        
        // Draw admin name and position
        const displayUser = signerUser || adminUser || req.user;
        if (displayUser && displayUser.name) {
          currentPage.drawText(displayUser.name, {
            x: margins.left,
            y: yPosition,
            size: 10,
            font,
          });
          yPosition -= 12;
        }
        if (displayUser && displayUser.position) {
          currentPage.drawText(displayUser.position, {
            x: margins.left,
            y: yPosition,
            size: 10,
            font,
          });
        }
      }
      
      // Add page numbers to all pages
      const totalPageCount = pageNumber;
      
      // Add page number to first page
      addPageNumber(page, 1, totalPageCount);
      
      // Add page numbers to additional pages
      totalPages.forEach((page, index) => {
        addPageNumber(page, index + 2, totalPageCount);
      });
    }
    
    // Draw footer on first page
    if (document.template.footer.text) {
      page.drawText(document.template.footer.text, {
        x: width / 2 - 100,
        y: margins.bottom + 10,
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