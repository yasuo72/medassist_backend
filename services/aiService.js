const axios = require('axios');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

// Rate limiting for AI service
const aiLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests to AI service, please try again later.'
  }
});

// Request validation schema
const validateRequest = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request data');
  }
  
  if (!data.user_id) {
    throw new Error('User ID is required');
  }
  
  if (!data.image_data) {
    throw new Error('Image data is required');
  }
  
  if (data.image_data.length > 5000000) { // 5MB limit
    throw new Error('Image data too large');
  }
};

const analyzeData = async (data) => {
  try {
    // Validate request
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }

    // Handle different actions
    if (data.action === 'verify') {
      // Face verification specific validation
      if (!data.image_data) {
        throw new Error('Image data is required for face verification');
      }
      
      if (data.image_data.length > 5000000) { // 5MB limit
        throw new Error('Image data too large');
      }

      // Call face verification endpoint
      const response = await axios.post(
        `${FLASK_API_URL}/api/verify_face`,
        data,
        {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`Face verification failed: ${response.status}`);
      }

      return response.data;
    } else {
      // Regular analysis
      validateRequest(data);

      // Apply rate limiting
      if (!aiLimiter) {
        throw new Error('AI service rate limiting not configured');
      }

      const response = await axios.post(
        `${FLASK_API_URL}/api/analyze`,
        data,
        {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`AI service returned error: ${response.status}`);
      }

      return response.data;
    }
  } catch (error) {
    console.error('Error in AI service:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Map errors to specific error types
    if (error.code === 'ECONNREFUSED') {
      throw new Error('AI service unavailable');
    }

    if (error.code === 'ETIMEDOUT') {
      throw new Error('AI service request timed out');
    }

    throw error;
  }
};

// Health check
const checkHealth = async () => {
  try {
    const response = await axios.get(`${FLASK_API_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('AI service health check failed:', error);
    throw new Error('AI service health check failed');
  }
};

module.exports = {
  analyzeData,
  checkHealth
};
