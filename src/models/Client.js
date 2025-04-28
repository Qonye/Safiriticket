import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  company: String,
  phone: String,
  address: String,
  // Optional: activity tracking
  lastContacted: Date
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);
