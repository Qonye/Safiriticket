import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  bookingNumber: string;
  safari: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  pax: number;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'KES' | 'CAD' | 'AUD';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paymentMethod?: string;
  depositAmount?: number;
  balanceAmount?: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Emergency contact name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Emergency contact phone is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true,
    maxlength: [50, 'Relationship cannot be more than 50 characters']
  }
});

const BookingSchema = new Schema<IBooking>({
  bookingNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  safari: {
    type: Schema.Types.ObjectId,
    ref: 'Safari',
    required: [true, 'Safari is required']
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  pax: {
    type: Number,
    required: [true, 'Number of pax is required'],
    min: [1, 'Pax must be at least 1'],
    max: [100, 'Pax cannot be more than 100']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'KES', 'CAD', 'AUD'],
    default: 'USD'
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special requests cannot be more than 1000 characters']
  },
  emergencyContact: {
    type: EmergencyContactSchema,
    required: [true, 'Emergency contact is required']
  },
  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    trim: true,
    maxlength: [50, 'Payment method cannot be more than 50 characters']
  },
  depositAmount: {
    type: Number,
    min: [0, 'Deposit amount cannot be negative']
  },
  balanceAmount: {
    type: Number,
    min: [0, 'Balance amount cannot be negative']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate booking number
BookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingNumber = `JD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes for better query performance
BookingSchema.index({ bookingNumber: 1 });
BookingSchema.index({ safari: 1 });
BookingSchema.index({ client: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ startDate: 1 });
BookingSchema.index({ createdBy: 1 });

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
