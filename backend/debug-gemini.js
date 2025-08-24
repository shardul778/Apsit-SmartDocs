const axios = require('axios');
require('dotenv').config();

async function debugGemini() {
  console.log('🔍 Debugging Gemini API call...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ GEMINI_API_KEY not found');
    return;
  }
  
  const prompt = 'Create a professional template for: Create a simple business letter template';
  const temperature = 0.7;
  const maxLength = 500;
  
  console.log('📝 Prompt:', prompt);
  console.log('🌡️ Temperature:', temperature);
  console.log('📏 Max Length:', maxLength);
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxLength,
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
    console.log('Generated Text Preview:', response.data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Gemini API Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

debugGemini();
