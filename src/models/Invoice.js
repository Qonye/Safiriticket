import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  items: [{ description: String, quantity: Number, price: Number }],
  total: Number,
  status: { type: String, enum: ['Unpaid', 'Paid', 'Overdue'], default: 'Unpaid' },
  dueDate: Date,
  paidAt: Date,
  paymentMethod: String // Optional: for future payment integration
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
