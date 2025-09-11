import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentPreset extends Document {
  name: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  swiftCode: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'KES' | 'CAD' | 'AUD';
  additionalInfo: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentPresetSchema = new Schema<IPaymentPreset>({
  name: {
    type: String,
    required: [true, 'Preset name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [100, 'Account name cannot be more than 100 characters']
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    trim: true,
    maxlength: [50, 'Account number cannot be more than 50 characters']
  },
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true,
    maxlength: [100, 'Bank name cannot be more than 100 characters']
  },
  swiftCode: {
    type: String,
    required: [true, 'SWIFT code is required'],
    trim: true,
    maxlength: [20, 'SWIFT code cannot be more than 20 characters']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'KES', 'CAD', 'AUD'],
    default: 'USD'
  },
  additionalInfo: {
    type: String,
    trim: true,
    maxlength: [500, 'Additional info cannot be more than 500 characters'],
    default: '(Please use your name or invoice number as payment reference)'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
PaymentPresetSchema.index({ currency: 1, isActive: 1 });
PaymentPresetSchema.index({ isDefault: 1, currency: 1 });

// Ensure only one default per currency
PaymentPresetSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('PaymentPreset').updateMany(
      { currency: this.currency, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export default mongoose.models.PaymentPreset || mongoose.model<IPaymentPreset>('PaymentPreset', PaymentPresetSchema);
