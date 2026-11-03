import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import User from './models/User.js'; // Import dotenv to load environment variables

const ADMIN_USERS = [
    {
        username: 'joe',
        name: 'Joe Kuniara',
        role: 'superadmin'
    },
    {
        username: 'boniface',
        name: 'Boniface Karanja',
        role: 'user'
    },
    {
        username: 'yousra',
        name: 'Yousra Amin',
        role: 'user'
    },{
        username: 'Abigail',
        name: 'Abigail Muindi',
        role: 'user'
    },


];

// Passwords come from SEED_USER_PASSWORD, or are generated and printed once at the end.
const printed = [];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI environment variable is not set (run with: node --env-file=.env src/seed.js)');
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create admin users with hashed passwords
        for (const user of ADMIN_USERS) {
            const plain = process.env.SEED_USER_PASSWORD || crypto.randomBytes(9).toString('base64url');
            printed.push(`${user.username}: ${plain}`);
            const hashedPassword = await bcrypt.hash(plain, 10);
            await User.create({
                ...user,
                password: hashedPassword
            });
        }

        console.log('Admin users seeded successfully');
        if (!process.env.SEED_USER_PASSWORD) {
            console.log('Generated passwords (shown once, save them now):');
            console.log(printed.join('\n'));
        }
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
