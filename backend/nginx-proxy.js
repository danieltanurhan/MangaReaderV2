/**
 * Simple proxy server for Kavita API requests
 * Avoids CORS issues when accessing Kavita API from web browsers
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3031;

// Setup middleware with more permissive CORS for development
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:19006', 'exp://localhost:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Support larger response bodies for image data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint for proxy availability check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main proxy endpoint
app.post('/api-proxy', async (req, res) => {
  try {
    // Extract request details from body
    const { target, method, body, kavitaApiKey } = req.body;
    
    if (!target) {
      return res.status(400).json({ error: 'Missing required parameter: target' });
    }

    console.log(`[PROXY] ${method} ${target}`);

    // Get auth token from request headers or use provided API key
    let authHeader = req.headers.authorization;
    if (!authHeader && kavitaApiKey) {
      authHeader = `Bearer ${kavitaApiKey}`;
    }

    // Build headers for the Kavita API request
    const headers = {
      'Content-Type': 'application/json'
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Build the full URL for the Kavita API request
    // Make sure this points to your Kavita server
    const kavitaApiUrl = process.env.KAVITA_API_URL || 'https://ftgglin3.leda.usbx.me/kavita/api';
    const url = `${kavitaApiUrl}/${target}`;

    // Make the request to the Kavita API
    const fetchOptions = {
      method: method || 'GET',
      headers: headers,
    };

    // Add body for non-GET requests
    if (method !== 'GET' && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Forward the request
    const response = await fetch(url, fetchOptions);
    
    // Handle binary responses (like images)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('image')) {
      const buffer = await response.buffer();
      
      // Set appropriate headers
      res.set('Content-Type', contentType);
      res.set('Content-Length', buffer.length);
      
      // Send the binary data
      return res.send(buffer);
    }
    
    // Handle JSON responses
    const data = await response.json().catch(() => ({}));
    
    // Forward response status and data
    res.status(response.status).json(data);
  }
  catch (error) {
    console.error('[PROXY ERROR]', error);
    res.status(500).json({
      error: 'Proxy server error',
      details: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🔄 Proxy server running on http://localhost:${PORT}`);
  console.log(`🛡️  Ready to handle requests from web clients`);
});