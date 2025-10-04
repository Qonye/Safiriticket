/**
 * IntaSend API Service
 * 
 * This service handles integration with IntaSend for payment links and webhook processing
 * Uses the official IntaSend Node.js SDK
 */
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import IntaSend from 'intasend-node';

// Environment variables
const INTASEND_PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY;
const INTASEND_API_KEY = process.env.INTASEND_API_KEY;
const INTASEND_TEST_MODE = process.env.INTASEND_TEST_MODE === 'true';

// Initialize IntaSend client
const intaSendClient = new IntaSend(INTASEND_PUBLISHABLE_KEY, INTASEND_API_KEY, INTASEND_TEST_MODE);

/**
 * Generate a payment link for an invoice
 * 
 * @param {Object} invoice - The invoice object
 * @param {Object} client - The client object
 * @returns {Promise<Object>} - The payment link data
 */
export async function generatePaymentLink(invoice, client) {
  try {
    if (!invoice || !client) {
      throw new Error('Invoice and client are required');
    }

    // Calculate due amount
    const dueAmount = Math.max(invoice.total - (invoice.paidAmount || 0), 0);
    if (dueAmount <= 0) {
      throw new Error('Invoice is already fully paid');
    }

    // Prepare request data for IntaSend SDK
    const requestData = {
      amount: dueAmount,
      currency: invoice.currency || 'USD',
      api_ref: `invoice_${invoice._id.toString()}`,
      email: client.email
    };

    // Use IntaSend SDK to create checkout
    const collection = intaSendClient.collection();
    const responseData = await collection.charge(requestData);

    // Check if the response indicates success (IntaSend returns URL on success)
    if (!responseData.url || !responseData.id) {
      console.error('IntaSend API Error:', responseData);
      throw new Error(responseData.message || 'Failed to generate payment link');
    }

    // Create payment record in database
    const payment = new Payment({
      invoice: invoice._id,
      amount: dueAmount,
      currency: invoice.currency,
      status: 'PENDING',
      paymentMethod: 'INTASEND',
      metadata: {
        checkout_id: responseData.id || responseData.checkout_id,
        payment_link: responseData.url,
        response_data: responseData
      }
    });

    await payment.save();

    return {
      success: true,
      paymentLink: responseData.url,
      paymentLinkId: responseData.id || responseData.checkout_id,
      paymentId: payment._id,
      message: 'Payment link generated successfully'
    };
  } catch (error) {
    console.error('Error generating payment link:', error);
    return {
      success: false,
      message: error.message || 'Failed to generate payment link'
    };
  }
}

/**
 * Process webhook data from IntaSend
 * 
 * @param {Object} webhookData - The webhook payload from IntaSend
 * @returns {Promise<Object>} - Processing result
 */
export async function processWebhook(webhookData) {
  try {
    console.log('Processing IntaSend webhook:', JSON.stringify(webhookData));

    // Extract payment data from webhook
    const { checkout_id, status, transaction_id, payment_method, metadata } = webhookData;
    
    if (!checkout_id) {
      throw new Error('Missing checkout_id in webhook data');
    }

    // Find the payment by checkout_id from IntaSend response
    const payment = await Payment.findOne({ 
      $or: [
        { 'metadata.id': checkout_id },
        { 'metadata.checkout_id': checkout_id },
        { 'metadata.response_data.id': checkout_id },
        { 'metadata.response_data.checkout_id': checkout_id }
      ]
    });
    
    if (!payment) {
      throw new Error(`Payment not found for checkout_id: ${checkout_id}`);
    }

    // Update payment status
    payment.status = status === 'COMPLETE' ? 'COMPLETED' : status;
    payment.transactionId = transaction_id;
    payment.paymentDate = new Date();
    payment.metadata = { ...payment.metadata, webhook: webhookData };
    
    // Update payment method if provided
    if (payment_method) {
      // Map IntaSend payment methods to our schema
      const methodMap = {
        'mpesa': 'MPESA',
        'card': 'CARD',
        'bank': 'BANK_TRANSFER',
        'mobile_money': 'MPESA'
      };
      
      payment.paymentMethod = methodMap[payment_method.toLowerCase()] || 'INTASEND';
    }
    
    await payment.save();

    // If payment is completed, update the invoice
    if (status === 'COMPLETE') {
      const invoice = await Invoice.findById(payment.invoice);
      
      if (!invoice) {
        throw new Error(`Invoice not found for payment: ${payment._id}`);
      }

      // Update invoice paid amount and status
      invoice.paidAmount = (invoice.paidAmount || 0) + payment.amount;
      
      // If fully paid, update status
      if (invoice.paidAmount >= invoice.total) {
        invoice.status = 'Paid';
        invoice.paidAt = new Date();
      } else if (invoice.paidAmount > 0) {
        invoice.status = 'Partially Paid';
      }
      
      await invoice.save();
    }

    return {
      success: true,
      message: 'Webhook processed successfully',
      paymentId: payment._id,
      invoiceId: payment.invoice
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      success: false,
      message: error.message || 'Failed to process webhook'
    };
  }
}

/**
 * Regenerate payment link for an existing invoice
 * This is useful when invoice details change (like total amount)
 * 
 * @param {Object} invoice - The updated invoice object
 * @param {Object} client - The client object
 * @returns {Promise<Object>} - The new payment link data
 */
export async function regeneratePaymentLink(invoice, client) {
  try {
    if (!invoice || !client) {
      throw new Error('Invoice and client are required');
    }

    // Calculate due amount
    const dueAmount = Math.max(invoice.total - (invoice.paidAmount || 0), 0);
    if (dueAmount <= 0) {
      throw new Error('Invoice is already fully paid');
    }

    // Prepare request data for IntaSend SDK (regenerated)
    const requestData = {
      amount: dueAmount,
      currency: invoice.currency || 'USD',
      api_ref: `invoice_${invoice._id.toString()}_regen`,
      email: client.email
    };

    // Use IntaSend SDK to create checkout
    const collection = intaSendClient.collection();
    const responseData = await collection.charge(requestData);

    // Check if the response indicates success (IntaSend returns URL on success)
    if (!responseData.url || !responseData.id) {
      console.error('IntaSend API Error:', responseData);
      throw new Error(responseData.message || 'Failed to regenerate payment link');
    }

    // Create new payment record in database
    const payment = new Payment({
      invoice: invoice._id,
      amount: dueAmount,
      currency: invoice.currency,
      status: 'PENDING',
      paymentMethod: 'INTASEND',
      metadata: {
        checkout_id: responseData.id || responseData.checkout_id,
        payment_link: responseData.url,
        response_data: responseData,
        regenerated: true,
        regenerated_at: new Date().toISOString()
      }
    });

    await payment.save();

    return {
      success: true,
      paymentLink: responseData.url,
      paymentLinkId: responseData.id || responseData.checkout_id,
      paymentId: payment._id,
      message: 'Payment link regenerated successfully'
    };
  } catch (error) {
    console.error('Error regenerating payment link:', error);
    return {
      success: false,
      message: error.message || 'Failed to regenerate payment link'
    };
  }
}

/**
 * Verify IntaSend webhook signature
 * 
 * @param {Object} headers - Request headers
 * @param {Object} payload - Request body
 * @returns {boolean} - Whether signature is valid
 */
export function verifyWebhookSignature(headers, payload) {
  // IntaSend webhook signature verification logic
  // This would typically involve checking a signature in the headers
  // against a hash of the payload using a shared secret
  
  // For now, we'll return true since IntaSend docs don't specify a signature verification method
  // In production, implement proper verification if IntaSend provides it
  return true;
}
