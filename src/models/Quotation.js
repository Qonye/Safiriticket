import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  items: [{ description: String, quantity: Number, price: Number }],
  total: Number,
  status: { type: String, enum: ['Pending', 'Accepted', 'Declined', 'Expired'], default: 'Pending' },
  expiresAt: Date,
  sentAt: Date,
  viewedAt: Date, // Optional: activity tracking
  number: { type: String, unique: true } // Quotation number, e.g. Q-001
}, { timestamps: true });

export default mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema);
