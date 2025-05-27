import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String, // hashed
  name: String,
  role: { type: String, enum: ['superadmin', 'user'], default: 'user' }
});

export default mongoose.model('User', userSchema);
