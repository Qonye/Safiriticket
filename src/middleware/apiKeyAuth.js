/**
 * API Key Authentication Middleware
 * Validates X-API-Key header for webhook endpoints
 */
export const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.LEAD_API_KEY;

  if (!expectedKey) {
    console.error('LEAD_API_KEY not configured in environment');
    return res.status(500).json({ 
      error: 'Server configuration error',
      success: false 
    });
  }

  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required. Please provide X-API-Key header.',
      success: false 
    });
  }

  if (apiKey !== expectedKey) {
    return res.status(401).json({ 
      error: 'Invalid API key',
      success: false 
    });
  }

  next();
};

