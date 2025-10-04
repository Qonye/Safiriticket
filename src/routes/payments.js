import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import { processWebhook, verifyWebhookSignature } from '../services/intasend.js';

const router = express.Router();

/**
 * Get payments for a specific invoice
 */
router.get('/invoice/:invoiceId', authenticate, async (req, res) => {
  try {
    const payments = await Payment.find({ invoice: req.params.invoiceId })
      .populate('updatedBy', 'username name')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching invoice payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments for this invoice' });
  }
});

/**
 * Create a manual payment record
 */
router.post('/manual', authenticate, async (req, res) => {
  try {
    const { invoiceId, amount, currency, paymentMethod, transactionId, paymentDate, notes } = req.body;
    
    if (!invoiceId || !amount) {
      return res.status(400).json({ error: 'Invoice ID and amount are required' });
    }
    
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Create payment record
    const payment = new Payment({
      invoice: invoiceId,
      amount: Number(amount),
      currency: currency || invoice.currency || 'USD',
      status: 'COMPLETED',
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      transactionId,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes,
      updatedBy: req.user._id
    });
    
    await payment.save();
    
    // Update invoice paid amount and status
    invoice.paidAmount = (invoice.paidAmount || 0) + Number(amount);
    
    if (invoice.paidAmount >= invoice.total) {
      invoice.status = 'Paid';
      invoice.paidAt = new Date();
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'Partially Paid';
    }
    
    await invoice.save();
    
    res.status(201).json({
      success: true,
      payment,
      invoice: {
        id: invoice._id,
        number: invoice.number,
        status: invoice.status,
        paidAmount: invoice.paidAmount,
        total: invoice.total
      }
    });
  } catch (error) {
    console.error('Error creating manual payment:', error);
    res.status(500).json({ error: 'Failed to create payment record' });
  }
});

/**
 * IntaSend webhook endpoint
 * This endpoint receives payment notifications from IntaSend
 */
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    
    // Verify webhook signature (if IntaSend provides this)
    if (!verifyWebhookSignature(req.headers, payload)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    // Process the webhook data
    const result = await processWebhook(payload);
    
    if (!result.success) {
      console.error('Webhook processing error:', result.message);
      // Return 200 even on error to prevent IntaSend from retrying
      return res.status(200).json({ 
        status: 'error',
        message: result.message
      });
    }
    
    res.json({
      status: 'success',
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    // Return 200 even on error to prevent IntaSend from retrying
    res.status(200).json({ 
      status: 'error',
      message: 'Internal server error'
    });
  }
});

export default router;
