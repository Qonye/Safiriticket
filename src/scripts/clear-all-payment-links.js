/**
 * Clear All Payment Links Script
 * 
 * This script clears all payment links from invoices
 * Does NOT regenerate Pesapal links (waiting for live keys)
 * 
 * Usage:
 *   node scripts/clear-all-payment-links.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import Invoice from '../models/Invoice.js';

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

async function clearAllPaymentLinks() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find all invoices with payment links
    const invoices = await Invoice.find({
      $or: [
        { paymentLink: { $exists: true, $ne: null } },
        { paymentLinkId: { $exists: true, $ne: null } }
      ]
    });

    console.log(`\n📊 Found ${invoices.length} invoices with payment links\n`);

    if (invoices.length === 0) {
      console.log('✅ No payment links found. Nothing to clear.');
      await mongoose.connection.close();
      return;
    }

    // Show summary
    console.log('Invoices with payment links:');
    invoices.forEach(inv => {
      const linkPreview = inv.paymentLink ? inv.paymentLink.substring(0, 60) : 'No link';
      console.log(`  - ${inv.number || inv._id}: ${linkPreview}...`);
    });
    console.log('');

    // Clear all payment links
    let clearedCount = 0;
    let errors = [];

    for (const invoice of invoices) {
      try {
        // Clear the payment link and payment link ID
        invoice.paymentLink = null;
        invoice.paymentLinkId = null;
        await invoice.save();
        clearedCount++;

        console.log(`✅ Cleared payment link from invoice ${invoice.number || invoice._id}`);
      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice.number || invoice._id}:`, error.message);
        errors.push({ invoice: invoice.number || invoice._id, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Cleared payment links: ${clearedCount}`);
    console.log(`⚠️  Errors: ${errors.length}`);
    console.log('='.repeat(50));

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`  - Invoice ${err.invoice}: ${err.error}`);
      });
    }

    console.log('\n📝 Note: Payment links will be regenerated with Pesapal once live keys are set.');
    console.log('   All invoices are now ready for new Pesapal payment links.');

    await mongoose.connection.close();
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
clearAllPaymentLinks();

