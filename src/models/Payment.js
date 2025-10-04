import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, enum: ['USD', 'EUR', 'GBP', 'KES'] },
  status: { 
    type: String, 
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentMethod: { 
    type: String, 
    enum: ['INTASEND', 'MPESA', 'CARD', 'BANK_TRANSFER', 'CASH', 'OTHER'],
    default: 'INTASEND'
  },
  transactionId: String,
  paymentDate: Date,
  notes: String,
  metadata: Object, // For storing IntaSend response data
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Index for faster queries
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
