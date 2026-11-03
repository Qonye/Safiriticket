/**
 * Pesapal API 3.0 Service
 * 
 * This service handles integration with Pesapal for payment links and webhook processing
 * Uses Pesapal REST API 3.0
 */
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import axios from 'axios';

// Environment variables
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || 'qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW';
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || 'osGQ364R49cXKeOYSpaOnT++rHs=';
const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL || 'http://cybqa.pesapal.com/pesapalv3';
const PESAPAL_IPN_URL = process.env.PESAPAL_IPN_URL || 'https://your-backend.com/api/payments/pesapal-webhook';
const PESAPAL_CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL || 'https://admin.safiritickets.com/payment-success';

// Token cache
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get access token from Pesapal
 * Implements token caching to avoid unnecessary API calls
 * 
 * @returns {Promise<string>} - The Bearer token
 */
async function getAccessToken() {
  try {
    // Check if we have a valid cached token
    if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
      return cachedToken;
    }

    const isProduction = PESAPAL_BASE_URL.includes('pay.pesapal.com');
    const tokenUrl = `${PESAPAL_BASE_URL}/api/Auth/RequestToken`;

    // Enhanced logging for production debugging
    console.log('================================================================================');
    console.log(`🔄 Requesting Pesapal Access Token (${isProduction ? 'PRODUCTION' : 'SANDBOX'})`);
    console.log(`📍 URL: ${tokenUrl}`);
    console.log(`🔑 Consumer Key: ${PESAPAL_CONSUMER_KEY.substring(0, 10)}...`);
    console.log(`🌐 Base URL: ${PESAPAL_BASE_URL}`);
    console.log('================================================================================');

    const startTime = Date.now();
    const response = await axios.post(
      tokenUrl,
      {
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'SafiriTickets-CRM/1.0'
        },
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500 // Don't throw on 4xx, only 5xx
      }
    );

    const duration = Date.now() - startTime;
    console.log(`⏱️  Request completed in ${duration}ms`);

    if (response.status >= 400) {
      console.error(`❌ Pesapal API returned status ${response.status}`);
      console.error('Response:', JSON.stringify(response.data, null, 2));
      throw new Error(`Pesapal API error: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    if (!response.data || !response.data.token) {
      console.error('❌ Invalid token response from Pesapal');
      console.error('Response:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid token response from Pesapal');
    }

    // Cache the token
    cachedToken = response.data.token;
    // Set expiry to 5 minutes before actual expiry (safety margin)
    const expiryDate = new Date(response.data.expiryDate);
    tokenExpiry = new Date(expiryDate.getTime() - 5 * 60 * 1000);

    console.log('✅ Pesapal token obtained successfully');
    console.log(`📅 Token expires at: ${expiryDate.toISOString()}`);
    console.log('================================================================================');
    return cachedToken;
  } catch (error) {
    const isProduction = PESAPAL_BASE_URL.includes('pay.pesapal.com');
    
    // Detailed error logging
    console.error('================================================================================');
    console.error('❌ ERROR GETTING PESAPAL ACCESS TOKEN');
    console.error('================================================================================');
    console.error(`Environment: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
    console.error(`URL: ${PESAPAL_BASE_URL}/api/Auth/RequestToken`);
    console.error(`Error Code: ${error.code || 'N/A'}`);
    console.error(`HTTP Status: ${error.response?.status || 'N/A'}`);
    console.error(`Error Message: ${error.message}`);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('⚠️  Request made but NO RESPONSE received');
      console.error('This usually indicates:');
      console.error('  1. Network connectivity issue');
      console.error('  2. Firewall blocking the connection');
      console.error('  3. IP address not whitelisted (common in production)');
      console.error('  4. Pesapal server is down or unreachable');
      console.error('Request Config:', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      });
    }
    
    if (isProduction && (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.response?.status === 522)) {
      console.error('');
      console.error('🚨 PRODUCTION-SPECIFIC ISSUES TO CHECK:');
      console.error('  1. Is your Railway server IP whitelisted in Pesapal?');
      console.error('  2. Is your Pesapal production account activated?');
      console.error('  3. Are you using the correct production credentials?');
      console.error('  4. Contact Pesapal support: pesapalv2.zohodesk.com');
      console.error('');
    }
    
    console.error('Stack Trace:', error.stack);
    console.error('================================================================================');

    // Provide helpful error messages
    let errorMessage = 'Failed to get Pesapal access token';
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.response?.status === 522) {
      if (isProduction) {
        errorMessage = 'Connection timeout to Pesapal production API. This may indicate: (1) IP whitelisting required, (2) Account not activated, or (3) Network/firewall issues. Contact Pesapal support.';
      } else {
        errorMessage = 'Connection timeout to Pesapal API. Please try again later.';
      }
    } else if (error.response?.status === 502) {
      errorMessage = 'Pesapal API returned Bad Gateway (502). The server may be temporarily unavailable.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed. Please verify your Pesapal consumer key and secret are correct.';
    } else if (error.response?.status) {
      errorMessage = `Pesapal API error (${error.response.status}): ${JSON.stringify(error.response.data)}`;
    } else {
      errorMessage = error.message || 'Unknown error';
    }

    throw new Error(errorMessage);
  }
}

/**
 * Register IPN URL with Pesapal
 * This should be called once during setup
 * 
 * @param {string} ipnUrl - The IPN URL to register
 * @param {string} notificationType - 'GET' or 'POST'
 * @returns {Promise<string>} - The IPN ID
 */
export async function registerIPN(ipnUrl = PESAPAL_IPN_URL, notificationType = 'GET') {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,
      {
        url: ipnUrl,
        ipn_notification_type: notificationType
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.ipn_id) {
      throw new Error('Invalid IPN registration response');
    }

    console.log('IPN registered successfully:', response.data.ipn_id);
    return response.data.ipn_id;
  } catch (error) {
    console.error('Error registering IPN:', error.response?.data || error.message);
    throw new Error(`Failed to register IPN: ${error.message}`);
  }
}

/**
 * Get or register IPN ID
 * Checks if IPN is already registered, otherwise registers it
 * 
 * @returns {Promise<string>} - The IPN ID
 */
let cachedIPNId = null;
async function getIPNId() {
  if (cachedIPNId) {
    return cachedIPNId;
  }

  // Try to get from environment variable first
  if (process.env.PESAPAL_IPN_ID) {
    cachedIPNId = process.env.PESAPAL_IPN_ID;
    return cachedIPNId;
  }

  // Otherwise register it
  cachedIPNId = await registerIPN();
  return cachedIPNId;
}

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

    // Get access token and IPN ID
    const token = await getAccessToken();
    const ipnId = await getIPNId();

    // Prepare billing address from client data
    const billingAddress = {
      email_address: client.email || 'customer@example.com',
      phone_number: client.phone || '254712345678',
      country_code: 'KE',
      first_name: (client.name || 'Customer').split(' ')[0] || 'Customer',
      last_name: (client.name || '').split(' ').slice(1).join(' ') || '',
      line_1: client.address || 'Nairobi',
      city: 'Nairobi',
      middle_name: '',
      state: '',
      postal_code: '',
      zip_code: ''
    };

    // Create order request
    const orderData = {
      id: `invoice_${invoice._id.toString()}`,
      currency: invoice.currency || 'KES',
      amount: dueAmount,
      description: `Payment for Invoice ${invoice.number || invoice._id}`,
      callback_url: PESAPAL_CALLBACK_URL,
      notification_id: ipnId,
      billing_address: billingAddress
    };

    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.redirect_url) {
      console.error('Pesapal API Error:', response.data);
      throw new Error('Failed to generate payment link');
    }

    // Create payment record in database
    const payment = new Payment({
      invoice: invoice._id,
      amount: dueAmount,
      currency: invoice.currency || 'KES',
      status: 'PENDING',
      paymentMethod: 'PESAPAL',
      metadata: {
        order_tracking_id: response.data.order_tracking_id,
        merchant_reference: response.data.merchant_reference,
        payment_link: response.data.redirect_url,
        response_data: response.data,
        api_ref: `invoice_${invoice._id.toString()}`
      }
    });

    await payment.save();

    return {
      success: true,
      paymentLink: response.data.redirect_url,
      paymentLinkId: response.data.order_tracking_id,
      paymentId: payment._id,
      message: 'Payment link generated successfully'
    };
  } catch (error) {
    console.error('Error generating payment link:', error.response?.data || error.message);
    return {
      success: false,
      message: error.message || 'Failed to generate payment link'
    };
  }
}

/**
 * Get transaction status from Pesapal
 * 
 * @param {string} orderTrackingId - The Pesapal order tracking ID
 * @returns {Promise<Object>} - Transaction status
 */
export async function getTransactionStatus(orderTrackingId) {
  try {
    const token = await getAccessToken();

    const response = await axios.get(
      `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error getting transaction status:', error.response?.data || error.message);
    return {
      success: false,
      message: error.message || 'Failed to get transaction status'
    };
  }
}

/**
 * Process webhook data from Pesapal
 * Pesapal sends IPN notifications via GET or POST
 * 
 * @param {Object} queryParams - Query parameters from GET request
 * @param {Object} body - Body from POST request (if any)
 * @returns {Promise<Object>} - Processing result
 */
export async function processWebhook(queryParams, body = {}) {
  try {
    // Pesapal sends IPN via GET with query params or POST with body
    const orderTrackingId = queryParams.OrderTrackingId || body.OrderTrackingId;
    const merchantReference = queryParams.OrderMerchantReference || body.OrderMerchantReference;
    const notificationType = queryParams.OrderNotificationType || body.OrderNotificationType;

    console.log('Processing Pesapal webhook:', {
      orderTrackingId,
      merchantReference,
      notificationType
    });

    if (!orderTrackingId) {
      throw new Error('Missing OrderTrackingId in Pesapal webhook');
    }

    // Always verify by calling GetTransactionStatus
    const statusResult = await getTransactionStatus(orderTrackingId);
    if (!statusResult.success) {
      throw new Error('Failed to verify transaction status');
    }

    const transactionData = statusResult.data;

    // Extract invoice ID from merchant reference (format: invoice_<id>)
    const invoiceId = merchantReference?.replace('invoice_', '') || null;

    if (!invoiceId) {
      throw new Error(`Invalid merchant reference: ${merchantReference}`);
    }

    // Find the payment by order tracking ID or invoice
    let payment = await Payment.findOne({
      $or: [
        { 'metadata.order_tracking_id': orderTrackingId },
        { 'metadata.merchant_reference': merchantReference },
        { invoice: invoiceId }
      ]
    });

    // If payment not found, create a new one
    if (!payment) {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      payment = new Payment({
        invoice: invoiceId,
        amount: transactionData.amount || 0,
        currency: transactionData.currency || 'KES',
        status: 'PENDING',
        paymentMethod: 'PESAPAL',
        metadata: {
          order_tracking_id: orderTrackingId,
          merchant_reference: merchantReference,
          webhook_data: { queryParams, body, transactionData }
        }
      });
    }

    // Update payment status based on Pesapal status code
    // Status codes: 0 = Invalid, 1 = Completed, 2 = Failed, 3 = Reversed
    const statusCode = transactionData.status_code || transactionData.payment_status_code;
    const statusMap = {
      '0': 'FAILED',
      '1': 'COMPLETED',
      '2': 'FAILED',
      '3': 'CANCELLED'
    };
    payment.status = statusMap[statusCode] || 'PENDING';

    // Update payment details
    payment.transactionId = transactionData.confirmation_code || orderTrackingId;
    payment.paymentDate = transactionData.created_date ? new Date(transactionData.created_date) : new Date();
    payment.metadata = {
      ...payment.metadata,
      webhook: { queryParams, body },
      transaction_data: transactionData,
      last_updated: new Date().toISOString()
    };

    // Update payment method based on transaction data
    if (transactionData.payment_method) {
      const methodMap = {
        'Card': 'CARD',
        'M-Pesa': 'MPESA',
        'Airtel Money': 'MPESA',
        'Bank Transfer': 'BANK_TRANSFER'
      };
      payment.paymentMethod = methodMap[transactionData.payment_method] || 'PESAPAL';
    }

    await payment.save();

    // If payment is completed, update the invoice
    if (payment.status === 'COMPLETED') {
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
      invoiceId: payment.invoice,
      status: payment.status
    };
  } catch (error) {
    console.error('Error processing Pesapal webhook:', error);
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

    // Use the same generatePaymentLink function
    // It will create a new payment record with updated amount
    return await generatePaymentLink(invoice, client);
  } catch (error) {
    console.error('Error regenerating payment link:', error);
    return {
      success: false,
      message: error.message || 'Failed to regenerate payment link'
    };
  }
}

/**
 * Verify Pesapal webhook (basic validation)
 * In production, you should verify the webhook by calling GetTransactionStatus
 * 
 * @param {Object} queryParams - Query parameters
 * @param {Object} body - Request body
 * @returns {boolean} - Whether webhook appears valid
 */
export function verifyWebhookSignature(queryParams, body) {
  // Pesapal doesn't use signature verification
  // Instead, we verify by calling GetTransactionStatus
  // This function just checks if required params exist
  const orderTrackingId = queryParams?.OrderTrackingId || body?.OrderTrackingId;
  return !!orderTrackingId;
}

