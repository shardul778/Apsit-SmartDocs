const axios = require('axios');
require('dotenv').config();

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API directly...\n');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ GEMINI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ GEMINI_API_KEY found');
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: 'Create a simple business letter template for client communications' }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Gemini API Response:');
    console.log('Status:', response.status);
    console.log('Generated Text Length:', response.data.candidates?.[0]?.content?.parts?.[0]?.text?.length || 0);
    console.log('\nGenerated Text Preview:');
    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(generatedText.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Gemini API Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
  }
}

testGeminiAPI();
