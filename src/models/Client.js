import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  company: String,
  phone: String,
  address: String
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);
