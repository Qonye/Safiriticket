import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  company: String,
  phone: String,
  address: String,
  // Optional: activity tracking
  lastContacted: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);
