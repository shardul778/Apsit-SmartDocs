import axios from 'axios';

const API_URL = '/api/ai';

// Get available AI models
export const getAIModels = async () => {
  const response = await axios.get(`${API_URL}/models`);
  return response.data;
};

// Generate text using AI
export const generateText = async (prompt, options = {}) => {
  const { maxLength = 500, temperature = 0.7, type = 'generate' } = options;
  
  const response = await axios.post(`${API_URL}/generate`, {
    prompt,
    maxLength,
    temperature,
    type,
  });
  
  return response.data;
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