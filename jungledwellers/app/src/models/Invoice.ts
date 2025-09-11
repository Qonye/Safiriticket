import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: 'accommodation' | 'activities' | 'transportation' | 'meals' | 'park_fees' | 'guides' | 'other';
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  booking?: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  safari?: mongoose.Types.ObjectId;
  items: IInvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'KES' | 'CAD' | 'AUD';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: string;
  notes?: string;
  termsAndConditions?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  category: {
    type: String,
    enum: ['accommodation', 'activities', 'transportation', 'meals', 'park_fees', 'guides', 'other']
  }
});

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  safari: {
    type: Schema.Types.ObjectId,
    ref: 'Safari'
  },
  items: [InvoiceItemSchema],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot be more than 100%']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discountRate: {
    type: Number,
    default: 0,
    min: [0, 'Discount rate cannot be negative'],
    max: [100, 'Discount rate cannot be more than 100%']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
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
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  paidDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    trim: true,
    maxlength: [50, 'Payment method cannot be more than 50 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  termsAndConditions: {
    type: String,
    trim: true,
    maxlength: [5000, 'Terms and conditions cannot be more than 5000 characters']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate invoice number
InvoiceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes for better query performance
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ booking: 1 });
InvoiceSchema.index({ client: 1 });
InvoiceSchema.index({ safari: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ createdBy: 1 });

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
