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
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Document', DocumentSchema);