import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';
import pdf from 'html-pdf';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

// --- Models ---
import Client from './models/Client.js';
import Quotation from './models/Quotation.js';
import Invoice from './models/Invoice.js';

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

const CACHE_DIR = path.join(process.cwd(), 'cache', 'quotations');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// --- PDF Generation for Quotation (use org settings + cache) ---
app.post('/api/quotations/:id/pdf', async (req, res) => {
  const { id } = req.params;
  const cacheFile = path.join(CACHE_DIR, `${id}.pdf`);

  // serve from cache if exists
  if (fs.existsSync(cacheFile)) {
    return res.sendFile(cacheFile);
  }

  // otherwise generate
  const quotation = await Quotation.findById(id).populate('client');
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

  // Load org settings
  const org = await OrgSettings.findOne();

  // Use absolute path for template (works in dev and production)
  const templatePath = path.join(process.cwd(), 'src', 'templates', 'quotation.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Prepare items HTML
  const itemsHtml = quotation.items.map(item =>
    `<tr>
      <td>${item.description}</td>
      <td>${item.quantity}</td>
      <td>₹${item.price}</td>
      <td>₹${Number(item.quantity) * Number(item.price)}</td>
    </tr>`
  ).join('');

  // Prepare org details HTML
  const phones = (org?.phones || []).join(' | ');
  const emails = (org?.emails || []).join(' | ');
  const addresses = (org?.addresses || []).join(' | ');

  // Replace placeholders
  html = html
    .replace('{{logoUrl}}', org?.logoUrl || '')
    .replace('{{orgName}}', org?.name || '')
    .replace('{{orgAddresses}}', addresses)
    .replace('{{orgEmails}}', emails)
    .replace('{{orgPhones}}', phones)
    .replace('{{orgVat}}', org?.vat || '')
    .replace('{{orgWebsite}}', org?.website || '')
    .replace('{{clientName}}', quotation.client.name)
    .replace('{{clientEmail}}', quotation.client.email)
    .replace('{{status}}', quotation.status)
    .replace('{{expiresAt}}', quotation.expiresAt ? new Date(quotation.expiresAt).toLocaleDateString() : '')
    .replace('{{items}}', itemsHtml)
    .replace('{{total}}', quotation.total);

  pdf.create(html, {
    format: 'A4',
    orientation: 'portrait',
    border: '10mm',
    height: '297mm'    // enforce single-page height
  }).toBuffer((err, buffer) => {
    if (err) return res.status(500).json({ error: 'PDF generation failed' });
    // write cache
    fs.writeFileSync(cacheFile, buffer);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=quotation.pdf');
    res.end(buffer);
  });
});

// --- PDF Generation for Invoice ---
app.post('/api/invoices/:id/pdf', async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('client').populate('quotation');
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const html = `
    <h1>Invoice</h1>
    <p>Client: ${invoice.client.name} (${invoice.client.email})</p>
    <ul>
      ${invoice.items.map(item => `<li>${item.description}: ${item.quantity} x ₹${item.price}</li>`).join('')}
    </ul>
    <p>Total: ₹${invoice.total}</p>
    <p>Status: ${invoice.status}</p>
    <p>Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : ''}</p>
  `;

  pdf.create(html).toBuffer((err, buffer) => {
    if (err) return res.status(500).json({ error: 'PDF generation failed' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    res.send(buffer);
  });
});

// --- Email Sending for Quotation ---
app.post('/api/quotations/:id/email', async (req, res) => {
  const quotation = await Quotation.findById(req.params.id).populate('client');
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

  const html = `
    <h1>Quotation</h1>
    <p>Client: ${quotation.client.name} (${quotation.client.email})</p>
    <ul>
      ${quotation.items.map(item => `<li>${item.description}: ${item.quantity} x ₹${item.price}</li>`).join('')}
    </ul>
    <p>Total: ₹${quotation.total}</p>
    <p>Status: ${quotation.status}</p>
    <p>Expires At: ${quotation.expiresAt ? new Date(quotation.expiresAt).toLocaleDateString() : ''}</p>
  `;

  pdf.create(html).toBuffer(async (err, buffer) => {
    if (err) return res.status(500).json({ error: 'PDF generation failed' });

    // Configure your SMTP transport
    const transporter = nodemailer.createTransport({
      // Example for Gmail, replace with your SMTP config
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: quotation.client.email,
      subject: 'Your Quotation',
      text: 'Please find your quotation attached.',
      attachments: [
        { filename: 'quotation.pdf', content: buffer }
      ]
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: 'Quotation email sent' });
    } catch (e) {
      res.status(500).json({ error: 'Email sending failed', details: e.message });
    }
  });
});

// --- Email Sending for Invoice ---
app.post('/api/invoices/:id/email', async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('client').populate('quotation');
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const html = `
    <h1>Invoice</h1>
    <p>Client: ${invoice.client.name} (${invoice.client.email})</p>
    <ul>
      ${invoice.items.map(item => `<li>${item.description}: ${item.quantity} x ₹${item.price}</li>`).join('')}
    </ul>
    <p>Total: ₹${invoice.total}</p>
    <p>Status: ${invoice.status}</p>
    <p>Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : ''}</p>
  `;

  pdf.create(html).toBuffer(async (err, buffer) => {
    if (err) return res.status(500).json({ error: 'PDF generation failed' });

    // Configure your SMTP transport
    const transporter = nodemailer.createTransport({
      // Example for Gmail, replace with your SMTP config
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: invoice.client.email,
      subject: 'Your Invoice',
      text: 'Please find your invoice attached.',
      attachments: [
        { filename: 'invoice.pdf', content: buffer }
      ]
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: 'Invoice email sent' });
    } catch (e) {
      res.status(500).json({ error: 'Email sending failed', details: e.message });
    }
  });
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

// --- Reminder Endpoints (basic implementation) ---
app.post('/api/quotations/:id/reminder', async (req, res) => {
  // For demo, just call the email endpoint
  req.url = `/api/quotations/${req.params.id}/email`;
  app.handle(req, res);
});

app.post('/api/invoices/:id/reminder', async (req, res) => {
  // For demo, just call the email endpoint
  req.url = `/api/invoices/${req.params.id}/email`;
  app.handle(req, res);
});

// --- Invoice Routes ---
app.get('/api/invoices', async (req, res) => {
  const invoices = await Invoice.find().populate('client').populate('quotation');
  res.json(invoices);
});

app.post('/api/invoices', async (req, res) => {
  const invoice = new Invoice(req.body);
  await invoice.save();
  res.status(201).json(invoice);
});

app.get('/api/invoices/:id', async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('client').populate('quotation');
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

app.put('/api/invoices/:id', async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
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
  const paid = invoices.filter(i => i.status === 'Paid');
  const unpaid = invoices.filter(i => i.status === 'Unpaid');
  const overdue = invoices.filter(i => i.status === 'Overdue');
  const revenue = paid.reduce((sum, i) => sum + (i.total || 0), 0);
  res.json({
    paid: paid.length,
    unpaid: unpaid.length,
    overdue: overdue.length,
    revenue,
    totalInvoices: invoices.length
  });
});

// --- Preview Endpoints ---
app.post('/api/preview/quotation', async (req, res) => {
  const { client, items, total, status, expiresAt } = req.body;

  // Always fetch org settings from DB for up-to-date info
  const orgSettings = await OrgSettings.findOne();

  // Use correct template path
  let templatePath = path.join(process.cwd(), 'src', 'templates', 'quotation.html');
  let html;
  try {
    html = fs.readFileSync(templatePath, 'utf8');
  } catch (e) {
    try {
      html = fs.readFileSync(path.join(process.cwd(), 'templates', 'quotation.html'), 'utf8');
    } catch (e2) {
      return res.status(500).json({ error: 'Template not found', details: e2.message });
    }
  }

  // Prepare items HTML (ensure all fields are filled)
  const itemsHtml = (items || []).map(item =>
    `<tr>
      <td>${item.description || ''}</td>
      <td>${item.quantity || ''}</td>
      <td>₹${item.price || ''}</td>
      <td>₹${item.quantity && item.price ? Number(item.quantity) * Number(item.price) : ''}</td>
    </tr>`
  ).join('');

  // Prepare org details HTML
  const phones = (orgSettings?.phones || []).filter(Boolean).join(' | ');
  const emails = (orgSettings?.emails || []).filter(Boolean).join(' | ');
  const addresses = (orgSettings?.addresses || []).filter(Boolean).join(' | ');

  // Replace all placeholders globally
  html = html.replace(/{{logoUrl}}/g, orgSettings?.logoUrl || '')
    .replace(/{{orgName}}/g, orgSettings?.name || '')
    .replace(/{{orgAddresses}}/g, addresses)
    .replace(/{{orgEmails}}/g, emails)
    .replace(/{{orgPhones}}/g, phones)
    .replace(/{{orgVat}}/g, orgSettings?.vat || '')
    .replace(/{{orgWebsite}}/g, orgSettings?.website || '')
    .replace(/{{clientName}}/g, client?.name || '')
    .replace(/{{clientEmail}}/g, client?.email || '')
    .replace(/{{status}}/g, status || '')
    .replace(/{{expiresAt}}/g, expiresAt ? new Date(expiresAt).toLocaleDateString() : '')
    .replace(/{{items}}/g, itemsHtml)
    .replace(/{{total}}/g, total || '');

  pdf.create(html, { format: 'A4', orientation: 'portrait', border: '10mm' }).toBuffer((err, buffer) => {
    if (err || !buffer) {
      return res.status(500).json({ error: 'PDF generation failed' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=quotation-preview.pdf');
    res.end(buffer);
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

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/safiriticket';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log(`MongoDB connected at ${MONGO_URI}`);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
