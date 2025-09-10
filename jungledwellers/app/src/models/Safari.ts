import mongoose, { Document, Schema } from 'mongoose';

export interface IItineraryDay {
  day: number;
  date?: Date;
  location: string;
  activities: string[];
  accommodation?: string;
  meals: string[];
  transportation?: string;
  notes?: string;
}

export interface IInclusion {
  category: 'accommodation' | 'activities' | 'transportation' | 'meals' | 'park_fees' | 'guides' | 'other';
  description: string;
  pricePerPerson?: number;
  priceTotal?: number;
  quantity?: number;
  isIncluded: boolean;
}

export interface IExclusion {
  description: string;
  reason?: string;
}

export interface ISafari extends Document {
  title: string;
  description: string;
  duration: number; // in days
  maxPax: number;
  minPax: number;
  basePrice: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'KES' | 'CAD' | 'AUD';
  itinerary: IItineraryDay[];
  inclusions: IInclusion[];
  exclusions: IExclusion[];
  isActive: boolean;
  isTemplate: boolean;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ItineraryDaySchema = new Schema<IItineraryDay>({
  day: {
    type: Number,
    required: true,
    min: 1
  },
  date: {
    type: Date
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Location cannot be more than 200 characters']
  },
  activities: [{
    type: String,
    trim: true,
    maxlength: [200, 'Activity cannot be more than 200 characters']
  }],
  accommodation: {
    type: String,
    trim: true,
    maxlength: [200, 'Accommodation cannot be more than 200 characters']
  },
  meals: [{
    type: String,
    trim: true,
    maxlength: [100, 'Meal cannot be more than 100 characters']
  }],
  transportation: {
    type: String,
    trim: true,
    maxlength: [200, 'Transportation cannot be more than 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
});

const InclusionSchema = new Schema<IInclusion>({
  category: {
    type: String,
    required: true,
    enum: ['accommodation', 'activities', 'transportation', 'meals', 'park_fees', 'guides', 'other']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [300, 'Description cannot be more than 300 characters']
  },
  pricePerPerson: {
    type: Number,
    min: 0
  },
  priceTotal: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    min: 1,
    default: 1
  },
  isIncluded: {
    type: Boolean,
    default: true
  }
});

const ExclusionSchema = new Schema<IExclusion>({
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [300, 'Description cannot be more than 300 characters']
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [200, 'Reason cannot be more than 200 characters']
  }
});

const SafariSchema = new Schema<ISafari>({
  title: {
    type: String,
    required: [true, 'Safari title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Safari description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 day'],
    max: [365, 'Duration cannot be more than 365 days']
  },
  maxPax: {
    type: Number,
    required: [true, 'Maximum pax is required'],
    min: [1, 'Maximum pax must be at least 1'],
    max: [100, 'Maximum pax cannot be more than 100']
  },
  minPax: {
    type: Number,
    required: [true, 'Minimum pax is required'],
    min: [1, 'Minimum pax must be at least 1'],
    max: [100, 'Minimum pax cannot be more than 100']
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'KES', 'CAD', 'AUD'],
    default: 'USD'
  },
  itinerary: [ItineraryDaySchema],
  inclusions: [InclusionSchema],
  exclusions: [ExclusionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot be more than 50 characters']
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
SafariSchema.index({ title: 'text', description: 'text', tags: 'text' });
SafariSchema.index({ isActive: 1 });
SafariSchema.index({ isTemplate: 1 });
SafariSchema.index({ createdBy: 1 });
SafariSchema.index({ duration: 1 });
SafariSchema.index({ basePrice: 1 });

export default mongoose.models.Safari || mongoose.model<ISafari>('Safari', SafariSchema);
