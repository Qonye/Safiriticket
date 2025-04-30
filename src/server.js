import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize __filename and __dirname before using them
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now you can safely use __dirname for dotenv
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500' // <-- add this for your live server
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- Models ---
import Client from './models/Client.js';
import Quotation from './models/Quotation.js';
import Invoice from './models/Invoice.js';
import Service from './models/Service.js';

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

// --- Admin Authentication Middleware ---
function adminAuth(req, res, next) {
  // TODO: Implement real authentication (e.g., JWT, session)
  // For now, allow all requests
  next();
}

// Apply to all admin routes
app.use('/api', adminAuth);

// Helper to get next sequential number for quotations/invoices
async function getNextNumber(model, prefix) {
  const last = await model.findOne({ number: new RegExp('^' + prefix) }).sort({ createdAt: -1 });
  let next = 1;
  if (last && last.number) {
    const match = last.number.match(/(\d+)$/);
    if (match) next = parseInt(match[1], 10) + 1;
  }
  return `${prefix}${String(next).padStart(3, '0')}`;
}

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
  const quotations = await Quotation.find().populate('client');
  res.json(quotations);
});

app.post('/api/quotations', async (req, res) => {
  const quotation = new Quotation(req.body);
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
  const invoices = await Invoice.find().populate('client').populate('quotation');
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

// --- Financials Summary Endpoint ---
app.get('/api/financials', async (req, res) => {
  // Fetch all invoices with up-to-date paidAmount and total
  const invoices = await Invoice.find();

  // Calculate revenue breakdowns from actual invoice data
  let paidRevenue = 0, unpaidRevenue = 0, overdueRevenue = 0;
  let paid = 0, unpaid = 0, overdue = 0;

  invoices.forEach(i => {
    const paidAmt = Number(i.paidAmount || 0);
    const totalAmt = Number(i.total || 0);
    const dueAmt = Math.max(totalAmt - paidAmt, 0);

    // Count by status
    if (i.status === 'Paid') paid++;
    else if (i.status === 'Unpaid') unpaid++;
    else if (i.status === 'Overdue') overdue++;

    // Revenue analysis (partial payments included)
    paidRevenue += paidAmt;
    if (i.status === 'Unpaid') unpaidRevenue += dueAmt;
    if (i.status === 'Overdue') overdueRevenue += dueAmt;
  });

  // Total revenue is sum of all paid amounts (partial or full)
  const revenue = paidRevenue;

  res.json({
    paid,
    unpaid,
    overdue,
    revenue,
    totalInvoices: invoices.length,
    paidRevenue,
    unpaidRevenue,
    overdueRevenue
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

// Serve vanilla frontend statically (add this before app.listen)
app.use('/vanilla', express.static(path.join(__dirname, '../vanilla-frontend')));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Debug log to verify .env loading
console.log('Loaded MONGO_URI:', typeof MONGO_URI, MONGO_URI ? '[set]' : '[empty]', MONGO_URI && MONGO_URI.length);

// Check for missing MONGO_URI and throw a clear error
if (!MONGO_URI || typeof MONGO_URI !== 'string' || !MONGO_URI.trim()) {
  console.error('ERROR: MONGO_URI is not set or is invalid. Please check your .env file and restart the server.');
  process.exit(1);
} else {
  console.log('MONGO_URI loaded and appears valid.');
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected.');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
