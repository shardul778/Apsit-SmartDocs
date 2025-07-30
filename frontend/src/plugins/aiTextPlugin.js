/**
 * Enhanced TinyMCE Plugin
 * This plugin adds AI text generation capabilities and additional features to the TinyMCE editor
 */

import { generateFormalText, paraphraseText, summarizeText, expandText } from '../services/aiService';

const aiTextPlugin = (editor) => {
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
      const indent = '&nbsp;'.repeat((headingLevel - 1) * 4);
      
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
    fetch: (callback) => {
      // These are hardcoded templates for demonstration
      // In a real implementation, these could be fetched from an API
      const items = [
        {
          type: 'menuitem',
          text: 'Formal Letter',
          onAction: () => insertTemplate('formal-letter')
        },
        {
          type: 'menuitem',
          text: 'Meeting Minutes',
          onAction: () => insertTemplate('meeting-minutes')
        },
        {
          type: 'menuitem',
          text: 'Project Proposal',
          onAction: () => insertTemplate('project-proposal')
        },
        {
          type: 'menuitem',
          text: 'Policy Document',
          onAction: () => insertTemplate('policy')
        }
      ];
      callback(items);
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
        const indent = '&nbsp;'.repeat((level - 1) * 4);
        
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

  // Template content for insertion
  const templateContent = {
    'formal-letter': `<h2>Formal Letter</h2>
<p>[Your Name]<br>[Your Address]<br>[City, State ZIP]<br>[Your Email]<br>[Your Phone]</p>
<p>[Date]</p>
<p>[Recipient Name]<br>[Recipient Title]<br>[Company Name]<br>[Company Address]<br>[City, State ZIP]</p>
<p>Dear [Recipient Name],</p>
<p>I am writing to [purpose of the letter]. I would like to [specific request or information].</p>
<p>[Additional details or context about your request]</p>
<p>Thank you for your time and consideration. I look forward to your response.</p>
<p>Sincerely,</p>
<p>[Your Name]<br>[Your Title]</p>`,
    
    'meeting-minutes': `<h2>Meeting Minutes</h2>
<p><strong>Date:</strong> [Meeting Date]</p>
<p><strong>Time:</strong> [Start Time] - [End Time]</p>
<p><strong>Location:</strong> [Meeting Location]</p>
<p><strong>Attendees:</strong></p>
<ul>
<li>[Attendee 1]</li>
<li>[Attendee 2]</li>
<li>[Attendee 3]</li>
</ul>
<p><strong>Agenda:</strong></p>
<ol>
<li>[Agenda Item 1]</li>
<li>[Agenda Item 2]</li>
<li>[Agenda Item 3]</li>
</ol>
<p><strong>Discussion:</strong></p>
<p>[Summary of discussion points]</p>
<p><strong>Action Items:</strong></p>
<ul>
<li>[Action Item 1] - Assigned to: [Person], Due: [Date]</li>
<li>[Action Item 2] - Assigned to: [Person], Due: [Date]</li>
</ul>
<p><strong>Next Meeting:</strong> [Date and Time]</p>`,
    
    'project-proposal': `<h2>Project Proposal</h2>
<h3>Executive Summary</h3>
<p>[Brief overview of the project and its objectives]</p>
<h3>Project Background</h3>
<p>[Context and rationale for the project]</p>
<h3>Objectives</h3>
<ul>
<li>[Objective 1]</li>
<li>[Objective 2]</li>
<li>[Objective 3]</li>
</ul>
<h3>Scope</h3>
<p>[Define what is included and excluded from the project]</p>
<h3>Timeline</h3>
<p>[Project schedule with key milestones]</p>
<h3>Budget</h3>
<p>[Cost breakdown and financial requirements]</p>
<h3>Team</h3>
<p>[Key personnel and their roles]</p>
<h3>Expected Outcomes</h3>
<p>[Anticipated results and benefits]</p>`,
    
    'policy': `<h2>Policy Document</h2>
<h3>Purpose</h3>
<p>[State the purpose of this policy]</p>
<h3>Scope</h3>
<p>[Define who this policy applies to]</p>
<h3>Policy Statement</h3>
<p>[Main policy declaration]</p>
<h3>Definitions</h3>
<ul>
<li><strong>[Term 1]:</strong> [Definition]</li>
<li><strong>[Term 2]:</strong> [Definition]</li>
</ul>
<h3>Responsibilities</h3>
<p>[Outline who is responsible for implementing and enforcing this policy]</p>
<h3>Procedures</h3>
<ol>
<li>[Procedure step 1]</li>
<li>[Procedure step 2]</li>
<li>[Procedure step 3]</li>
</ol>
<h3>Compliance</h3>
<p>[Consequences of non-compliance]</p>
<h3>Related Documents</h3>
<p>[List related policies, procedures, or forms]</p>
<h3>Review</h3>
<p>This policy will be reviewed on [review date].</p>`
  };
  
  // Insert template content
  const insertTemplate = (templateKey) => {
    if (templateContent[templateKey]) {
      // Ask for confirmation before inserting template
      editor.windowManager.open({
        title: 'Insert Template',
        body: {
          type: 'panel',
          items: [{
            type: 'htmlpanel',
            html: '<p>This will insert a template at the current cursor position. Any selected text will be replaced. Do you want to continue?</p>'
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
          editor.insertContent(templateContent[templateKey]);
          api.close();
          editor.notificationManager.open({
            text: 'Template inserted successfully',
            type: 'success',
            timeout: 2000
          });
        }
      });
    } else {
      editor.notificationManager.open({
        text: `Template "${templateKey}" not found`,
        type: 'error',
        timeout: 3000
      });
    }
  };

  // Handle AI text generation actions
  const handleAiAction = async (type) => {
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