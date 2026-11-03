import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import { processWebhook, verifyWebhookSignature } from '../services/pesapal.js';

const router = express.Router();

/**
 * Get payments for a specific invoice
 */
router.get('/invoice/:invoiceId', async (req, res) => {
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
 * Pesapal webhook endpoint (IPN)
 * This endpoint receives payment notifications from Pesapal
 * Supports both GET and POST methods
 */
router.get('/pesapal-webhook', async (req, res) => {
  try {
    // Pesapal sends IPN via GET with query parameters
    const queryParams = req.query;
    
    // Basic validation
    if (!verifyWebhookSignature(queryParams, {})) {
      return res.status(400).json({ error: 'Invalid webhook parameters' });
    }
    
    // Process the webhook data
    const result = await processWebhook(queryParams, {});
    
    if (!result.success) {
      console.error('Webhook processing error:', result.message);
      // Return 200 even on error to prevent Pesapal from retrying
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
    // Return 200 even on error to prevent Pesapal from retrying
    res.status(200).json({ 
      status: 'error',
      message: 'Internal server error'
    });
  }
});

router.post('/pesapal-webhook', async (req, res) => {
  try {
    // Pesapal can also send IPN via POST
    const queryParams = req.query;
    const body = req.body;
    
    // Basic validation
    if (!verifyWebhookSignature(queryParams, body)) {
      return res.status(400).json({ error: 'Invalid webhook parameters' });
    }
    
    // Process the webhook data
    const result = await processWebhook(queryParams, body);
    
    if (!result.success) {
      console.error('Webhook processing error:', result.message);
      // Return 200 even on error to prevent Pesapal from retrying
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
    // Return 200 even on error to prevent Pesapal from retrying
    res.status(200).json({ 
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * Legacy webhook endpoint (redirects to Pesapal webhook)
 * @deprecated Use /pesapal-webhook instead
 * Kept for backward compatibility with old webhook URLs
 */
router.post('/webhook', async (req, res) => {
  try {
    const queryParams = req.query;
    const body = req.body;
    
    // Redirect Pesapal webhooks to the correct endpoint
    if (queryParams.OrderTrackingId || body.OrderTrackingId) {
      return res.redirect(307, '/api/payments/pesapal-webhook');
    }
    
    // Unknown webhook format
    res.status(200).json({ 
      status: 'error',
      message: 'Please use /pesapal-webhook endpoint'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ 
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * Diagnostic endpoint to test Pesapal connection
 * Helps debug production connection issues
 */
router.get('/pesapal-diagnostic', authenticate, async (req, res) => {
  try {
    const { getAccessToken } = await import('../services/pesapal.js');
    
    // Get server IP (if available)
    const serverIP = req.headers['x-forwarded-for'] || req.ip || 'Unknown';
    
    // Get environment info
    const baseUrl = process.env.PESAPAL_BASE_URL || 'Not set';
    const consumerKey = process.env.PESAPAL_CONSUMER_KEY ? 
      `${process.env.PESAPAL_CONSUMER_KEY.substring(0, 10)}...` : 'Not set';
    const isProduction = baseUrl.includes('pay.pesapal.com');
    
    // Try to get access token
    let tokenResult = { success: false, error: null };
    try {
      const token = await getAccessToken();
      tokenResult = { success: true, token: token.substring(0, 20) + '...' };
    } catch (error) {
      tokenResult = { 
        success: false, 
        error: error.message,
        code: error.code,
        status: error.response?.status
      };
    }
    
    res.json({
      diagnostic: {
        timestamp: new Date().toISOString(),
        environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
        serverIP: serverIP,
        configuration: {
          baseUrl: baseUrl,
          consumerKey: consumerKey,
          hasConsumerSecret: !!process.env.PESAPAL_CONSUMER_SECRET
        },
        connectionTest: tokenResult,
        recommendations: isProduction && !tokenResult.success ? [
          '1. Verify your Railway server IP is whitelisted in Pesapal',
          '2. Confirm your production account is activated',
          '3. Check that production credentials are correct',
          '4. Try using HTTPS URL: https://pay.pesapal.com/v3',
          '5. Contact Pesapal support: pesapalv2.zohodesk.com'
        ] : []
      }
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ 
      error: 'Diagnostic failed', 
      message: error.message 
    });
  }
});

/**
 * Delete a payment and reset invoice status
 * Useful for removing test payments
 */
router.delete('/:paymentId', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const invoice = await Invoice.findById(payment.invoice);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Associated invoice not found' });
    }
    
    // Subtract payment amount from invoice's paidAmount
    invoice.paidAmount = Math.max((invoice.paidAmount || 0) - payment.amount, 0);
    
    // Update invoice status based on new paidAmount
    if (invoice.paidAmount >= invoice.total) {
      invoice.status = 'Paid';
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'Partially Paid';
    } else {
      invoice.status = 'Unpaid';
      invoice.paidAt = undefined; // Remove paid date if fully unpaid
    }
    
    await invoice.save();
    
    // Delete the payment
    await Payment.findByIdAndDelete(req.params.paymentId);
    
    res.json({
      success: true,
      message: 'Payment removed successfully',
      invoice: {
        id: invoice._id,
        number: invoice.number,
        status: invoice.status,
        paidAmount: invoice.paidAmount,
        total: invoice.total
      }
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

export default router;
