const { validationResult } = require('express-validator');
const axios = require('axios');

/**
 * @desc    Generate text using Hugging Face API
 * @route   POST /api/ai/generate
 * @access  Private
 */
exports.generateText = async (req, res, next) => {
  try {
    // Verify user is authenticated (temporarily disabled for testing)
    // if (!req.user) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Authentication required to use AI features'
    //   });
    // }

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

    // Prepare prompt based on type with better formatting instructions
    let formattedPrompt = prompt;
    switch (type) {
      case 'paraphrase':
        formattedPrompt = `Paraphrase the following text in a formal tone suitable for official college documents. Please format the response as clean HTML:

${prompt}

Please format the response with:
- Use <strong> for bold text, <em> for italic
- Use <p> for paragraphs
- Clear paragraph breaks
- Proper spacing between sections
- Professional formatting suitable for official documents
- Maintain readability and structure`;
        break;
      case 'summarize':
        formattedPrompt = `Summarize the following text in a concise and formal manner. Please format the response with proper structure and readability:

${prompt}

Please provide a well-formatted summary with:
- Clear introduction
- Key points in organized format
- Proper paragraph spacing
- Professional tone`;
        break;
      case 'formal':
        formattedPrompt = `Create a professional template for: ${prompt}

Please format the response as clean HTML with:
- Use <strong> for bold text instead of **
- Use <em> for italic text instead of *
- Use <h1>, <h2>, <h3> for headers
- Use <ul> and <li> for lists
- Use <p> for paragraphs
- Professional letter/document structure
- Clear sections with proper spacing
- Include placeholders in [brackets] for customization
- Maintain proper spacing and readability
- Do not include any header text or titles, only the main content

Make sure the template is well-structured and easy to read.`;
        break;
      case 'expand':
        formattedPrompt = `Expand on the following text with more details while maintaining a formal tone. Please format the response with proper structure:

${prompt}

Please provide an expanded version with:
- Clear introduction and context
- Detailed sections with proper spacing
- Professional formatting
- Proper paragraph breaks
- Maintain readability throughout`;
        break;
      default:
        formattedPrompt = `Please provide a professional response to: ${prompt}

Format the response with:
- Clear structure and organization
- Proper paragraph spacing
- Professional formatting
- Maintain readability`;
        break;
    }

    // Check if we're using Gemini API (prioritized) or Hugging Face API
    if (process.env.GEMINI_API_KEY) {
      // Use Google's Gemini API
      console.log('Using Gemini API with prompt:', formattedPrompt);
      
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  { text: formattedPrompt }
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

        console.log('Gemini API response status:', response.status);
        console.log('Gemini API response data:', response.data);

        // Extract generated text from Gemini response
        const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (!generatedText) {
          throw new Error('No text generated from Gemini API');
        }
        
        return res.status(200).json({
          success: true,
          data: {
            generated_text: generatedText,
          },
        });
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError.response?.data || geminiError.message);
        throw geminiError;
      }
    } else if (process.env.HUGGINGFACE_API_KEY) {
      // Use Hugging Face API as fallback
      console.log('Using Hugging Face API as fallback with prompt:', formattedPrompt);
      
      try {
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
      } catch (huggingfaceError) {
        console.error('Hugging Face API error:', huggingfaceError.response?.data || huggingfaceError.message);
        throw huggingfaceError;
      }
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
        message: 'AI model not configured. Please set up HUGGINGFACE_API_KEY, GEMINI_API_KEY, or OLLAMA_API_URL in environment variables.',
      });
    }
  } catch (error) {
    console.error('AI generation error:', error.response?.data || error.message);
    
    // Handle specific API errors
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Authentication error: Please log in again to use AI features'
      });
    } else if (error.response) {
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
    // Return available models based on configuration (temporarily allowing unauthenticated access)
    const models = [];
    
    if (process.env.HUGGINGFACE_API_KEY) {
      models.push({
        id: 'huggingface',
        name: process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.1',
        type: 'api',
        provider: 'Hugging Face',
      });
    }
    
    if (process.env.GEMINI_API_KEY) {
      models.push({
        id: 'gemini',
        name: 'gemini-1.5-flash',
        type: 'api',
        provider: 'Google Gemini',
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

/**
 * @desc    Classify document text into a category using simple keyword matching
 * @route   POST /api/ai/classify
 * @access  Private
 */
exports.classifyText = async (req, res, next) => {
  try {
    const { text, content } = req.body || {};

    // Build a plain text input from either raw text or content object
    let inputText = '';
    if (typeof text === 'string' && text.trim().length > 0) {
      inputText = text.toLowerCase();
    } else if (content && typeof content === 'object') {
      try {
        inputText = Object.values(content)
          .filter(v => typeof v === 'string')
          .join(' ') 
          .toLowerCase();
      } catch (e) {
        inputText = '';
      }
    }

    if (!inputText || inputText.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Provide either text (string) or content (object with strings) to classify'
      });
    }

    // Define lightweight keyword rules for categories
    const rules = [
      {
        category: 'Offer Letter',
        keywords: ['offer letter', 'joining date', 'ctc', 'role', 'designation', 'employment', 'salary']
      },
      {
        category: 'Invoice',
        keywords: ['invoice', 'total due', 'subtotal', 'gst', 'tax', 'bill to', 'invoice number']
      },
      {
        category: 'ID Proof',
        keywords: ['identity', 'id card', 'passport', 'aadhaar', 'pan', 'driver license']
      },
      {
        category: 'Application/Request',
        keywords: ['application', 'request', 'kindly', 'subject', 'respected', 'leave', 'permission']
      },
      {
        category: 'Certificate',
        keywords: ['certificate', 'certify', 'hereby', 'completion', 'attendance', 'bonafide']
      }
    ];

    // Score categories by keyword matches
    let best = { category: 'Uncategorized', score: 0 };
    const tokenText = inputText;

    rules.forEach(rule => {
      let score = 0;
      rule.keywords.forEach(kw => {
        if (tokenText.includes(kw)) {
          score += 1;
        }
      });
      if (score > best.score) {
        best = { category: rule.category, score };
      }
    });

    // Confidence heuristic based on match density
    const maxPossible = Math.max(...rules.map(r => r.keywords.length));
    const confidence = best.score === 0 ? 0.2 : Math.min(0.95, 0.4 + best.score / (maxPossible + 1));

    return res.status(200).json({
      success: true,
      data: {
        category: best.category,
        confidence,
      }
    });
  } catch (error) {
    next(error);
  }
};