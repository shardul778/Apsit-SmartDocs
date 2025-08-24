const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function testAIWithAuth() {
  console.log('🧪 Testing AI Service with Authentication...\n');
  
  try {
    // Step 1: Login to get a token
    console.log('1. Logging in to get authentication token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com', // Use a test user
      password: 'password123'     // Use a test password
    });
    
    if (!loginResponse.data.success || !loginResponse.data.token) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Step 2: Test AI models endpoint
    console.log('\n2. Testing AI models endpoint...');
    const modelsResponse = await axios.get(`${BASE_URL}/ai/models`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Models Response:', modelsResponse.data);
    
    // Step 3: Test AI generation
    if (modelsResponse.data.data && modelsResponse.data.data.length > 0) {
      console.log('\n3. Testing AI text generation...');
      const generateResponse = await axios.post(`${BASE_URL}/ai/generate`, {
        prompt: 'Create a simple business letter template for client communications',
        type: 'formal',
        maxLength: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Generation Response:', generateResponse.data.success ? 'Success' : 'Failed');
      if (generateResponse.data.data) {
        console.log('Generated text length:', generateResponse.data.data.generated_text?.length || 0);
        console.log('Generated text preview:', generateResponse.data.data.generated_text?.substring(0, 200) + '...');
      }
    } else {
      console.log('\n3. Skipping text generation (no AI models configured)');
    }
    
    console.log('\n🎉 AI Service Test with Authentication Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ AI Service Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the backend is running on port 5000');
    console.log('2. Check if you have a test user in the database');
    console.log('3. Verify the GEMINI_API_KEY is set in .env');
    console.log('4. Check the console for any error messages');
  }
}

testAIWithAuth();
