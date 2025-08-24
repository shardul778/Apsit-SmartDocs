/**
 * Enhanced TinyMCE Plugin
 * This plugin adds AI text generation capabilities and additional features to the TinyMCE editor
 */

import { generateFormalText, paraphraseText, summarizeText, expandText } from '../services/aiService';
import axios from '../services/axiosConfig';

const aiTextPlugin = (editor) => {
  // Function to check and refresh token
  const refreshAuthToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    return false;
  };
  // Citation function
  const insertCitation = () => {
    editor.windowManager.open({
      title: 'Insert Citation',
      body: {
        type: 'panel',
        items: [
          {
            type: 'selectbox',
            name: 'style',
            label: 'Citation Style',
            items: [
              { text: 'APA', value: 'apa' },
              { text: 'MLA', value: 'mla' },
              { text: 'Chicago', value: 'chicago' },
              { text: 'Harvard', value: 'harvard' }
            ]
          },
          {
            type: 'input',
            name: 'author',
            label: 'Author(s)'
          },
          {
            type: 'input',
            name: 'title',
            label: 'Title'
          },
          {
            type: 'input',
            name: 'source',
            label: 'Source/Publisher'
          },
          {
            type: 'input',
            name: 'year',
            label: 'Year'
          },
          {
            type: 'input',
            name: 'url',
            label: 'URL (optional)'
          }
        ]
      },
      buttons: [
        {
          type: 'cancel',
          text: 'Cancel'
        },
        {
          type: 'submit',
          text: 'Insert',
          primary: true
        }
      ],
      onSubmit: (api) => {
        const data = api.getData();
        let citationText = '';
        
        // Format citation based on style
        switch (data.style) {
          case 'apa':
            citationText = `${data.author} (${data.year}). <em>${data.title}</em>. ${data.source}.`;
            if (data.url) citationText += ` Retrieved from ${data.url}`;
            break;
          case 'mla':
            citationText = `${data.author}. "${data.title}." <em>${data.source}</em>, ${data.year}.`;
            if (data.url) citationText += ` ${data.url}.`;
            break;
          case 'chicago':
            citationText = `${data.author}. <em>${data.title}</em>. ${data.source}, ${data.year}.`;
            if (data.url) citationText += ` ${data.url}.`;
            break;
          case 'harvard':
            citationText = `${data.author} (${data.year}) <em>${data.title}</em>, ${data.source}.`;
            if (data.url) citationText += ` Available at: ${data.url}.`;
            break;
          default:
            citationText = `${data.author} (${data.year}). ${data.title}. ${data.source}.`;
            if (data.url) citationText += ` ${data.url}`;
        }
        
        editor.insertContent(`<p class="citation">${citationText}</p>`);
        api.close();
      }
    });
  };
  
  // Generate Table of Contents
  const generateTOC = () => {
    // Get all headings from the content
    const content = editor.getContent();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Find all heading elements
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      editor.notificationManager.open({
        text: 'No headings found in the document',
        type: 'warning',
        timeout: 3000
      });
      return;
    }
    
    // Generate TOC HTML
    let tocHtml = '<div class="table-of-contents"><h2>Table of Contents</h2><ul>';
    
    headings.forEach((heading, index) => {
      const headingText = heading.textContent;
      const headingLevel = parseInt(heading.tagName.substring(1));
      
      // Add an ID to the heading if it doesn't have one
      if (!heading.id) {
        heading.id = `heading-${index}`;
      }
      
      tocHtml += `<li style="margin-left: ${(headingLevel - 1) * 20}px;"><a href="#${heading.id}">${headingText}</a></li>`;
    });
    
    tocHtml += '</ul></div>';
    
    // Insert the TOC at the cursor position
    editor.insertContent(tocHtml);
    
    // Update the content with the modified headings (with IDs)
    editor.setContent(tempDiv.innerHTML);
    
    editor.notificationManager.open({
      text: 'Table of Contents generated',
      type: 'success',
      timeout: 2000
    });
  };

  // Register AI Text plugin
  editor.ui.registry.addMenuButton('aitext', {
    text: 'AI Text',
    tooltip: 'AI Text Generation',
    icon: 'bot',
    fetch: (callback) => {
      const items = [
        {
          type: 'menuitem',
          text: 'Formalize',
          tooltip: 'Make text more formal',
          onAction: () => handleAiAction('formal')
        },
        {
          type: 'menuitem',
          text: 'Paraphrase',
          tooltip: 'Rewrite selected text',
          onAction: () => handleAiAction('paraphrase')
        },
        {
          type: 'menuitem',
          text: 'Summarize',
          tooltip: 'Create a summary of selected text',
          onAction: () => handleAiAction('summarize')
        },
        {
          type: 'menuitem',
          text: 'Expand',
          tooltip: 'Expand selected text with more details',
          onAction: () => handleAiAction('expand')
        }
      ];
      callback(items);
    }
  });
  
  // Register Citation button
  editor.ui.registry.addButton('citation', {
    text: 'Cite',
    tooltip: 'Insert Citation',
    icon: 'cite',
    onAction: insertCitation
  });
  
  // Register Table of Contents button
  editor.ui.registry.addButton('tableofcontents', {
    text: 'TOC',
    tooltip: 'Insert Table of Contents',
    icon: 'toc',
    onAction: generateTOC
  });
  
  // Add template insertion button
  editor.ui.registry.addMenuButton('templates', {
    text: 'Templates',
    tooltip: 'Insert Template Content',
    icon: 'template',
    fetch: async (callback) => {
      try {
        // Import templateService dynamically to avoid circular dependencies
        const { getTemplates } = await import('../services/templateService');
        
        // Fetch templates from the backend
        const templates = await getTemplates();
        
        if (templates && templates.length > 0) {
          // Map templates to menu items
          const items = templates.map(template => ({
            type: 'menuitem',
            text: template.name,
            onAction: () => insertDynamicTemplate(template)
          }));
          
          // Add option to create a new template (for admin users)
          items.push({
            type: 'menuitem',
            text: '➕ Create New Template...',
            onAction: () => {
              // Open template creation page in a new tab/window
              window.open('/templates/create', '_blank');
            }
          });
          
          callback(items);
        } else {
          // If no templates are available, show a message
          callback([{
            type: 'menuitem',
            text: 'No templates available',
            onAction: () => {
              editor.notificationManager.open({
                text: 'No templates available. Create a template first.',
                type: 'info',
                timeout: 3000
              });
            }
          },
          {
            type: 'menuitem',
            text: '➕ Create New Template...',
            onAction: () => {
              // Open template creation page in a new tab/window
              window.open('/templates/create', '_blank');
            }
          }]);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        // Show error in menu
        callback([{
          type: 'menuitem',
          text: 'Error loading templates',
          onAction: () => {
            editor.notificationManager.open({
              text: 'Failed to load templates. Please try again later.',
              type: 'error',
              timeout: 3000
            });
          }
        }]);
      }
    }
  });
  
  // Add citation button
  editor.ui.registry.addButton('citation', {
    text: 'Cite',
    tooltip: 'Insert Citation',
    icon: 'cite',
    onAction: () => {
      editor.windowManager.open({
        title: 'Insert Citation',
        body: {
          type: 'panel',
          items: [
            {
              type: 'input',
              name: 'source',
              label: 'Source'
            },
            {
              type: 'input',
              name: 'author',
              label: 'Author'
            },
            {
              type: 'input',
              name: 'year',
              label: 'Year'
            },
            {
              type: 'selectbox',
              name: 'style',
              label: 'Citation Style',
              items: [
                { text: 'APA', value: 'apa' },
                { text: 'MLA', value: 'mla' },
                { text: 'Chicago', value: 'chicago' },
                { text: 'Harvard', value: 'harvard' }
              ]
            }
          ]
        },
        buttons: [
          {
            type: 'cancel',
            text: 'Cancel'
          },
          {
            type: 'submit',
            text: 'Insert',
            primary: true
          }
        ],
        onSubmit: (api) => {
          const data = api.getData();
          let citationText = '';
          
          // Format citation based on style
          switch(data.style) {
            case 'apa':
              citationText = `(${data.author}, ${data.year})`;
              break;
            case 'mla':
              citationText = `(${data.author} ${data.year})`;
              break;
            case 'chicago':
              citationText = `(${data.author} ${data.year})`;
              break;
            case 'harvard':
              citationText = `(${data.author}, ${data.year})`;
              break;
            default:
              citationText = `(${data.source})`;
          }
          
          editor.insertContent(citationText);
          api.close();
        }
      });
    }
  });
  
  // Add table of contents button
  editor.ui.registry.addButton('tableofcontents', {
    text: 'TOC',
    tooltip: 'Insert Table of Contents',
    icon: 'toc',
    onAction: () => {
      // Generate TOC based on headings in the document
      const content = editor.getContent();
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      // Find all headings
      const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      if (headings.length === 0) {
        editor.notificationManager.open({
          text: 'No headings found in the document',
          type: 'warning',
          timeout: 3000
        });
        return;
      }
      
      // Generate TOC HTML
      let tocHtml = '<div class="toc"><h2>Table of Contents</h2><ul>';
      
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.substring(1));
        const text = heading.textContent;
        
        // Add ID to the heading if it doesn't have one
        if (!heading.id) {
          heading.id = `heading-${index}`;
        }
        
        tocHtml += `<li style="margin-left: ${(level-1)*20}px;"><a href="#${heading.id}">${text}</a></li>`;
      });
      
      tocHtml += '</ul></div><hr>';
      
      // Insert TOC at cursor position
      editor.insertContent(tocHtml);
    }
  });


  
  // Insert dynamic template content from backend
  const insertDynamicTemplate = (template) => {
    if (template && template.content) {
      // Ask for confirmation before inserting template
      editor.windowManager.open({
        title: `Insert "${template.name}" Template`,
        body: {
          type: 'panel',
          items: [{
            type: 'htmlpanel',
            html: `<p>This will insert the "${template.name}" template at the current cursor position. Any selected text will be replaced.</p>
                  <p><strong>Category:</strong> ${template.category}</p>
                  ${template.description ? `<p><strong>Description:</strong> ${template.description}</p>` : ''}`
          }]
        },
        buttons: [
          {
            type: 'cancel',
            text: 'Cancel'
          },
          {
            type: 'submit',
            text: 'Insert',
            primary: true
          }
        ],
        onSubmit: (api) => {
          // Process template content to replace variables with actual values if needed
          let processedContent = template.content;
          
          // Example of variable replacement (can be expanded based on available user data)
          const currentDate = new Date().toLocaleDateString();
          processedContent = processedContent.replace(/{{date}}/g, currentDate);
          
          // Insert the processed template content
          editor.insertContent(processedContent);
          api.close();
          editor.notificationManager.open({
            text: `Template "${template.name}" inserted successfully`,
            type: 'success',
            timeout: 2000
          });
        }
      });
    } else {
      editor.notificationManager.open({
        text: 'Invalid template data',
        type: 'error',
        timeout: 3000
      });
    }
  };
  


  // Handle AI text generation actions
  const handleAiAction = async (type) => {
    // Check authentication before proceeding
    if (!refreshAuthToken()) {
      editor.notificationManager.open({
        text: 'Please log in to use AI features',
        type: 'error',
        timeout: 3000
      });
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    // Get selected text
    const selectedText = editor.selection.getContent({ format: 'text' });
    
    if (!selectedText) {
      editor.notificationManager.open({
        text: 'Please select some text first',
        type: 'warning',
        timeout: 3000
      });
      return;
    }

    // Show loading notification
    const loadingNotification = editor.notificationManager.open({
      text: 'Generating text...',
      type: 'info',
      closeButton: false
    });

    try {
      let result;
      
      // Call appropriate AI service based on type
      switch (type) {
        case 'formal':
          result = await generateFormalText(selectedText);
          break;
        case 'paraphrase':
          result = await paraphraseText(selectedText);
          break;
        case 'summarize':
          result = await summarizeText(selectedText);
          break;
        case 'expand':
          result = await expandText(selectedText);
          break;
        default:
          throw new Error('Unknown AI action type');
      }

      // Close loading notification
      loadingNotification.close();
      
      // Replace selected text with generated text
      if (result && result.data && result.data.generated_text) {
        editor.selection.setContent(result.data.generated_text);
        editor.notificationManager.open({
          text: 'Text generated successfully',
          type: 'success',
          timeout: 2000
        });
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('AI text generation error:', error);
      
      // Close loading notification
      loadingNotification.close();
      
      // Handle specific error types
      if (error.response && error.response.status === 401) {
        // Authentication error
        editor.notificationManager.open({
          text: 'Authentication error: Please log in again to use AI features',
          type: 'error',
          timeout: 5000
        });
        
        // Optionally redirect to login page
        // window.location.href = '/login';
      } else if (error.response && error.response.status === 500) {
        // Server error
        editor.notificationManager.open({
          text: 'Server error: AI service is currently unavailable. Please try again later.',
          type: 'error',
          timeout: 5000
        });
      } else {
        // Generic error
        editor.notificationManager.open({
          text: `Error generating text: ${error.message || 'Unknown error'}`,
          type: 'error',
          timeout: 3000
        });
      }
    }
  };
};

export default aiTextPlugin;