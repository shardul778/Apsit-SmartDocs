const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Field name is required'],
    trim: true,
  },
  label: {
    type: String,
    required: [true, 'Field label is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Field type is required'],
    enum: ['text', 'textarea', 'date', 'select', 'image', 'signature', 'ai-text'],
  },
  placeholder: {
    type: String,
    trim: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: {
    type: [String], // For select fields
    default: undefined,
  },
  defaultValue: {
    type: String,
    default: '',
  },
  aiPrompt: {
    type: String, // For AI-assisted text fields
    default: '',
  },
  maxLength: {
    type: Number,
    default: null,
  },
  width: {
    type: String, // CSS width value (e.g., '100%', '300px')
    default: '100%',
  },
  height: {
    type: String, // CSS height value (for textareas, images)
    default: null,
  },
  position: {
    type: Number, // Order in the form
    required: true,
  },
  section: {
    type: String, // Section name for grouping fields
    default: 'default',
  },
});

const TemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    fields: [FieldSchema],
    header: {
      logo: {
        type: String, // Path to logo image
        default: null,
      },
      title: {
        type: String,
        default: '',
      },
      subtitle: {
        type: String,
        default: '',
      },
    },
    footer: {
      text: {
        type: String,
        default: '',
      },
      includePageNumbers: {
        type: Boolean,
        default: true,
      },
    },
    styling: {
      fontFamily: {
        type: String,
        default: 'Times New Roman',
      },
      fontSize: {
        type: Number,
        default: 12,
      },
      margins: {
        top: { type: Number, default: 72 }, // 1 inch in points
        right: { type: Number, default: 72 },
        bottom: { type: Number, default: 72 },
        left: { type: Number, default: 72 },
      },
      primaryColor: {
        type: String,
        default: '#000000',
      },
      secondaryColor: {
        type: String,
        default: '#666666',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', TemplateSchema);