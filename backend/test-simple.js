const axios = require('axios');

async function testSimple() {
  try {
    console.log('Testing AI generation...');
    
    const response = await axios.post('http://localhost:5000/api/ai/generate', {
      prompt: 'Create a simple business letter template',
      type: 'formal',
      maxLength: 500
    });
    
    console.log('Success:', response.data.success);
    console.log('Generated text length:', response.data.data.generated_text.length);
    console.log('Generated text preview:', response.data.data.generated_text.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', error.response?.data);
    console.error('Error Message:', error.message);
  }
}

testSimple();
