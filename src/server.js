import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import cloudinary from 'cloudinary';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

// Initialize __filename and __dirname before using them
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now you can safely use __dirname for dotenv
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- Cloudinary config (set your credentials in .env) ---
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MongoDB connection
const connectDB = async () => {
    try {
        const mongoUri = 'mongodb+srv://Martin:0LN98uAumci1EwCc@cluster0.e1hy26f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

connectDB();

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://safiritickets.netlify.app',
    'http://127.0.0.1:5000',
    'https://admin.safiritickets.com',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500', // Live server via IP
    'http://localhost:5500',  // Live server via localhost
    'http://localhost:5501',  // Live server default port via localhost
    'http://127.0.0.1:5501', // Live server default port via IP
    'http://localhost:63342', // IntelliJ IDEA built-in server
    'http://127.0.0.1:63342', // IntelliJ IDEA built-in server via IP
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(express.json());

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// --- Models ---
import authRoutes from './routes/auth.js';

// --- Routes ---
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Serve uploaded PDFs statically with proper headers
app.use('/uploads/quotations', (req, res, next) => {
  // Set proper headers for PDF files
  if (req.path.endsWith('.pdf')) {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="quotation.pdf"'
    });
  }
  next();
}, express.static(path.join(__dirname, '../uploads/quotations')));

import Client from './models/Client.js';
import Quotation from './models/Quotation.js';
import Invoice from './models/Invoice.js';
import Service from './models/Service.js';
import Expense from './models/Expense.js';
import Income from './models/Income.js';

// --- Organization Settings Model ---
const orgSettingsSchema = new mongoose.Schema({
  name: String,
  addresses: [String], // now supports multiple addresses
  emails: [String],    // now supports multiple emails
  phones: [String],    // now supports multiple phones
  vat: String,
  website: String,
  logoUrl: String
}, { collection: 'orgsettings' });

const OrgSettings = mongoose.models.OrgSettings || mongoose.model('OrgSettings', orgSettingsSchema);

// --- Health check route ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// --- Test PDF serving endpoint ---
app.get('/api/test-pdf/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../uploads/quotations', filename);
    
    console.log('Testing PDF access for:', filename);
    console.log('Full path:', filepath);
    
    // Check if file exists
    const fs = await import('fs');
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        error: 'File not found',
        path: filepath,
        exists: false
      });
    }
    
    // Get file stats
    const stats = fs.statSync(filepath);
    
    res.json({
      filename,
      path: filepath,
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      downloadUrl: `/uploads/quotations/${filename}`
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
});

// --- User Endpoints ---

// Login (no longer needed, but left for reference)
// app.post('/api/login', ...)

// --- Initial Superadmin Creation (run once if no users) ---
// app.post('/api/setup-superadmin', ...)

// Helper to get next sequential number for quotations/invoices
async function getNextNumber(model, prefix) {
  const last = await model.findOne({ number: new RegExp('^' + prefix) }).sort({ createdAt: -1 });
  let next = 8463; // Start invoice numbering from INV-08463
  if (last && last.number) {
    const match = last.number.match(/(\d+)$/);
    if (match) {
      const lastNum = parseInt(match[1], 10);
      next = Math.max(lastNum + 1, 8463); // Ensure we don't go below 8463
    }
  }
  return `${prefix}${String(next).padStart(5, '0')}`;
}

// Exchange rates helper function (you can update these rates as needed)
function getExchangeRates() {
  return {
    'USD': 1.0,    // Base currency
    'KES': 0.0067, // 1 KES = 0.0067 USD (approximately 149 KES = 1 USD as of May 2025)
    'GBP': 1.23,   // 1 GBP = 1.23 USD  
    'EUR': 1.03,   // 1 EUR = 1.03 USD
    'CAD': 0.70,   // 1 CAD = 0.70 USD
    'AUD': 0.62    // 1 AUD = 0.62 USD
  };
}

// Convert amount to USD equivalent
function convertToUSD(amount, fromCurrency) {
  const rates = getExchangeRates();
  const rate = rates[fromCurrency] || 1.0;
  return amount * rate;
}

// --- Multer setup for file uploads ---
// Use memory storage so files are not saved to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// --- Client Routes ---
app.get('/api/clients', async (req, res) => {
  const clients = await Client.find();
  res.json(clients);
});

app.post('/api/clients', async (req, res) => {
  const client = new Client(req.body);
  await client.save();
  res.status(201).json(client);
});

app.get('/api/clients/:id', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

app.put('/api/clients/:id', async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

app.delete('/api/clients/:id', async (req, res) => {
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json({ message: 'Client deleted' });
});

// --- Quotation Routes ---
app.get('/api/quotations', async (req, res) => {
  const { client, status } = req.query;
  const filter = {};
  if (client) filter.client = client;
  if (status) filter.status = status;
  const quotations = await Quotation.find(filter).populate('client');
  res.json(quotations);
});

app.post('/api/quotations', upload.single('pdf'), async (req, res) => {
  let data = req.body;
  // If items is a string (from FormData), parse it
  if (typeof data.items === 'string') {
    try { data.items = JSON.parse(data.items); } catch { data.items = []; }
  }
  
  // If a PDF was uploaded, handle file storage
  if (req.file) {
    try {
      // Check if Cloudinary is configured
      const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                                 process.env.CLOUDINARY_API_KEY && 
                                 process.env.CLOUDINARY_API_SECRET;

      if (hasCloudinaryConfig) {
        // Try Cloudinary upload first
        try {
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.v2.uploader.upload_stream(
              {
                resource_type: 'raw',
                folder: 'safiriticket/quotations',
                public_id: `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`,
                use_filename: true,
                unique_filename: true
              },
              (error, result) => {
                if (error) {
                  console.error('Cloudinary upload error:', error);
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );
            stream.end(req.file.buffer);
          });

          data.externalPdfUrl = uploadResult.secure_url;
          data.isExternal = true;
          data.cloudinaryPublicId = uploadResult.public_id;
          console.log('Successfully uploaded to Cloudinary:', uploadResult.secure_url);
          
        } catch (cloudinaryError) {
          console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
          
          // Fallback to local storage
          const fs = await import('fs');
          const uploadsDir = path.join(__dirname, '../uploads/quotations');
          
          // Ensure uploads directory exists
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Generate unique filename
          const filename = `${Date.now()}_${req.file.originalname}`;
          const filepath = path.join(uploadsDir, filename);
          
          // Save file to local storage
          fs.writeFileSync(filepath, req.file.buffer);
          
          data.externalPdfUrl = `/uploads/quotations/${filename}`;
          data.isExternal = true;
          data.isLocalFile = true;
          console.log('Successfully saved to local storage:', data.externalPdfUrl);
        }
      } else {
        // No Cloudinary config, use local storage directly
        console.log('No Cloudinary configuration found, using local storage');
        
        const fs = await import('fs');
        const uploadsDir = path.join(__dirname, '../uploads/quotations');
        
        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate unique filename
        const filename = `${Date.now()}_${req.file.originalname}`;
        const filepath = path.join(uploadsDir, filename);
        
        // Save file to local storage
        fs.writeFileSync(filepath, req.file.buffer);
        
        data.externalPdfUrl = `/uploads/quotations/${filename}`;
        data.isExternal = true;
        data.isLocalFile = true;
        console.log('Successfully saved to local storage:', data.externalPdfUrl);
      }

      // Save quotation with file URL
      const quotation = new Quotation(data);
      if (!quotation.number) {
        quotation.number = await getNextNumber(Quotation, 'Q-');
      }
      await quotation.save();
      res.status(201).json(quotation);
      return;
      
    } catch (err) {
      console.error('File upload error:', err);
      return res.status(500).json({ 
        error: 'Failed to upload PDF', 
        details: err.message,
        fallback: 'Please check server configuration and try again'
      });
    }
  }
  // ...existing code for non-PDF case...
  const quotation = new Quotation(data);
  if (!quotation.number) {
    quotation.number = await getNextNumber(Quotation, 'Q-');
  }
  await quotation.save();
  res.status(201).json(quotation);
});

app.get('/api/quotations/:id', async (req, res) => {
  const quotation = await Quotation.findById(req.params.id).populate('client');
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  res.json(quotation);
});

app.put('/api/quotations/:id', async (req, res) => {
  const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  res.json(quotation);
});

app.delete('/api/quotations/:id', async (req, res) => {
  const quotation = await Quotation.findByIdAndDelete(req.params.id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  res.json({ message: 'Quotation deleted' });
});

// --- Quotation Status Transitions ---
app.post('/api/quotations/:id/accept', async (req, res) => {
  const quotation = await Quotation.findByIdAndUpdate(req.params.id, { status: 'Accepted' }, { new: true });
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  // Optionally: create invoice here
  res.json(quotation);
});

app.post('/api/quotations/:id/decline', async (req, res) => {
  const quotation = await Quotation.findByIdAndUpdate(req.params.id, { status: 'Declined' }, { new: true });
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  res.json(quotation);
});

// --- Mark Invoice as Paid ---
app.post('/api/invoices/:id/mark-paid', async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status: 'Paid', paidAt: new Date() },
    { new: true }
  );
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

// --- Expire Quotations Automatically (cron job stub) ---
// In production, use node-cron or similar to run this daily
app.post('/api/quotations/expire', async (req, res) => {
  const now = new Date();
  const result = await Quotation.updateMany(
    { status: 'Pending', expiresAt: { $lt: now } },
    { status: 'Expired' }
  );
  res.json({ expired: result.nModified || result.modifiedCount });
});

// --- Invoice Routes ---
app.get('/api/invoices', async (req, res) => {
  const { client, status } = req.query;
  const filter = {};
  if (client) filter.client = client;
  if (status) filter.status = status;
  const invoices = await Invoice.find(filter).populate('client').populate('quotation');
  res.json(invoices);
});

app.post('/api/invoices', async (req, res) => {
  const invoice = new Invoice(req.body);
  if (!invoice.number) {
    invoice.number = await getNextNumber(Invoice, 'INV-');
  }
  // Ensure paidAmount is set to 0 if not provided
  if (typeof invoice.paidAmount !== 'number') invoice.paidAmount = 0;
  // If status is Paid and paidAmount is not set, set paidAmount = total
  if (invoice.status === 'Paid' && (!invoice.paidAmount || invoice.paidAmount < invoice.total)) {
    invoice.paidAmount = invoice.total;
  }
  await invoice.save();
  res.status(201).json(invoice);
});

app.get('/api/invoices/:id', async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('client').populate('quotation');
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

app.put('/api/invoices/:id', async (req, res) => {
  const update = { ...req.body };
  // Always update paidAmount if provided
  if (typeof update.paidAmount !== 'undefined') {
    update.paidAmount = Number(update.paidAmount) || 0;
  }
  // Always update status and paidAmount together if status is Paid
  if (update.status === 'Paid') {
    // Always fetch the invoice to get the total
    const invoice = await Invoice.findById(req.params.id);
    if (invoice) {
      // If paidAmount is not provided or less than total, set to total
      if (typeof update.paidAmount === 'undefined' || update.paidAmount < invoice.total) {
        update.paidAmount = invoice.total;
      }
    }
  }
  // Always return the updated invoice with the correct paidAmount
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  // Force save to ensure Mongoose hooks run (if any)
  await invoice.save();
  res.json(invoice);
});

app.delete('/api/invoices/:id', async (req, res) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ message: 'Invoice deleted' });
});

app.get('/api/invoices/:id/expenses', async (req, res) => {
  const expenses = await Expense.find({ invoice: req.params.id });
  res.json(expenses);
});

// --- Financials Summary Endpoint ---
app.get('/api/financials', async (req, res) => {
  // Fetch all invoices with up-to-date paidAmount and total
  const invoices = await Invoice.find();

  // Calculate revenue breakdowns from actual invoice data
  let paidRevenue = 0, unpaidRevenue = 0, overdueRevenue = 0;
  let paid = 0, unpaid = 0, overdue = 0;
  
  // Track currency-specific data
  const currencyData = {};

  invoices.forEach(i => {
    const paidAmt = Number(i.paidAmount || 0);
    const totalAmt = Number(i.total || 0);
    const dueAmt = Math.max(totalAmt - paidAmt, 0);
    const currency = i.currency || 'USD';

    // Convert amounts to USD for aggregation
    const paidAmtUSD = convertToUSD(paidAmt, currency);
    const dueAmtUSD = convertToUSD(dueAmt, currency);

    // Initialize currency data if not already done
    if (!currencyData[currency]) {
      currencyData[currency] = {
        paidRevenue: 0,
        unpaidRevenue: 0, 
        overdueRevenue: 0,
        paid: 0,
        unpaid: 0,
        overdue: 0,
        totalInvoices: 0
      };
    }
    
    // Count by status (both overall and per currency)
    if (i.status === 'Paid') {
      paid++;
      currencyData[currency].paid++;
    } else if (i.status === 'Unpaid') {
      unpaid++;
      currencyData[currency].unpaid++;
    } else if (i.status === 'Overdue') {
      overdue++;
      currencyData[currency].overdue++;
    }
    
    // Increment total invoice count per currency
    currencyData[currency].totalInvoices++;

    // Revenue analysis - overall in USD equivalents
    paidRevenue += paidAmtUSD;
    if (i.status === 'Unpaid' || (i.status === 'Paid' && paidAmt < totalAmt)) unpaidRevenue += dueAmtUSD;
    if (i.status === 'Overdue') overdueRevenue += dueAmtUSD;
    
    // Currency-specific revenue analysis (in original currency)
    currencyData[currency].paidRevenue += paidAmt;
    if (i.status === 'Unpaid' || (i.status === 'Paid' && paidAmt < totalAmt)) {
      currencyData[currency].unpaidRevenue += dueAmt;
    }
    if (i.status === 'Overdue') {
      currencyData[currency].overdueRevenue += dueAmt;
    }
  });

  // Total revenue is sum of all paid amounts (partial or full) in USD
  const revenue = paidRevenue;
  res.json({
    paid,
    unpaid,
    overdue,
    revenue,
    totalInvoices: invoices.length,
    paidRevenue,
    unpaidRevenue,
    overdueRevenue,
    currencyData, // Add the currency-specific breakdown
    exchangeRates: getExchangeRates(), // Include current exchange rates
    note: 'Overall revenue figures are converted to USD equivalents using current exchange rates'
  });
});

// --- Exchange Rates Endpoint ---
app.get('/api/exchange-rates', async (req, res) => {
  const rates = getExchangeRates();
  res.json({
    rates,
    baseCurrency: 'USD',
    lastUpdated: new Date().toISOString(),
    note: 'Exchange rates are approximate and for internal aggregation purposes only'
  });
});

// --- Organization Settings Endpoints ---
app.get('/api/orgsettings', async (req, res) => {
  const settings = await OrgSettings.findOne();
  res.json(settings || {});
});

app.put('/api/orgsettings', async (req, res) => {
  let settings = await OrgSettings.findOne();
  if (!settings) {
    settings = new OrgSettings(req.body);
  } else {
    Object.assign(settings, req.body);
  }
  await settings.save();
  res.json(settings);
});

// --- Service (Product) CRUD API ---
app.get('/api/products', async (req, res) => {
  const services = await Service.find({ active: true });
  res.json(services);
});

app.post('/api/products', async (req, res) => {
  const service = new Service(req.body);
  await service.save();
  res.status(201).json(service);
});

app.get('/api/products/:id', async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
});

app.put('/api/products/:id', async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
});

app.delete('/api/products/:id', async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json({ message: 'Service deleted (soft)' });
});

// --- Expense Routes ---
app.get('/api/expenses', async (req, res) => {
  const expenses = await Expense.find();
  res.json(expenses);
});

app.post('/api/expenses', async (req, res) => {
  const expense = new Expense(req.body);
  await expense.save();
  res.status(201).json(expense);
});

app.put('/api/expenses/:id', async (req, res) => {
  const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
});

app.delete('/api/expenses/:id', async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json({ success: true });
});

// --- Income Routes ---
app.get('/api/income', async (req, res) => {
  const income = await Income.find();
  res.json(income);
});

app.post('/api/income', async (req, res) => {
  const income = new Income(req.body);
  await income.save();
  res.status(201).json(income);
});

app.put('/api/income/:id', async (req, res) => {
  const income = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!income) return res.status(404).json({ error: 'Income not found' });
  res.json(income);
});

app.delete('/api/income/:id', async (req, res) => {
  const income = await Income.findByIdAndDelete(req.params.id);
  if (!income) return res.status(404).json({ error: 'Income not found' });
  res.json({ success: true });
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
