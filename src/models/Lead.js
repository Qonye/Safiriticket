import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  sourceWebsite: {
    type: String,
    required: true,
    enum: ['jungledwellers', 'safiritickets'],
    index: true
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'converted', 'lost'],
    default: 'new',
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // Flexible storage for form-specific fields:
    // - tripDetails: { arrivalDate, departureDate, adults, children, teens }
    // - projectDetails: { preferredContactMethod, preferredTime }
    // - Any other form-specific data
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  convertedToClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  }
}, {
  timestamps: true
});

// Index for efficient queries
leadSchema.index({ email: 1, sourceWebsite: 1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ sourceWebsite: 1, createdAt: -1 });

export default mongoose.model('Lead', leadSchema);

