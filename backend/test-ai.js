const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/ai';

async function testAIService() {
  console.log('🧪 Testing AI Service...\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);
    
    // Test 2: Get Models
    console.log('\n2. Testing Get Models...');
    const modelsResponse = await axios.get(`${BASE_URL}/models`);
    console.log('✅ Models Response:', modelsResponse.data);
    
    // Test 3: Generate Text (if models available)
    if (modelsResponse.data.data && modelsResponse.data.data.length > 0) {
      console.log('\n3. Testing Text Generation...');
      const generateResponse = await axios.post(`${BASE_URL}/generate`, {
        prompt: 'Create a simple business letter template',
        type: 'formal',
        maxLength: 200,
        temperature: 0.7
      });
      console.log('✅ Text Generation:', generateResponse.data.success ? 'Success' : 'Failed');
      if (generateResponse.data.data) {
        console.log('Generated text length:', generateResponse.data.data.generated_text?.length || 0);
      }
    } else {
      console.log('\n3. Skipping Text Generation (no AI models configured)');
    }
    
    console.log('\n🎉 AI Service Test Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ AI Service Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the backend running?');
      console.error('Make sure to start the backend with: npm start');
    } else {
      console.error('Error:', error.message);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the backend is running on port 5000');
    console.log('2. Check if MongoDB is connected');
    console.log('3. Verify all dependencies are installed');
    console.log('4. Check the console for any error messages');
  }
}

// Run the test
testAIService();
