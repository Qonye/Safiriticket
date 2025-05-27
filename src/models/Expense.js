import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachmentUrl: { type: String },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' } // Optional: link expense to an invoice
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
