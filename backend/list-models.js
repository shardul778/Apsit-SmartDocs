const axios = require('axios');
require('dotenv').config();

async function listModels() {
  console.log('🔍 Listing available Gemini models...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ GEMINI_API_KEY not found');
    return;
  }
  
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    console.log('✅ Available Models:');
    response.data.models.forEach(model => {
      console.log(`- ${model.name}: ${model.description || 'No description'}`);
      if (model.supportedGenerationMethods) {
        console.log(`  Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error listing models:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
}

listModels();
