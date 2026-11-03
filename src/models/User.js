import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String, // hashed
  name: String,
  role: { 
    type: String, 
    enum: ['superadmin', 'systemsadmin', 'admin', 'marketing', 'receptionist', 'accounting', 'user'], 
    default: 'user' 
  }
});

export default mongoose.model('User', userSchema);
