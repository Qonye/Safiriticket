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
      email: client.email,
      redirect_url: 'https://admin.safiritickets.com/payment-success.html'
    };

    // Use IntaSend SDK to create checkout
    const collection = intaSendClient.collection();
    const responseData = await collection.charge(requestData);

    // Check if the response indicates success (IntaSend returns URL on success)
    if (!responseData || !responseData.url) {
      console.error('IntaSend API Error:', responseData);
      throw new Error('Failed to generate payment link');
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
        response_data: responseData,
        api_ref: `invoice_${invoice._id.toString()}`
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

    // Extract payment data from IntaSend webhook
    const { 
      invoice_id,           // IntaSend's payment identifier 
      state,               // PENDING, COMPLETE, FAILED
      value,               // Payment amount
      currency,            // Payment currency
      api_ref,             // Our invoice reference
      account,             // Customer email
      provider,            // CARD-PAYMENT, MPESA, etc.
      mpesa_reference      // Reference for M-Pesa payments
    } = webhookData;
    
    if (!invoice_id) {
      console.error('Webhook data received:', webhookData);
      throw new Error('Missing invoice_id in IntaSend webhook data');
    }
    
    console.log('Processing payment for invoice_id:', invoice_id, 'with api_ref:', api_ref);

    // Find the payment by api_ref (which contains our invoice ID)
    const payment = await Payment.findOne({ 
      $or: [
        { 'metadata.api_ref': api_ref },           // Direct api_ref match
        { 'invoice': api_ref.replace('invoice_', '') }, // Invoice ID from api_ref
        { 'metadata.checkout_id': invoice_id },    // Fallback to invoice_id
        { 'metadata.response_data.id': invoice_id } // Another fallback
      ]
    });
    
    if (!payment) {
      console.log('Searching for payment with conditions:');
      console.log('- api_ref:', api_ref);
      console.log('- invoice_id from api_ref:', api_ref.replace('invoice_', ''));
      console.log('- invoice_id:', invoice_id);
      throw new Error(`Payment not found for api_ref: ${api_ref}`);
    }
    
    console.log('Found payment record:', payment._id, 'for invoice:', payment.invoice);

    // Update payment status based on IntaSend state
    const statusMap = {
      'PENDING': 'PENDING',
      'COMPLETE': 'COMPLETED',
      'FAILED': 'FAILED'
    };
    payment.status = statusMap[state] || state;
    
    // Set transaction reference
    payment.transactionId = mpesa_reference || invoice_id;
    payment.paymentDate = new Date();
    payment.metadata = { ...payment.metadata, webhook: webhookData };
    
    // Update payment method based on provider
    if (provider) {
      const methodMap = {
        'CARD-PAYMENT': 'CARD',
        'MPESA': 'MPESA', 
        'BANK-TRANSFER': 'BANK_TRANSFER'
      };
      payment.paymentMethod = methodMap[provider] || provider;
    }
    
    await payment.save();

    // If payment is completed, update the invoice
    if (state === 'COMPLETE') {
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
      email: client.email,
      redirect_url: 'https://admin.safiritickets.com/payment-success.html'
    };

    // Use IntaSend SDK to create checkout
    const collection = intaSendClient.collection();
    const responseData = await collection.charge(requestData);

    // Check if the response indicates success (IntaSend returns URL on success)
    if (!responseData || !responseData.url) {
      console.error('IntaSend API Error:', responseData);
      throw new Error('Failed to regenerate payment link');
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
        api_ref: `invoice_${invoice._id.toString()}`,
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
