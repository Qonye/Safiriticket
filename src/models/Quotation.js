import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  items: [{
    description: String,
    quantity: Number,
    price: Number,
    serviceFee: { type: Number, default: 0 },
    // Allow any additional dynamic fields (hotelName, checkin, checkout, airline, etc.)
  }],
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD', enum: ['USD', 'EUR', 'GBP', 'KES', 'CAD', 'AUD'] },
  status: { type: String, enum: ['Pending', 'Accepted', 'Declined', 'Expired'], default: 'Pending' },
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
  number: { type: String, unique: true },
  externalPdfUrl: { type: String }, // stores Cloudinary PDF URL
  isExternal: { type: Boolean, default: false } // Optional: mark if has external PDF
}, { timestamps: true, strict: false });

export default mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema);
