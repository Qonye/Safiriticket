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
  currency: { type: String, default: 'USD', enum: ['USD', 'EUR', 'GBP', 'KES', 'CAD', 'AUD'] },
  paymentDetails: {
    accountName: { type: String, default: 'JUNGLE DWELLERS LTD' },
    accountNumber: { type: String, default: '0254001002' },
    bankName: { type: String, default: 'DIAMOND TRUST BANK' },
    swiftCode: { type: String, default: 'DTKEKENA' },
    currency: { type: String, default: 'USD' },
    additionalInfo: { type: String, default: '(Please use your name or invoice number as payment reference)' }
  },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Unpaid', 'Paid', 'Overdue'], default: 'Unpaid' },
  dueDate: Date,
  paidAt: Date,
  createdAt: { type: Date, default: Date.now },
  number: { type: String, unique: true }
}, { timestamps: true, strict: false });

export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
