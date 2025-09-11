import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import PaymentPreset from '@/models/PaymentPreset';
import { readFileSync } from 'fs';
import { join } from 'path';

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

export async function seedPaymentPresets() {
  try {
    await connectDB();
    
    // Check if presets already exist
    const existingCount = await PaymentPreset.countDocuments();
    if (existingCount > 0) {
      console.log('Payment presets already exist, skipping seed...');
      console.log(`Found ${existingCount} existing presets`);
      return;
    }

    // Read the JSON file
    const jsonPath = join(process.cwd(), '..', 'jungle-dwellers-crm.paymentpresets.json');
    const jsonData = readFileSync(jsonPath, 'utf8');
    const presets = JSON.parse(jsonData);

    console.log(`Found ${presets.length} presets to import`);

    // Transform and insert presets
    const transformedPresets = presets.map((preset: any) => ({
      name: preset.name,
      accountName: preset.accountName,
      accountNumber: preset.accountNumber,
      bankName: preset.bankName,
      swiftCode: preset.swiftCode,
      currency: preset.currency,
      additionalInfo: preset.additionalInfo,
      isDefault: preset.isDefault,
      isActive: preset.isActive
    }));

    // Insert all presets
    await PaymentPreset.insertMany(transformedPresets);
    
    console.log('✅ Payment presets imported successfully');
    console.log(`Imported ${transformedPresets.length} payment presets`);
    
    // Show summary by currency
    const summary = await PaymentPreset.aggregate([
      { $group: { _id: '$currency', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\nPresets by currency:');
    summary.forEach(item => {
      console.log(`- ${item._id}: ${item.count} presets`);
    });

  } catch (error) {
    console.error('Error seeding payment presets:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedPaymentPresets()
    .then(() => {
      console.log('Payment presets seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Payment presets seeding failed:', error);
      process.exit(1);
    });
}
