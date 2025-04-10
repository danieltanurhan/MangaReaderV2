// BASE URL IS HARDCODED IN

// Example proxy server code fix
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Configure CORS properly
app.use(cors({
  origin: ['http://localhost:8081', 'https://your-production-url.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'kavita-api-key'],
}));

app.use(express.json());

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {
  res.sendStatus(200);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API proxy endpoint
app.post('/api-proxy', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { target, method, body, params } = req.body;
    

    if (!target) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Extract auth from request headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization if provided
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }
    
    // Build the query string in the backend
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    console.log('Query string:', queryString);

    // Create the URL with base endpoint and query string
    const url = `https://ftgglin3.leda.usbx.me/kavita/api/${target}${queryString}`;
    
    // Log the constructed URL in development mode
    if (true) {
      console.log('Making request to:', url);
      console.log('With headers:', headers);
      console.log('With method:', method || 'POST');
      if (method !== 'GET') {
        console.log('With body:', body);
      }
    }

    if (target.includes('/image/') || target.includes('/cover/')) {
      // Set the response type to arraybuffer for binary data
      const response = await axios({
        method: 'GET',
        url: url,
        headers: headers,
        responseType: 'arraybuffer'  // Important for binary data
      });
      
      // Set the content-type from the original response
      res.set('Content-Type', response.headers['content-type']);
      // Send the raw binary data
      return res.send(response.data);
    }
    
    // Make the request to the actual API
    let response;
    if (method === 'GET') {
      response = await axios({
        method: 'GET',
        url: url,
        headers: headers
      });
    } else {
      response = await axios({
        method: method || 'POST',
        url: url,
        headers: headers,
        data: body
      });
    }
    
    // Return the API response to the client
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    // Provide more helpful error information
    const status = error.response?.status || 500;
    const errorData = {
      message: error.message,
      details: error.response?.data || 'No additional details available'
    };
    
    // Log the full error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error:', error);
      console.error('Request failed with URL:', error.config?.url);
      console.error('Request headers:', error.config?.headers);
      console.error('Request data:', error.config?.data);
    }
    
    return res.status(status).json(errorData);
  }
});

const PORT = process.env.PORT || 3031;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});