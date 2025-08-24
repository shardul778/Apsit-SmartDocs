import axios from './axiosConfig';

const API_URL = '/api/ai';

// Generate text using AI - Always use backend Gemini API
export const generateText = async (prompt, options = {}) => {
  const { maxLength = 500, temperature = 0.7, type = 'generate' } = options;
  
  try {
    console.log('AI Service: Starting content generation with Gemini API...');
    console.log('AI Service: Prompt:', prompt);
    console.log('AI Service: Options:', { type, maxLength, temperature });
    
    // Always use backend AI service (Gemini API)
    console.log('AI Service: Using Gemini API via backend...');
    
    const response = await axios.post(`${API_URL}/generate`, {
      prompt,
      maxLength,
      temperature,
      type,
    }, { timeout: 30000 }); // 30 second timeout
    
    console.log('AI Service: Gemini API response received:', response.data);
    
    // Check if the response has generated text
    if (response.data && response.data.success && response.data.data && response.data.data.generated_text) {
      console.log('AI Service: Successfully generated text using Gemini API');
      return response.data;
    } else {
      throw new Error('Invalid response from Gemini API - no generated text found');
    }
  } catch (error) {
    console.error('AI Service: Error occurred during Gemini API generation:', error);
    console.log('AI Service: Error details:', error.response?.status, error.response?.data);
    
    // If Gemini API fails, throw error instead of using hardcoded content
    throw new Error(`Gemini API generation failed: ${error.message || 'Unknown error'}`);
  }
};

// Get available AI models
export const getAIModels = async () => {
  try {
    console.log('AI Service: Getting AI models from backend...');
    
    const response = await axios.get(`${API_URL}/models`, { timeout: 5000 });
    console.log('AI Service: Models response:', response.data);
    return response.data;
  } catch (error) {
    console.log('AI Service: Models endpoint unavailable:', error.response?.status, error.message);
    // Return a default model to indicate backend is available
    return {
      success: true,
      data: [
        {
          id: 'gemini',
          name: 'gemini-1.5-flash',
          type: 'api',
          provider: 'Google Gemini',
          description: 'Google Gemini AI model for content generation'
        }
      ]
    };
  }
};

// Helper function to generate text with specific types
export const generateFormalText = async (prompt, options = {}) => {
  return generateText(prompt, { ...options, type: 'formal' });
};

export const paraphraseText = async (prompt, options = {}) => {
  return generateText(prompt, { ...options, type: 'paraphrase' });
};

export const summarizeText = async (prompt, options = {}) => {
  return generateText(prompt, { ...options, type: 'summarize' });
};

export const expandText = async (prompt, options = {}) => {
  return generateText(prompt, { ...options, type: 'expand' });
};