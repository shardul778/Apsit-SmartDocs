const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
    },
    content: {
      type: Object, // JSON object containing field values
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    pdfUrl: {
      type: String, // Path to generated PDF
      default: null,
    },
    attachments: [{
      filename: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    metadata: {
      documentNumber: {
        type: String,
        default: null,
      },
      department: {
        type: String,
        default: null,
      },
      category: {
        type: String,
        default: null,
      },
      tags: [{
        type: String,
      }],
    },
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [{
      version: Number,
      content: Object,
      updatedAt: Date,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      pdfUrl: String,
    }],
    // Denormalized field for full-text search
    searchText: {
      type: String,
      default: '',
      index: false,
    },
  },
  { timestamps: true }
);

// Generate document number before saving
DocumentSchema.pre('save', async function (next) {
  try {
    // Only generate document number for new documents
    if (this.isNew && !this.metadata.documentNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      // Get count of documents created in this month
      const Document = this.constructor;
      const startOfMonth = new Date(year, date.getMonth(), 1);
      const endOfMonth = new Date(year, date.getMonth() + 1, 0);
      
      const count = await Document.countDocuments({
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });
      
      // Format: DOC-YYYY-MM-XXXX (where XXXX is sequential number)
      this.metadata.documentNumber = `DOC-${year}-${month}-${String(count + 1).padStart(4, '0')}`;
    }
    
    // Rebuild searchText if content/title/metadata changed or on new
    if (this.isNew || this.isModified('title') || this.isModified('content') || this.isModified('metadata')) {
      const parts = [];
      if (typeof this.title === 'string') parts.push(this.title);
      if (this.metadata) {
        if (this.metadata.documentNumber) parts.push(this.metadata.documentNumber);
        if (this.metadata.department) parts.push(this.metadata.department);
        if (this.metadata.category) parts.push(this.metadata.category);
        if (Array.isArray(this.metadata.tags)) parts.push(this.metadata.tags.join(' '));
      }
      if (this.content && typeof this.content === 'object') {
        Object.values(this.content).forEach(v => {
          if (typeof v === 'string') parts.push(v);
        });
      } else if (typeof this.content === 'string') {
        parts.push(this.content);
      }
      this.searchText = parts.join(' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Weighted text index for improved relevance
// Title and document number are most important, then tags/category/department, then body content
DocumentSchema.index(
  {
    searchText: 'text',
    title: 'text',
  },
  {
    weights: {
      title: 10,
      searchText: 5,
    },
    name: 'DocumentTextIndex',
    default_language: 'english',
  }
);

module.exports = mongoose.model('Document', DocumentSchema);