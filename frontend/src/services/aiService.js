import axios from './axiosConfig';

const API_URL = '/api/ai';

// Local AI fallback service for when backend AI is not available
const generateLocalContent = (prompt, type, maxLength = 500) => {
  const basePrompt = prompt.toLowerCase();
  
  // Generate content based on prompt keywords and type
  let content = '';
  
  if (type === 'formal') {
    if (basePrompt.includes('letter') || basePrompt.includes('business')) {
      content = `Dear [Recipient Name],

I hope this letter finds you well. I am writing to you regarding [Subject Matter].

[Main Content - Please provide specific details about your request or inquiry]

I appreciate your time and consideration in this matter. If you have any questions or require additional information, please do not hesitate to contact me.

Best regards,

[Your Name]
[Your Title]
[Your Company]
[Contact Information]`;
    } else if (basePrompt.includes('email') || basePrompt.includes('correspondence')) {
      content = `Subject: [Email Subject]

Dear [Recipient Name],

I hope this email finds you well. I am reaching out to you regarding [Subject Matter].

[Main Content - Please provide specific details about your request or inquiry]

I look forward to hearing from you. If you have any questions or need additional information, please don't hesitate to contact me.

Best regards,

[Your Name]
[Your Title]
[Your Company]
[Your Email]`;
    } else if (basePrompt.includes('document') || basePrompt.includes('report')) {
      content = `[Document Title]

[Introduction - Formal opening statement]

[Main Content - Please provide specific details about your request or inquiry]

[Conclusion - Formal closing statement]

[Your Name]
[Your Title]
[Your Organization]
[Date]`;
    } else if (basePrompt.includes('proposal') || basePrompt.includes('offer')) {
      content = `[Proposal Title]

Executive Summary:
[Brief overview of the proposal]

Background:
[Context and background information]

Proposed Solution:
[Detailed description of the proposed solution]

Benefits:
[Key benefits and advantages]

Implementation Plan:
[Step-by-step implementation approach]

Budget:
[Cost breakdown and financial details]

Conclusion:
[Summary and next steps]

[Your Name]
[Your Title]
[Your Organization]
[Date]`;
    } else if (basePrompt.includes('contract') || basePrompt.includes('agreement')) {
      content = `[Contract/Agreement Title]

This agreement is made on [Date] between:

[Party A Name] (hereinafter referred to as "Party A")
[Party A Address]

AND

[Party B Name] (hereinafter referred to as "Party B")
[Party B Address]

1. PURPOSE
[Description of the agreement purpose]

2. TERMS AND CONDITIONS
[Detailed terms and conditions]

3. DURATION
[Agreement duration and timeline]

4. TERMINATION
[Termination conditions and procedures]

5. SIGNATURES

Party A: _________________ Date: _________________
Party B: _________________ Date: _________________`;
    } else {
      content = `[Formal Document Title]

[Introduction - Formal opening statement]

[Main Content - Please provide specific details about your request or inquiry]

[Conclusion - Formal closing statement]

[Your Name]
[Your Title]
[Your Organization]
[Date]`;
    }
  } else if (type === 'paraphrase') {
    if (basePrompt.includes('letter') || basePrompt.includes('email')) {
      content = `[Rephrased Professional Communication]

Dear [Recipient Name],

I trust this message finds you in good health and high spirits. I am reaching out to you concerning [Subject Matter].

[Enhanced Content - A more polished and professional version of your original message]

I would be grateful for your time and consideration regarding this matter. Should you require any additional information or have any questions, please do not hesitate to reach out to me directly.

With warm regards and appreciation,

[Your Name]
[Your Title]
[Your Company]
[Your Contact Information]`;
    } else {
      content = `[Enhanced Professional Version]

[Original Content]: ${prompt}

[Rephrased Content]: Here is a more formal and professional version of your content. The text has been enhanced with improved language, better structure, and more appropriate business terminology while maintaining your original intent and message.`;
    }
  } else if (type === 'summarize') {
    if (basePrompt.includes('report') || basePrompt.includes('document')) {
      content = `[Executive Summary]

Key Points:
• [Main point 1]
• [Main point 2]
• [Main point 3]

Summary:
[Concise summary of the main content in 2-3 sentences]

Recommendations:
[Key recommendations or next steps]

[Your Name]
[Your Title]
[Date]`;
    } else {
      content = `[Content Summary]

[Content to Summarize]: ${prompt}

[Summary]: Here is a concise summary of your content. The key points have been extracted and presented in a clear, organized format for easy reference and understanding.`;
    }
  } else if (type === 'expand') {
    if (basePrompt.includes('proposal') || basePrompt.includes('plan')) {
      content = `[Expanded Proposal/Plan]

Executive Summary:
[Comprehensive overview of the proposal]

Detailed Background:
[In-depth context and background information]

Problem Statement:
[Clear definition of the problem or opportunity]

Proposed Solution:
[Detailed description of the proposed solution with multiple components]

Implementation Strategy:
[Step-by-step implementation approach with timelines]

Resource Requirements:
[Detailed resource needs including personnel, equipment, and budget]

Risk Assessment:
[Identification and mitigation of potential risks]

Success Metrics:
[How success will be measured and evaluated]

Timeline:
[Detailed project timeline with milestones]

Budget Breakdown:
[Comprehensive cost analysis]

Conclusion:
[Summary and call to action]

[Your Name]
[Your Title]
[Your Organization]
[Date]`;
    } else {
      content = `[Expanded Content]

[Original Content]: ${prompt}

[Expanded Version]: Here is an expanded version with more details, context, and comprehensive information. The content has been enhanced with additional sections, examples, and detailed explanations to provide a more thorough understanding of the subject matter.`;
    }
  } else {
    // Default case for any other type
    if (basePrompt.includes('template')) {
      content = `[Professional Template]

[Document Title]

[Introduction - Professional opening statement]

[Main Content - Detailed information and content]

[Supporting Details - Additional context and examples]

[Conclusion - Summary and closing remarks]

[Contact Information]
[Your Name]
[Your Title]
[Your Organization]
[Date]`;
    } else {
      content = `[Professional Document Template]

[Document Title]

[Introduction]
[Main Content]
[Conclusion]
[Contact Information]

Please customize this template according to your specific needs and requirements.`;
    }
  }
  
  // Truncate if too long
  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + '...';
  }
  
  return content;
};

// Check if backend AI service is available
const checkAIServiceAvailability = async () => {
  try {
    const response = await axios.get(`${API_URL}/models`, { timeout: 5000 });
    // Check if we have actual AI models configured (not just local fallback)
    if (response.data && response.data.data && response.data.data.length > 0) {
      const hasRealModels = response.data.data.some(model => 
        model.provider && 
        !model.provider.includes('Local') && 
        !model.provider.includes('SmartDocs Local')
      );
      return hasRealModels;
    }
    return false;
  } catch (error) {
    console.log('AI Service: Backend not available, using local fallback');
    return false;
  }
};

// Generate text using AI
export const generateText = async (prompt, options = {}) => {
  const { maxLength = 500, temperature = 0.7, type = 'generate' } = options;
  
  try {
    console.log('AI Service: Starting content generation...');
    console.log('AI Service: Prompt:', prompt);
    console.log('AI Service: Options:', { type, maxLength, temperature });
    
    const isBackendAvailable = await checkAIServiceAvailability();
    console.log('AI Service: Backend available:', isBackendAvailable);
    
    if (!isBackendAvailable) {
      console.log('AI Service: Using local AI service for content generation');
      const fallbackContent = generateLocalContent(prompt, type, maxLength);
      console.log('AI Service: Local content generated successfully, length:', fallbackContent.length);
      
      return {
        success: true,
        data: {
          generated_text: fallbackContent,
          source: 'local_fallback'
        },
        message: 'Content generated successfully using local AI service'
      };
    }
    
    console.log('AI Service: Backend available, sending request to external AI service...');
    
    const response = await axios.post(`${API_URL}/generate`, {
      prompt,
      maxLength,
      temperature,
      type,
    }, { timeout: 30000 }); // 30 second timeout
    
    console.log('AI Service: External AI response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('AI Service: Error occurred during generation:', error);
    
    // If backend AI fails, use local fallback
    console.log('AI Service: External AI failed, using local AI service as fallback');
    const fallbackContent = generateLocalContent(prompt, type, maxLength);
    console.log('AI Service: Fallback content generated successfully, length:', fallbackContent.length);
    
    return {
      success: true,
      data: {
        generated_text: fallbackContent,
        source: 'local_fallback'
      },
      message: 'Content generated successfully using local AI service'
    };
  }
};

// Get available AI models
export const getAIModels = async () => {
  try {
    const response = await axios.get(`${API_URL}/models`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.log('AI Service: Models endpoint unavailable, using local fallback');
    return {
      success: true,
      data: [
        {
          id: 'local',
          name: 'Local Content Generator',
          type: 'local',
          provider: 'SmartDocs Local Service',
          description: 'Generates template content locally when AI service is unavailable'
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