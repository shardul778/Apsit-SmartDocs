const { validationResult } = require('express-validator');
const axios = require('axios');

/**
 * @desc    Generate text using Hugging Face API
 * @route   POST /api/ai/generate
 * @access  Private
 */
exports.generateText = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { prompt, maxLength = 500, temperature = 0.7, type = 'generate' } = req.body;

    // Validate prompt
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required',
      });
    }

    // Prepare prompt based on type
    let formattedPrompt = prompt;
    switch (type) {
      case 'paraphrase':
        formattedPrompt = `Paraphrase the following text in a formal tone suitable for official college documents: ${prompt}`;
        break;
      case 'summarize':
        formattedPrompt = `Summarize the following text in a concise and formal manner: ${prompt}`;
        break;
      case 'formal':
        formattedPrompt = `Rewrite the following text in a formal tone suitable for official college documents: ${prompt}`;
        break;
      case 'expand':
        formattedPrompt = `Expand on the following text with more details while maintaining a formal tone: ${prompt}`;
        break;
      default:
        // Use the prompt as is for general generation
        break;
    }

    // Check if we're using Hugging Face API or local model
    if (process.env.HUGGINGFACE_API_KEY) {
      // Use Hugging Face API
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.1'}`,
        {
          inputs: formattedPrompt,
          parameters: {
            max_new_tokens: maxLength,
            temperature: temperature,
            return_full_text: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract generated text from response
      const generatedText = response.data[0]?.generated_text || '';

      return res.status(200).json({
        success: true,
        data: {
          generated_text: generatedText,
        },
      });
    } else if (process.env.OLLAMA_API_URL) {
      // Use local Ollama model
      const response = await axios.post(
        process.env.OLLAMA_API_URL,
        {
          model: process.env.OLLAMA_MODEL || 'llama3',
          prompt: formattedPrompt,
          options: {
            temperature: temperature,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract generated text from response
      const generatedText = response.data.response || '';

      return res.status(200).json({
        success: true,
        data: {
          generated_text: generatedText,
        },
      });
    } else {
      // No AI model configured
      return res.status(500).json({
        success: false,
        message: 'AI model not configured. Please set up HUGGINGFACE_API_KEY or OLLAMA_API_URL in environment variables.',
      });
    }
  } catch (error) {
    console.error('AI generation error:', error.response?.data || error.message);
    
    // Handle specific API errors
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: 'Error generating text',
        error: error.response.data,
      });
    }
    
    next(error);
  }
};

/**
 * @desc    Get available AI models
 * @route   GET /api/ai/models
 * @access  Private
 */
exports.getModels = async (req, res, next) => {
  try {
    // Return available models based on configuration
    const models = [];
    
    if (process.env.HUGGINGFACE_API_KEY) {
      models.push({
        id: 'huggingface',
        name: process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.1',
        type: 'api',
        provider: 'Hugging Face',
      });
    }
    
    if (process.env.OLLAMA_API_URL) {
      models.push({
        id: 'ollama',
        name: process.env.OLLAMA_MODEL || 'llama3',
        type: 'local',
        provider: 'Ollama',
      });
    }
    
    res.status(200).json({
      success: true,
      count: models.length,
      data: models,
    });
  } catch (error) {
    next(error);
  }
};