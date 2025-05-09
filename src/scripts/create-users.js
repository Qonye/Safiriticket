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
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

const users = [
  {
    username: 'boniface',
    password: 'boniface2025',
    name: 'Boniface Karanja',
    email: 'boniface@safiritickets.com',
    role: 'user'
  },
  {
    username: 'yousra',
    password: 'yousra2025',
    name: 'Yousra Yasmin',
    email: 'yousra@safiritickets.com',
    role: 'user'
  }
];

async function createUsers() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  for (const u of users) {
    const existing = await User.findOne({ username: u.username });
    if (existing) {
      console.log(`User ${u.username} already exists.`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = new User({
      username: u.username,
      password: passwordHash,
      name: u.name,
      email: u.email,
      role: u.role
    });
    await user.save();
    console.log(`User ${u.username} created successfully!`);
  }
  mongoose.disconnect();
}

createUsers().catch(err => {
  console.error('Error creating users:', err);
  process.exit(1);
});
