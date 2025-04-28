import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  items: [{ description: String, quantity: Number, price: Number }],
  total: Number,
  status: { type: String, enum: ['Pending', 'Accepted', 'Declined', 'Expired'], default: 'Pending' },
  expiresAt: Date,
  sentAt: Date,
  viewedAt: Date // Optional: activity tracking
}, { timestamps: true });

export default mongoose.model('Quotation', quotationSchema);
