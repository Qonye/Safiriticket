import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  items: [{
    description: String,
    quantity: Number,
    price: Number,
    serviceFee: { type: Number, default: 0 },
    // Allow any additional dynamic fields (hotelName, checkin, checkout, airline, etc.)
  }],
  total: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Unpaid', 'Paid', 'Overdue'], default: 'Unpaid' },
  dueDate: Date,
  paidAt: Date,
  createdAt: { type: Date, default: Date.now },
  number: { type: String, unique: true }
}, { timestamps: true, strict: false });

export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
