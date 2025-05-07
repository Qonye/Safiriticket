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
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate, requireRole } from './middleware/auth.js';
import User from './models/User.js';

// Optional: If you want to add auth later, import these here
// import bcrypt from 'bcryptjs';
// import { authenticate, requireRole } from './middleware/auth.js';
// import jwt from 'jsonwebtoken';
// import User from './models/User.js';

// Initialize __filename and __dirname before using them
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- Cloudinary config (set your credentials in .env) ---
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://safiritickets.netlify.app',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501'
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
  addresses: [String],
  emails: [String],
  phones: [String],
  vat: String,
  website: String,
  logoUrl: String
}, { collection: 'orgsettings' });

const OrgSettings = mongoose.models.OrgSettings || mongoose.model('OrgSettings', orgSettingsSchema);

// --- Health check route ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// --- Auth Endpoints (public) ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('[AUTH] Login attempt:', username);
  if (!username || !password) {
    console.log('[AUTH] Missing username or password');
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = await User.findOne({ username });
  if (!user) {
    console.log('[AUTH] User not found:', username);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    console.log('[AUTH] Invalid password for:', username);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // --- Fix: Log and show JWT_SECRET value for debugging ---
  if (!process.env.JWT_SECRET) {
    console.log('[AUTH] JWT_SECRET missing. Current value:', process.env.JWT_SECRET);
    return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET missing' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  console.log('[AUTH] Login success:', username);
  res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
});

// Example: Only superadmins can create users
app.post('/api/users', authenticate, requireRole('superadmin'), async (req, res) => {
  const { username, password, role, name, email } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'username, password, and role required' });
  }
  const existing = await User.findOne({ username });
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ username, passwordHash, role, name, email });
  await user.save();
  res.status(201).json({ id: user._id, username: user.username, role: user.role });
});

// --- Protect all other /api routes ---
app.use('/api', (req, res, next) => {
  // Allow /api/login and /api/users (already handled above) to be public or superadmin-only
  if (req.path === '/login' || (req.path === '/users' && req.method === 'POST')) return next();
  return authenticate(req, res, next);
});

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

// --- Multer setup for file uploads ---
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
  if (typeof data.items === 'string') {
    try { data.items = JSON.parse(data.items); } catch { data.items = []; }
  }
  if (req.file) {
    try {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'safiriticket/quotations',
          filename_override: req.file.originalname
        },
        async (error, result) => {
          if (error) {
            return res.status(500).json({ error: 'Failed to upload PDF to Cloudinary', details: error.message });
          }
          data.externalPdfUrl = result.secure_url;
          data.isExternal = true;
          const quotation = new Quotation(data);
          if (!quotation.number) {
            quotation.number = await getNextNumber(Quotation, 'Q-');
          }
          await quotation.save();
          res.status(201).json(quotation);
        }
      );
      uploadStream.end(req.file.buffer);
      return;
    } catch (err) {
      return res.status(500).json({ error: 'Failed to upload PDF to Cloudinary', details: err.message });
    }
  }
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

app.post('/api/invoices', requireRole(['admin', 'superadmin']), async (req, res) => {
  const invoice = new Invoice({
    ...req.body,
    createdBy: req.user._id // Track who created it
  });
  if (!invoice.number) {
    invoice.number = await getNextNumber(Invoice, 'INV-');
  }
  if (typeof invoice.paidAmount !== 'number') invoice.paidAmount = 0;
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
  if (typeof update.paidAmount !== 'undefined') {
    update.paidAmount = Number(update.paidAmount) || 0;
  }
  if (update.status === 'Paid') {
    const invoice = await Invoice.findById(req.params.id);
    if (invoice) {
      if (typeof update.paidAmount === 'undefined' || update.paidAmount < invoice.total) {
        update.paidAmount = invoice.total;
      }
    }
  }
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
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
  const invoices = await Invoice.find();
  let paidRevenue = 0, unpaidRevenue = 0, overdueRevenue = 0;
  let paid = 0, unpaid = 0, overdue = 0;

  invoices.forEach(i => {
    const paidAmt = Number(i.paidAmount || 0);
    const totalAmt = Number(i.total || 0);
    const dueAmt = Math.max(totalAmt - paidAmt, 0);

    if (i.status === 'Paid') paid++;
    else if (i.status === 'Unpaid') unpaid++;
    else if (i.status === 'Overdue') overdue++;

    paidRevenue += paidAmt;
    if (i.status === 'Unpaid' || (i.status === 'Paid' && paidAmt < totalAmt)) unpaidRevenue += dueAmt;
    if (i.status === 'Overdue') overdueRevenue += dueAmt;
  });

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

// Serve vanilla frontend statically
app.use('/vanilla', express.static(path.join(__dirname, '../vanilla-frontend')));

// Serve uploaded PDFs statically
app.use('/uploads/quotations', express.static(path.join(__dirname, '../uploads/quotations')));

// --- MongoDB connection and server start ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

console.log('Loaded MONGO_URI:', typeof MONGO_URI, MONGO_URI ? '[set]' : '[empty]', MONGO_URI && MONGO_URI.length);

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
