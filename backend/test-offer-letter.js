const axios = require('axios');

async function testOfferLetter() {
  try {
    console.log('Testing offer letter generation...');
    
    const response = await axios.post('http://localhost:5000/api/ai/generate', {
      prompt: 'Offer letter from APSIT',
      type: 'formal',
      maxLength: 500
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success:', response.data.success);
    console.log('Generated text length:', response.data.data.generated_text.length);
    console.log('Generated text preview:', response.data.data.generated_text.substring(0, 200) + '...');
    console.log('Source:', response.data.data.source);
    
  } catch (error) {
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', error.response?.data);
    console.error('Error Message:', error.message);
  }
}

testOfferLetter();
