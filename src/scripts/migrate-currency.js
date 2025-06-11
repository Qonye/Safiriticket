// Migration script to set currency field for all invoices and quotations that don't have it
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize __filename and __dirname 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import models
import Invoice from '../models/Invoice.js';
import Quotation from '../models/Quotation.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safiriticket')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function migrateCurrency() {
  console.log('Starting currency migration...');
  
  try {
    // Update all invoices that have no currency field
    const invoiceResult = await Invoice.updateMany(
      { currency: { $exists: false } },
      { $set: { currency: 'USD' } }
    );
    
    console.log(`Updated ${invoiceResult.modifiedCount} invoices to set currency to USD`);
    
    // Update all quotations that have no currency field
    const quotationResult = await Quotation.updateMany(
      { currency: { $exists: false } },
      { $set: { currency: 'USD' } }
    );
    
    console.log(`Updated ${quotationResult.modifiedCount} quotations to set currency to USD`);
    
    // Add payment details to invoices that don't have them
    const paymentDetails = {
      accountName: 'JUNGLE DWELLERS LTD',
      accountNumber: '0254001002',
      bankName: 'DIAMOND TRUST BANK',
      swiftCode: 'DTKEKENA',
      currency: 'USD',
      additionalInfo: '(Please use your name or invoice number as payment reference)'
    };
    
    const paymentDetailsResult = await Invoice.updateMany(
      { paymentDetails: { $exists: false } },
      { $set: { paymentDetails: paymentDetails } }
    );
    
    console.log(`Updated ${paymentDetailsResult.modifiedCount} invoices to add default payment details`);
    
    console.log('Currency migration completed successfully!');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Execute the migration
migrateCurrency();
