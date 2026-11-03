/**
 * API Key Authentication Middleware
 * Validates X-API-Key header for webhook endpoints
 */
export const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.LEAD_API_KEY;

  // Log authentication attempt
  console.log('🔐 API KEY AUTHENTICATION CHECK');
  console.log('Time:', new Date().toISOString());
  console.log('IP Address:', req.ip || req.connection.remoteAddress);
  console.log('API Key Provided:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');
  console.log('API Key Expected:', expectedKey ? 'Yes (configured)' : 'No');

  if (!expectedKey) {
    console.error('❌ LEAD_API_KEY not configured in environment');
    return res.status(500).json({ 
      error: 'Server configuration error',
      success: false 
    });
  }

  if (!apiKey) {
    console.log('❌ AUTHENTICATION FAILED: No API key provided');
    console.log('Request Headers:', Object.keys(req.headers).join(', '));
    return res.status(401).json({ 
      error: 'API key required. Please provide X-API-Key header.',
      success: false 
    });
  }

  if (apiKey !== expectedKey) {
    console.log('❌ AUTHENTICATION FAILED: Invalid API key');
    console.log('Key Match:', apiKey === expectedKey ? 'Yes' : 'No');
    return res.status(401).json({ 
      error: 'Invalid API key',
      success: false 
    });
  }

  console.log('✅ AUTHENTICATION SUCCESSFUL');
  next();
};

