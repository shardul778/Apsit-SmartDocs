# AI Service Setup Guide

## Overview
The SmartDocs application includes an AI-powered content generation feature that can create template content based on user prompts. The AI service is designed to work even when external AI APIs are not configured.

## How It Works

### 1. Backend AI Service (Optional)
When properly configured, the backend can use external AI services:
- **Hugging Face API**: Free tier available, good for text generation
- **Google Gemini API**: High-quality AI, requires API key
- **Local Ollama**: Run AI models locally, no API costs

### 2. Local Fallback Service (Always Available)
When external AI services are unavailable, the system automatically falls back to local content generation that:
- Creates professional template structures
- Responds to user prompts intelligently
- Provides consistent, high-quality content
- Works offline

## Configuration

### Environment Variables
Create a `.env` file in the backend directory with these variables:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/smartdocs

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# AI Service Configuration (Optional)
# Choose one of the following:

# Option 1: Hugging Face API
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.1

# Option 2: Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Option 3: Local Ollama
OLLAMA_API_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
```

### No Configuration Required
If you don't set any AI environment variables, the system will:
1. Try to connect to external AI services
2. Automatically fall back to local generation
3. Provide the same user experience
4. Generate professional template content

## Testing the AI Service

### 1. Start the Backend
```bash
cd backend
npm install
npm start
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm start
```

### 3. Test AI Generation
1. Go to `/templates/create`
2. Click "Generate with AI"
3. Enter a prompt like "create a business formal letter"
4. Select a style (Formal, Creative, Concise, Detailed)
5. Click "Generate Content"

## Expected Behavior

### With AI Service Configured
- ✅ AI generates content from external service
- ✅ Fast response times
- ✅ High-quality, contextual content
- ✅ Fallback to local generation if service fails

### Without AI Service Configured
- ✅ Local content generation works immediately
- ✅ Professional template structures
- ✅ No errors or connection issues
- ✅ Consistent user experience

## Troubleshooting

### Common Issues

1. **"Request failed with status code 404"**
   - Backend is not running
   - Check if backend is on port 5000
   - Verify proxy configuration in frontend

2. **"AI service unavailable"**
   - This is normal when external AI is not configured
   - Local generation will work automatically
   - No action required

3. **Slow AI responses**
   - External AI service may be slow
   - Local generation is instant
   - Consider using local fallback

### Solutions

1. **Check Backend Status**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Verify Frontend Proxy**
   - Frontend package.json should have: `"proxy": "http://localhost:5000"`

3. **Check Console Logs**
   - Browser console shows AI service status
   - Backend console shows connection attempts

## Benefits of Local Fallback

- **Always Available**: Works offline and without external dependencies
- **Fast Response**: Instant content generation
- **Professional Quality**: Structured, business-appropriate templates
- **Cost Effective**: No API costs or rate limits
- **Reliable**: No external service dependencies

## Conclusion

The AI service is designed to work seamlessly regardless of configuration. Users will always get professional template content, whether from external AI services or local generation. No setup is required for basic functionality.
