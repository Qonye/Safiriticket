import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import User from '../models/User.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function createSuperAdmin() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const username = 'superadmin';
  const password = 'safiri2025'; // CHANGE THIS before running!
  const name = 'Super Admin';
  const email = 'joe@safiritickets.com';

  const existing = await User.findOne({ username });
  if (existing) {
    console.log('Super admin already exists.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    passwordHash,
    role: 'superadmin',
    name,
    email
  });

  await user.save();
  console.log('Super admin created successfully!');
  mongoose.disconnect();
}

createSuperAdmin().catch(err => {
  console.error('Error creating super admin:', err);
  process.exit(1);
});
