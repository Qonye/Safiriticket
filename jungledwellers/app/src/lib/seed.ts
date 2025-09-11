// Seed script for Jungle Dwellers CRM
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import Client from '@/models/Client';
import Safari from '@/models/Safari';
import Booking from '@/models/Booking';
import Invoice from '@/models/Invoice';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is not set in .env.local');
  process.exit(1);
}

// TypeScript assertion - we know MONGODB_URI is defined after the check above
const mongoUri: string = MONGODB_URI;

console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Log URI with masked credentials

async function connectDB() {
  try {
    if (mongoose.connections[0].readyState) {
      return;
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function seedData() {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Client.deleteMany({});
    await Safari.deleteMany({});
    await Booking.deleteMany({});
    await Invoice.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@jungledwellers.net',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    console.log('Created admin user');

    // Create comprehensive safari packages
    const safari1 = await Safari.create({
      title: 'Ultimate Maasai Mara Experience',
      description: 'An unforgettable 7-day safari experience in the world-famous Maasai Mara, featuring luxury accommodations, expert guides, and incredible wildlife viewing opportunities.',
      duration: 7,
      minPax: 2,
      maxPax: 8,
      basePrice: 3500,
      currency: 'USD',
      inclusions: [
        {
          category: 'park_fees',
          description: 'All park entry fees and conservation fees',
          pricePerPerson: 80,
          isIncluded: true
        },
        {
          category: 'guides',
          description: 'Professional English-speaking safari guide',
          pricePerPerson: 200,
          isIncluded: true
        },
        {
          category: 'accommodation',
          description: 'Luxury tented camp accommodation (6 nights)',
          pricePerPerson: 450,
          isIncluded: true
        },
        {
          category: 'meals',
          description: 'All meals (breakfast, lunch, dinner)',
          pricePerPerson: 100,
          isIncluded: true
        },
        {
          category: 'activities',
          description: 'Game drives in 4x4 safari vehicles',
          pricePerPerson: 150,
          isIncluded: true
        },
        {
          category: 'transportation',
          description: 'Airport transfers (Nairobi to Maasai Mara)',
          pricePerPerson: 300,
          isIncluded: true
        },
        {
          category: 'activities',
          description: 'Hot air balloon safari (optional)',
          pricePerPerson: 450,
          isIncluded: false
        },
        {
          category: 'activities',
          description: 'Cultural visit to Maasai village',
          pricePerPerson: 50,
          isIncluded: true
        }
      ],
      exclusions: [
        {
          description: 'International flights to/from Kenya',
          reason: 'Not included in package price'
        },
        {
          description: 'Visa fees and travel insurance',
          reason: 'Client responsibility'
        },
        {
          description: 'Alcoholic beverages',
          reason: 'Additional cost'
        },
        {
          description: 'Personal expenses and gratuities',
          reason: 'Client responsibility'
        }
      ],
      itinerary: [
        {
          day: 1,
          location: 'Nairobi, Kenya',
          activities: ['Airport pickup', 'City hotel check-in', 'Safari briefing'],
          meals: ['Dinner'],
          accommodation: 'Nairobi city hotel',
          transportation: 'Airport transfer vehicle',
          notes: 'Briefing about your safari adventure'
        },
        {
          day: 2,
          location: 'Maasai Mara National Reserve',
          activities: ['Flight to Maasai Mara', 'Camp check-in', 'Afternoon game drive'],
          meals: ['Breakfast', 'Lunch', 'Dinner'],
          accommodation: 'Luxury tented camp',
          transportation: 'Domestic flight + safari vehicle',
          notes: 'Search for the Big Five'
        },
        {
          day: 3,
          location: 'Maasai Mara National Reserve',
          activities: ['Morning game drive', 'Afternoon game drive', 'Wildlife photography'],
          meals: ['Breakfast', 'Lunch', 'Dinner'],
          accommodation: 'Luxury tented camp',
          transportation: '4x4 safari vehicle',
          notes: 'Spot lions, elephants, cheetahs, and wildebeest migration'
        },
        {
          day: 4,
          location: 'Maasai Mara National Reserve',
          activities: ['Hot air balloon safari (optional)', 'Cultural village visit', 'Game drive'],
          meals: ['Breakfast', 'Lunch', 'Dinner'],
          accommodation: 'Luxury tented camp',
          transportation: '4x4 safari vehicle',
          notes: 'Sunrise balloon safari over Mara plains'
        },
        {
          day: 5,
          location: 'Maasai Mara National Reserve',
          activities: ['River crossing viewing', 'Full day game drives', 'Wildlife migration observation'],
          meals: ['Breakfast', 'Lunch', 'Dinner'],
          accommodation: 'Luxury tented camp',
          transportation: '4x4 safari vehicle',
          notes: 'Witness dramatic wildebeest migration (July-October)'
        },
        {
          day: 6,
          location: 'Maasai Mara National Reserve',
          activities: ['Morning game drive', 'Afternoon game drive', 'Sundowner drinks'],
          meals: ['Breakfast', 'Lunch', 'Dinner'],
          accommodation: 'Luxury tented camp',
          transportation: '4x4 safari vehicle',
          notes: 'Last chance to spot elusive leopards'
        },
        {
          day: 7,
          location: 'Nairobi, Kenya',
          activities: ['Final game drive', 'Flight to Nairobi', 'Airport transfer'],
          meals: ['Breakfast'],
          accommodation: 'None',
          transportation: 'Safari vehicle + domestic flight',
          notes: 'End of safari adventure'
        }
      ],
      tags: ['Maasai Mara', 'Luxury', 'Big Five', 'Migration', 'Kenya'],
      isActive: true,
      isTemplate: false,
      createdBy: adminUser._id
    });

    console.log('Created safari package');

    // Create one test client
    const testClient = await Client.create({
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1-555-0123',
      company: 'Johnson Travel Group',
      address: {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001'
      },
      notes: 'VIP client, prefers luxury accommodations, interested in wildlife photography',
      isActive: true,
      createdBy: adminUser._id
    });

    console.log('Created test client');
    console.log('Seed data created successfully!');
    console.log('\nTest Data Summary:');
    console.log('- Users: 1 (admin)');
    console.log('- Clients: 1 (test client)');
    console.log('- Safari Packages: 1 (comprehensive with all features)');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@jungledwellers.net / admin123');
    console.log('\nYou can now:');
    console.log('1. Create staff users from the admin panel');
    console.log('2. Create bookings from the safari for the test client');
    console.log('3. Generate invoices from bookings');
    console.log('4. Test PDF generation');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seed function
seedData();
