/**
 * Clear IntaSend Payment Links Script
 * 
 * This script clears all IntaSend payment links from invoices
 * Optionally regenerates them as Pesapal links
 * 
 * Usage:
 *   node scripts/clear-intasend-links.js [--regenerate]
 * 
 * Options:
 *   --regenerate  Also regenerate payment links using Pesapal
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import { generatePaymentLink } from '../services/pesapal.js';

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Check for regenerate flag
const shouldRegenerate = process.argv.includes('--regenerate');

async function clearIntaSendLinks() {
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
      paymentLink: { $exists: true, $ne: null }
    }).populate('client');

    console.log(`\n📊 Found ${invoices.length} invoices with payment links`);

    // Identify IntaSend links (they typically contain "intasend" in the URL)
    const intaSendPatterns = [
      /intasend/i,
      /intasend\.com/i,
      /intasend\.io/i
    ];

    const intaSendInvoices = invoices.filter(invoice => {
      if (!invoice.paymentLink) return false;
      return intaSendPatterns.some(pattern => pattern.test(invoice.paymentLink));
    });

    console.log(`🔍 Found ${intaSendInvoices.length} invoices with IntaSend payment links\n`);

    if (intaSendInvoices.length === 0) {
      console.log('✅ No IntaSend links found. Nothing to clear.');
      await mongoose.connection.close();
      return;
    }

    // Show summary
    console.log('Invoices with IntaSend links:');
    intaSendInvoices.forEach(inv => {
      console.log(`  - ${inv.number || inv._id}: ${inv.paymentLink?.substring(0, 50)}...`);
    });
    console.log('');

    // Clear IntaSend links
    let clearedCount = 0;
    let regeneratedCount = 0;
    let errors = [];

    for (const invoice of intaSendInvoices) {
      try {
        // Clear the payment link
        invoice.paymentLink = null;
        invoice.paymentLinkId = null;
        await invoice.save();
        clearedCount++;

        console.log(`✅ Cleared IntaSend link from invoice ${invoice.number || invoice._id}`);

        // Regenerate with Pesapal if requested
        if (shouldRegenerate && invoice.status !== 'Paid' && invoice.client) {
          try {
            const client = await Client.findById(invoice.client);
            if (client) {
              const result = await generatePaymentLink(invoice, client);
              if (result.success) {
                invoice.paymentLink = result.paymentLink;
                invoice.paymentLinkId = result.paymentLinkId;
                await invoice.save();
                regeneratedCount++;
                console.log(`  ✅ Regenerated Pesapal link for invoice ${invoice.number || invoice._id}`);
              } else {
                console.log(`  ⚠️  Failed to regenerate link: ${result.message}`);
                errors.push({ invoice: invoice.number || invoice._id, error: result.message });
              }
            }
          } catch (regenerateError) {
            console.error(`  ❌ Error regenerating link: ${regenerateError.message}`);
            errors.push({ invoice: invoice.number || invoice._id, error: regenerateError.message });
          }
        }
      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice.number || invoice._id}:`, error.message);
        errors.push({ invoice: invoice.number || invoice._id, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Cleared IntaSend links: ${clearedCount}`);
    if (shouldRegenerate) {
      console.log(`✅ Regenerated Pesapal links: ${regeneratedCount}`);
      console.log(`⚠️  Failed to regenerate: ${errors.length}`);
    }
    console.log('='.repeat(50));

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`  - Invoice ${err.invoice}: ${err.error}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
clearIntaSendLinks();

