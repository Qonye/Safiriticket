import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
  name: String,
  email: String
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
