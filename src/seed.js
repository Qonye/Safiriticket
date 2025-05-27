import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js'; // Import dotenv to load environment variables

const ADMIN_USERS = [
    {
        username: 'joe',
        password: 'safiri2025', // This should be changed in production
        name: 'Joe Kuniara',
        role: 'superadmin'
    },
    {
        username: 'boniface',
        password: 'boniface2025',
        name: 'Boniface Karanja',
        role: 'user'
    },
    {
        username: 'yousra',
        password: 'yousra2025',
        name: 'Yousra Amin',
        role: 'user'
    },


];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        const mongoUri = 'mongodb+srv://Martin:0LN98uAumci1EwCc@cluster0.e1hy26f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        if (!mongoUri) {
            throw new Error('MONGO_URI environment variable is not set');
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create admin users with hashed passwords
        for (const user of ADMIN_USERS) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await User.create({
                ...user,
                password: hashedPassword
            });
        }

        console.log('Admin users seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
