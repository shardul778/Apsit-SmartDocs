const { validationResult } = require('express-validator');
const axios = require('axios');

// Enhanced local content generation with intelligent analysis
const generateLocalContent = (prompt, type) => {
  const basePrompt = prompt.toLowerCase();
  
  // Advanced prompt analysis system
  const analyzePrompt = (text) => {
    const analysis = {
      // Basic info
      purpose: '',
      recipient: '',
      sender: '',
      context: '',
      subject: '',
      date: '',
      organization: '',
      location: '',
      time: '',
      
      // Document type detection
      documentType: '',
      urgency: '',
      audience: '',
      
      // Extracted details
      specificDetails: [],
      keywords: [],
      dates: [],
      names: [],
      
      // Content requirements
      length: 'medium',
      tone: 'professional',
      sections: []
    };
    
    // Extract keywords and patterns
    const keywords = text.match(/\b\w+\b/g) || [];
    analysis.keywords = keywords.slice(0, 20); // Top 20 keywords
    
    // Document type detection with scoring
    const docTypes = {
      'notice': ['notice', 'announcement', 'inform', 'notify'],
      'holiday': ['holiday', 'vacation', 'break', 'festival', 'celebration'],
      'meeting': ['meeting', 'conference', 'gathering', 'session'],
      'exam': ['exam', 'examination', 'test', 'assessment', 'evaluation'],
      'event': ['event', 'program', 'function', 'ceremony', 'festival'],
      'letter': ['letter', 'correspondence', 'communication'],
      'memo': ['memo', 'memorandum', 'internal'],
      'policy': ['policy', 'rule', 'regulation', 'guideline'],
      'application': ['application', 'request', 'apply', 'submission'],
      'certificate': ['certificate', 'certification', 'award', 'recognition']
    };
    
    let maxScore = 0;
    for (const [type, patterns] of Object.entries(docTypes)) {
      let score = 0;
      patterns.forEach(pattern => {
        if (text.includes(pattern)) score += 1;
      });
      if (score > maxScore) {
        maxScore = score;
        analysis.documentType = type;
      }
    }
    
    // Extract dates with multiple patterns
    const datePatterns = [
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi,
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g
    ];
    
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        analysis.dates.push(...matches);
      }
    });
    
    // Extract names (capitalized words that could be names)
    const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const names = text.match(namePattern);
    if (names) {
      analysis.names = names.filter(name => 
        name.length > 2 && 
        !['The', 'This', 'That', 'There', 'Here', 'Where', 'When', 'What', 'Who', 'How'].includes(name)
      );
    }
    
    // Extract time patterns
    const timePattern = /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi;
    const timeMatch = text.match(timePattern);
    if (timeMatch) {
      analysis.time = timeMatch[0];
    }
    
    // Extract location patterns
    const locationPatterns = [
      /\b(at|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:room|hall|auditorium|building|center|office))\b/gi,
      /\b(room|hall|auditorium|building|center|office)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi
    ];
    
    locationPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        analysis.location = match[0];
      }
    });
    
    // Extract recipient patterns
    const recipientPatterns = [
      /to\s+([^,\n]+)/i,
      /for\s+([^,\n]+)/i,
      /all\s+([^,\n]+)/i
    ];
    
    recipientPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && !analysis.recipient) {
        analysis.recipient = match[1].trim();
      }
    });
    
    // Extract sender patterns
    const senderPatterns = [
      /from\s+([^,\n]+)/i,
      /by\s+([^,\n]+)/i
    ];
    
    senderPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && !analysis.sender) {
        analysis.sender = match[1].trim();
      }
    });
    
    // Extract subject/purpose
    const purposePatterns = [
      /about\s+([^,\n]+)/i,
      /regarding\s+([^,\n]+)/i,
      /concerning\s+([^,\n]+)/i
    ];
    
    purposePatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && !analysis.purpose) {
        analysis.purpose = match[1].trim();
      }
    });
    
    // Set intelligent defaults based on document type
    if (analysis.documentType === 'notice' || analysis.documentType === 'holiday') {
      analysis.recipient = analysis.recipient || 'All Students and Staff';
      analysis.sender = analysis.sender || 'College Administration';
      analysis.subject = analysis.purpose || 'Important Notice';
      analysis.audience = 'general';
    } else if (analysis.documentType === 'meeting') {
      analysis.recipient = analysis.recipient || 'All Faculty Members';
      analysis.sender = analysis.sender || 'Department Head';
      analysis.subject = 'Meeting Notice';
      analysis.audience = 'faculty';
    } else if (analysis.documentType === 'exam') {
      analysis.recipient = analysis.recipient || 'All Students';
      analysis.sender = analysis.sender || 'Examination Department';
      analysis.subject = 'Examination Notice';
      analysis.audience = 'students';
    } else if (analysis.documentType === 'event') {
      analysis.recipient = analysis.recipient || 'All Students and Staff';
      analysis.sender = analysis.sender || 'Event Committee';
      analysis.subject = 'Event Announcement';
      analysis.audience = 'general';
    }
    
    // Determine content length based on prompt complexity
    const wordCount = text.split(' ').length;
    if (wordCount > 15 || analysis.keywords.length > 8) {
      analysis.length = 'long';
    } else if (wordCount > 8) {
      analysis.length = 'medium';
    } else {
      analysis.length = 'short';
    }
    
    // Extract specific details
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    analysis.specificDetails = sentences.slice(0, 5); // Take up to 5 meaningful sentences
    
    return analysis;
  };
  
  const analysis = analyzePrompt(prompt);
  
  // Intelligent content generation based on analysis
  const generateDocumentContent = (analysis) => {
    const { documentType, recipient, sender, subject, dates, time, location, purpose, audience, length, keywords } = analysis;
    
    // Generate appropriate title based on document type
    const getTitle = () => {
      switch (documentType) {
        case 'notice': return 'NOTICE';
        case 'holiday': return 'HOLIDAY NOTICE';
        case 'meeting': return 'MEETING NOTICE';
        case 'exam': return 'EXAMINATION NOTICE';
        case 'event': return 'EVENT ANNOUNCEMENT';
        case 'letter': return 'BUSINESS LETTER';
        case 'memo': return 'MEMORANDUM';
        case 'policy': return 'POLICY ANNOUNCEMENT';
        case 'application': return 'APPLICATION NOTICE';
        case 'certificate': return 'CERTIFICATE NOTICE';
        default: return 'OFFICIAL NOTICE';
      }
    };
    
    // Generate comprehensive content based on document type
    const generateMainContent = () => {
      let content = '';
      
      switch (documentType) {
        case 'holiday':
          content = generateHolidayContent(analysis);
          break;
        case 'meeting':
          content = generateMeetingContent(analysis);
          break;
        case 'exam':
          content = generateExamContent(analysis);
          break;
        case 'event':
          content = generateEventContent(analysis);
          break;
        case 'letter':
          content = generateLetterContent(analysis);
          break;
        case 'policy':
          content = generatePolicyContent(analysis);
          break;
        case 'notice':
        default:
          content = generateNoticeContent(analysis);
          break;
      }
      
      return content;
    };
    
    // Generate holiday-specific content
    const generateHolidayContent = (analysis) => {
      const holidayName = analysis.keywords.find(k => ['christmas', 'diwali', 'eid', 'holi', 'dussehra', 'new year', 'independence'].includes(k.toLowerCase())) || 'Holiday';
      const dateInfo = analysis.dates.length > 0 ? analysis.dates[0] : '[Date]';
      const holidayType = holidayName.toLowerCase();
      
      let holidayDescription = '';
      let culturalContext = '';
      let celebrationDetails = '';
      
      if (holidayType === 'diwali') {
        holidayDescription = 'Diwali, also known as the Festival of Lights, is one of the most significant festivals in Hindu culture, symbolizing the victory of light over darkness and good over evil.';
        culturalContext = 'This auspicious occasion is celebrated with great enthusiasm across India and by Indian communities worldwide.';
        celebrationDetails = 'Traditional celebrations include lighting diyas (oil lamps), decorating homes with rangoli, exchanging sweets and gifts, and performing Lakshmi Puja to seek blessings for prosperity and success.';
      } else if (holidayType === 'christmas') {
        holidayDescription = 'Christmas is a Christian holiday commemorating the birth of Jesus Christ, celebrated by millions of people around the world with great joy and festivity.';
        culturalContext = 'This holy day represents peace, love, and the spirit of giving, bringing families and communities together in celebration.';
        celebrationDetails = 'Traditional celebrations include decorating Christmas trees, exchanging gifts, attending church services, singing carols, and sharing special meals with family and friends.';
      } else if (holidayType === 'eid') {
        holidayDescription = 'Eid is a significant Islamic festival that marks the end of Ramadan, the holy month of fasting, and is celebrated with great joy and thanksgiving.';
        culturalContext = 'This blessed occasion emphasizes gratitude, charity, and community bonding among Muslims worldwide.';
        celebrationDetails = 'Traditional celebrations include special prayers at mosques, wearing new clothes, giving charity (Zakat), sharing festive meals, and visiting family and friends.';
      } else {
        holidayDescription = `${holidayName.charAt(0).toUpperCase() + holidayName.slice(1)} is a significant cultural and religious celebration that holds great importance in our diverse community.`;
        culturalContext = 'This special occasion brings people together to celebrate our shared values and cultural heritage.';
        celebrationDetails = 'Traditional celebrations include various cultural activities, community gatherings, and special observances that reflect the rich traditions associated with this festival.';
      }
      
      return `
        <p style="margin-top: 15px;"><strong>Holiday Notice - ${holidayName.charAt(0).toUpperCase() + holidayName.slice(1)} Celebration</strong></p>
        <p>We are pleased to inform you that our institution will observe a holiday on <strong>${dateInfo}</strong> in celebration of ${holidayName.charAt(0).toUpperCase() + holidayName.slice(1)}. ${holidayDescription} ${culturalContext}</p>
        
        <p><strong>Holiday Details and Significance:</strong></p>
        <ul>
          <li><strong>Holiday Date:</strong> ${dateInfo}</li>
          <li><strong>Celebration Reason:</strong> ${holidayName.charAt(0).toUpperCase() + holidayName.slice(1)} Festival</li>
          <li><strong>Institution Status:</strong> Completely Closed</li>
          <li><strong>Duration:</strong> Full Day Holiday</li>
          <li><strong>Emergency Contact:</strong> [Emergency Contact Information]</li>
          <li><strong>Security Services:</strong> Available for emergency situations only</li>
        </ul>
        
        <p><strong>Academic and Administrative Impact:</strong></p>
        <p>All academic activities including regular classes, laboratory sessions, tutorials, and practical examinations are suspended for this holiday period. Administrative offices, library services, computer centers, and all student support facilities will remain closed. Faculty members are advised to reschedule any planned academic activities to ensure continuity of the academic calendar. Students should utilize this time for personal study and family bonding while maintaining academic discipline.</p>
        
        <p><strong>Important Guidelines and Instructions:</strong></p>
        <p>All students are required to complete any pending assignments, projects, or academic submissions before the holiday begins. Faculty members should coordinate with their respective departments to ensure all academic records are properly maintained. Research activities that require continuous monitoring should be appropriately paused with necessary safety measures. Students residing in hostels are advised to inform the hostel administration about their travel plans during the holiday period.</p>
        
        <p><strong>Safety and Security Measures:</strong></p>
        <p>The institution's security team will maintain minimal staffing to ensure campus security and respond to any emergency situations. All buildings will be locked and secured during the holiday period. Students and staff are advised not to visit the campus during the holiday unless absolutely necessary. Any emergency situations should be immediately reported to the security office through the designated emergency contact numbers.</p>
        
        <p><strong>Cultural Significance and Celebrations:</strong></p>
        <p>${celebrationDetails} This holiday provides an excellent opportunity for our diverse community to come together and celebrate our cultural heritage. We encourage all members of our institution to participate in community celebrations while maintaining the values of respect, tolerance, and unity that our institution promotes.</p>
        
        <p><strong>Post-Holiday Resumption:</strong></p>
        <p>Regular academic and administrative operations will resume on the next working day following the holiday. All faculty members and students are expected to return to their regular schedules promptly. Any changes to the academic calendar will be communicated through official channels. Students are advised to check the institution's website and notice boards for any updates regarding schedule changes or important announcements.</p>
        
        <p><strong>Festive Wishes and Community Spirit:</strong></p>
        <p>We extend our warmest wishes and heartfelt greetings to all students, faculty, staff, and their families for a joyful, peaceful, and prosperous ${holidayName} celebration. May this festive season bring you happiness, good health, and continued success in all your endeavors. Let us use this opportunity to strengthen our bonds of friendship and community spirit that make our institution a truly special place to learn and grow.</p>
        
        <p><strong>Contact Information and Support:</strong></p>
        <p>For any queries, concerns, or emergency situations related to this holiday notice, please contact the administration office during regular working hours. The student affairs office and faculty coordinators are available to provide guidance and support as needed. We wish everyone a safe and enjoyable holiday celebration.</p>
      `;
    };
    
    // Generate meeting-specific content
    const generateMeetingContent = (analysis) => {
      const dateInfo = analysis.dates.length > 0 ? analysis.dates[0] : '[Meeting Date]';
      const timeInfo = analysis.time || '[Meeting Time]';
      const locationInfo = analysis.location || '[Meeting Location]';
      
      return `
        <p style="margin-top: 15px;"><strong>Meeting Notice</strong></p>
        <p>This official notice serves to inform all concerned faculty members, department heads, and administrative staff about an upcoming important meeting that has been scheduled to discuss critical academic and administrative matters. The meeting is mandatory for all invited participants and requires your active participation and contribution to ensure effective decision-making and planning for our institution's continued growth and excellence.</p>
        
        <p><strong>Meeting Details and Schedule:</strong></p>
        <ul>
          <li><strong>Meeting Date:</strong> ${dateInfo}</li>
          <li><strong>Scheduled Time:</strong> ${timeInfo}</li>
          <li><strong>Meeting Venue:</strong> ${locationInfo}</li>
          <li><strong>Expected Duration:</strong> [2-3 Hours]</li>
          <li><strong>Meeting Type:</strong> Departmental/Institutional Meeting</li>
          <li><strong>Attendance:</strong> Mandatory for all invited participants</li>
        </ul>
        
        <p><strong>Comprehensive Agenda Items:</strong></p>
        <ul>
          <li><strong>Welcome and Introduction:</strong> Opening remarks and meeting objectives</li>
          <li><strong>Review of Previous Minutes:</strong> Discussion and approval of previous meeting minutes</li>
          <li><strong>Academic Planning:</strong> ${purpose || 'Discussion of important academic matters including curriculum updates, semester planning, and academic calendar adjustments'}</li>
          <li><strong>Departmental Updates:</strong> Reports from various departments on ongoing activities and achievements</li>
          <li><strong>Student Affairs:</strong> Discussion on student welfare, academic support, and extracurricular activities</li>
          <li><strong>Infrastructure and Resources:</strong> Updates on campus facilities, equipment, and resource allocation</li>
          <li><strong>Faculty Development:</strong> Training programs, professional development opportunities, and research initiatives</li>
          <li><strong>Administrative Matters:</strong> Policy updates, compliance requirements, and administrative procedures</li>
          <li><strong>Budget and Financial Planning:</strong> Discussion on budget allocation, funding opportunities, and financial management</li>
          <li><strong>Future Planning:</strong> Strategic planning, upcoming events, and long-term institutional goals</li>
          <li><strong>Open Discussion:</strong> Any other business and open floor for suggestions and feedback</li>
        </ul>
        
        <p><strong>Preparation Requirements and Expectations:</strong></p>
        <p>All attendees are expected to come fully prepared for this important meeting. Please review all agenda items thoroughly and bring any necessary documents, reports, or materials relevant to the discussions. Faculty members should prepare updates on their respective departments, ongoing projects, and any challenges or opportunities they wish to discuss. Department heads are requested to compile comprehensive reports on their department's performance, achievements, and future plans. Please ensure that all relevant data, statistics, and supporting documents are organized and ready for presentation.</p>
        
        <p><strong>Documentation and Reporting:</strong></p>
        <p>All participants should bring copies of relevant reports, proposals, budget requests, and any other documentation that may be required for discussion. Please ensure that all documents are properly formatted and contain accurate, up-to-date information. Any presentations or proposals should be prepared in advance and shared with the meeting coordinator to ensure smooth proceedings. Digital copies of all materials should also be prepared for distribution if needed.</p>
        
        <p><strong>Attendance Confirmation and Logistics:</strong></p>
        <p>Kindly confirm your attendance by [Confirmation Deadline] to ensure proper meeting arrangements and catering services. If you are unable to attend due to unavoidable circumstances, please inform the organizing committee well in advance and arrange for a suitable representative to attend on your behalf. Late confirmations may not be accommodated due to logistical constraints. Please arrive 10 minutes before the scheduled time to allow for proper seating arrangements and distribution of meeting materials.</p>
        
        <p><strong>Meeting Conduct and Participation:</strong></p>
        <p>All participants are expected to maintain professional conduct throughout the meeting. Active participation, constructive contributions, and respectful dialogue are essential for productive discussions. Please ensure that mobile phones are switched to silent mode and avoid unnecessary interruptions. The meeting will follow a structured format to ensure that all agenda items are adequately covered within the allocated time. Participants are encouraged to take notes and ask relevant questions during the designated discussion periods.</p>
        
        <p><strong>Follow-up Actions and Implementation:</strong></p>
        <p>Following the meeting, detailed minutes will be prepared and circulated to all participants within 48 hours. All decisions made during the meeting will be documented and action items will be assigned to relevant individuals or departments. Regular follow-up meetings may be scheduled to monitor progress on action items and ensure timely implementation of decisions. Participants are expected to take responsibility for their assigned action items and provide regular updates on progress.</p>
        
        <p><strong>Contact Information and Support:</strong></p>
        <p>For any queries regarding this meeting, agenda items, preparation requirements, or logistical arrangements, please contact the meeting coordinator at [Contact Details]. The administrative office is available to provide additional information and support as needed. We look forward to your active participation and valuable contributions to this important meeting that will help shape the future direction of our institution.</p>
      `;
    };
    
    // Generate exam-specific content
    const generateExamContent = (analysis) => {
      const dateInfo = analysis.dates.length > 0 ? analysis.dates[0] : '[Exam Date]';
      const timeInfo = analysis.time || '[Exam Time]';
      const examType = purpose || 'Mid-Semester Examination';
      
      return `
        <p style="margin-top: 15px;"><strong>Examination Notice</strong></p>
        <p>This official notice serves to inform all enrolled students about the upcoming ${examType} that has been scheduled as part of our academic calendar. The examination is a crucial component of the academic assessment process and requires careful preparation and adherence to all examination protocols. All students are expected to participate in this examination as per the institutional guidelines and academic requirements.</p>
        
        <p><strong>Comprehensive Examination Details:</strong></p>
        <ul>
          <li><strong>Examination Type:</strong> ${examType}</li>
          <li><strong>Examination Date:</strong> ${dateInfo}</li>
          <li><strong>Reporting Time:</strong> ${timeInfo}</li>
          <li><strong>Examination Duration:</strong> [3 Hours]</li>
          <li><strong>Examination Venue:</strong> ${location || '[Main Examination Hall]'}</li>
          <li><strong>Subject/Course:</strong> [Course Name and Code]</li>
          <li><strong>Maximum Marks:</strong> [Total Marks]</li>
          <li><strong>Examination Pattern:</strong> [Objective/Subjective/Mixed]</li>
        </ul>
        
        <p><strong>Mandatory Examination Guidelines and Rules:</strong></p>
        <ul>
          <li><strong>Reporting Time:</strong> Students must report to the examination hall 30 minutes before the scheduled examination time for verification and seating arrangements</li>
          <li><strong>Identity Verification:</strong> Valid student ID card is mandatory for entry and must be presented to the invigilator upon request</li>
          <li><strong>Prohibited Items:</strong> No electronic devices including mobile phones, calculators (unless specified), smartwatches, or any other electronic equipment are allowed</li>
          <li><strong>Examination Materials:</strong> Only authorized materials as specified by the course instructor are permitted</li>
          <li><strong>Dress Code:</strong> Students must maintain appropriate dress code as per institutional standards</li>
          <li><strong>Late Entry Policy:</strong> Late entry will not be permitted after the examination commences</li>
          <li><strong>Early Departure:</strong> Students cannot leave the examination hall before completing 1 hour of examination time</li>
          <li><strong>Answer Script Handling:</strong> All answer scripts must be submitted to the invigilator before leaving the hall</li>
        </ul>
        
        <p><strong>Academic Preparation and Study Guidelines:</strong></p>
        <p>Students are strongly advised to begin comprehensive preparation well in advance of the examination date. Review all course materials, textbooks, lecture notes, and supplementary resources provided by the faculty. Focus on understanding key concepts, theories, and practical applications covered throughout the semester. Practice previous years' question papers and sample papers to familiarize yourself with the examination pattern and time management. Attend all revision classes and doubt-clearing sessions conducted by the faculty members. Form study groups with classmates for collaborative learning and knowledge sharing.</p>
        
        <p><strong>Examination Day Preparations:</strong></p>
        <p>On the day of examination, ensure you have had adequate rest and arrive at the examination venue well before the reporting time. Bring all necessary stationery including pens, pencils, erasers, and any other authorized materials. Double-check your student ID card and ensure it is valid and clearly readable. Maintain a calm and focused mindset throughout the examination. Read all questions carefully before attempting to answer and manage your time effectively to complete all sections.</p>
        
        <p><strong>Health and Safety Protocols:</strong></p>
        <p>Students who are feeling unwell or experiencing any health issues should inform the examination department immediately. Medical certificates will be required for any absence due to health reasons. Students with special needs or disabilities should contact the examination department in advance to arrange for appropriate accommodations. All students must follow the institution's health and safety guidelines during the examination period.</p>
        
        <p><strong>Academic Integrity and Examination Conduct:</strong></p>
        <p>All students must maintain the highest standards of academic integrity during the examination. Any form of malpractice, including cheating, copying, or unauthorized assistance, will result in severe disciplinary action as per the institutional academic integrity policy. Students are expected to maintain silence and focus on their own work throughout the examination duration. Any suspicious behavior will be reported to the examination committee for appropriate action.</p>
        
        <p><strong>Post-Examination Procedures:</strong></p>
        <p>After the examination, students should submit their answer scripts to the invigilator and ensure all pages are properly secured. Results will be announced as per the academic calendar and will be available through the student portal. Students who have concerns about their performance or need clarification on any aspect of the examination should contact their course instructor or the examination department within the specified timeframe.</p>
        
        <p><strong>Support and Assistance:</strong></p>
        <p>The examination department is available to provide guidance and support to all students throughout the examination process. Faculty members are available during office hours to clarify doubts and provide academic support. The student counseling center offers stress management and examination anxiety support for students who may need assistance. For any technical issues or special requirements, please contact the examination department well in advance.</p>
        
        <p><strong>Contact Information and Queries:</strong></p>
        <p>For any queries regarding the examination schedule, rules, accommodations, or any other examination-related matters, please contact the examination department at [Contact Details]. The department operates during regular working hours and is committed to providing prompt assistance to all students. We wish all students the best for their examination preparation and performance.</p>
      `;
    };
    
    // Generate event-specific content
    const generateEventContent = (analysis) => {
      const dateInfo = analysis.dates.length > 0 ? analysis.dates[0] : '[Event Date]';
      const timeInfo = analysis.time || '[Event Time]';
      const eventName = purpose || 'Special Event';
      
      return `
        <p style="margin-top: 20px;"><strong>Event Announcement</strong></p>
        <p>We are excited to announce the upcoming ${eventName} that promises to be an enriching experience for all participants.</p>
        
        <p><strong>Event Details:</strong></p>
        <ul>
          <li><strong>Event Name:</strong> ${eventName}</li>
          <li><strong>Date:</strong> ${dateInfo}</li>
          <li><strong>Time:</strong> ${timeInfo}</li>
          <li><strong>Venue:</strong> ${location || '[Event Venue]'}</li>
          <li><strong>Duration:</strong> [Event Duration]</li>
        </ul>
        
        <p><strong>Event Highlights:</strong></p>
        <ul>
          <li>Interactive sessions and workshops</li>
          <li>Expert speakers and industry professionals</li>
          <li>Networking opportunities</li>
          <li>Cultural performances and entertainment</li>
          <li>Refreshments and certificates of participation</li>
        </ul>
        
        <p><strong>Registration Information:</strong></p>
        <p>Interested participants are requested to register for the event by [Registration Deadline]. Registration can be completed through [Registration Process]. Limited seats are available, so early registration is recommended.</p>
        
        <p><strong>Participation Guidelines:</strong></p>
        <p>All participants are expected to maintain decorum and follow the event guidelines. Dress code and other requirements will be communicated closer to the event date.</p>
        
        <p><strong>Contact Information:</strong></p>
        <p>For registration and event-related queries, please contact the event organizing committee at [Contact Details].</p>
      `;
    };
    
    // Generate letter-specific content
    const generateLetterContent = (analysis) => {
      return `
        <p style="margin-top: 20px;">Dear ${recipient || '[Recipient Name]'},</p>
        
        <p>I hope this letter finds you in good health and spirits. I am writing to ${purpose || 'communicate important information'}.</p>
        
        <p><strong>Purpose of Communication:</strong></p>
        <p>${purpose || 'This letter addresses important matters that require your attention and response.'}</p>
        
        <p><strong>Details and Information:</strong></p>
        <p>Please find below the comprehensive details regarding the subject matter:</p>
        <ul>
          <li>Detailed explanation of the current situation</li>
          <li>Relevant background information and context</li>
          <li>Proposed actions and next steps</li>
          <li>Timeline and important deadlines</li>
        </ul>
        
        <p><strong>Required Actions:</strong></p>
        <p>Please review the information provided and take the necessary actions as outlined. If you have any questions or require additional clarification, please do not hesitate to contact us.</p>
        
        <p><strong>Response Required:</strong></p>
        <p>We would appreciate your response by [Response Deadline] to ensure timely processing of the matter.</p>
        
        <p>Thank you for your attention to this matter. We look forward to your cooperation and response.</p>
        
        <p style="margin-top: 30px;">Yours sincerely,</p>
      `;
    };
    
    // Generate policy-specific content
    const generatePolicyContent = (analysis) => {
      return `
        <p style="margin-top: 20px;"><strong>Policy Announcement</strong></p>
        <p>We are pleased to announce the implementation of a new policy regarding ${purpose || 'important institutional matters'}.</p>
        
        <p><strong>Policy Overview:</strong></p>
        <p>This policy has been developed to ensure better governance, improved processes, and enhanced experience for all stakeholders.</p>
        
        <p><strong>Key Policy Points:</strong></p>
        <ul>
          <li>Clear guidelines and procedures</li>
          <li>Standardized processes for consistency</li>
          <li>Compliance requirements and expectations</li>
          <li>Monitoring and evaluation mechanisms</li>
          <li>Review and update procedures</li>
        </ul>
        
        <p><strong>Implementation Timeline:</strong></p>
        <p>The policy will be implemented effective from [Effective Date]. All stakeholders are expected to comply with the new guidelines from this date onwards.</p>
        
        <p><strong>Training and Support:</strong></p>
        <p>Training sessions will be conducted to familiarize all stakeholders with the new policy. Support materials and resources will be made available to ensure smooth implementation.</p>
        
        <p><strong>Compliance Requirements:</strong></p>
        <p>All members of the institution are expected to adhere to this policy. Non-compliance may result in appropriate disciplinary actions as outlined in the institutional guidelines.</p>
        
        <p><strong>Contact Information:</strong></p>
        <p>For any questions or clarifications regarding this policy, please contact the policy implementation team at [Contact Details].</p>
      `;
    };
    
    // Generate general notice content
    const generateNoticeContent = (analysis) => {
      return `
        <p style="margin-top: 15px;"><strong>Notice Details</strong></p>
        <p>This official notice is being issued to inform all concerned students, faculty members, and staff about ${purpose || 'important institutional matters that require immediate attention and action'}. The information contained in this notice is of significant importance and affects the smooth functioning of our academic and administrative operations. All recipients are expected to read this notice carefully and take appropriate action as required.</p>
        
        <p><strong>Background Information and Context:</strong></p>
        <p>The following comprehensive information is provided to ensure all concerned parties have a thorough understanding of the subject matter, its implications, and the necessary actions to be taken. This notice addresses critical aspects of our institutional operations and requires immediate attention from all stakeholders. The matter has been carefully reviewed by the relevant authorities and the information provided here represents the official position of the institution on this subject.</p>
        
        <p><strong>Detailed Information and Key Points:</strong></p>
        <ul>
          <li><strong>Primary Objective:</strong> Comprehensive explanation of the main purpose and objectives of this notice</li>
          <li><strong>Scope and Applicability:</strong> Detailed information about who this notice applies to and under what circumstances</li>
          <li><strong>Relevant Context and Background:</strong> Historical context and background information that provides clarity on the current situation</li>
          <li><strong>Important Dates and Deadlines:</strong> Critical timeline information including start dates, deadlines, and important milestones</li>
          <li><strong>Required Actions and Responsibilities:</strong> Specific actions that need to be taken by different stakeholders</li>
          <li><strong>Compliance Requirements:</strong> Mandatory compliance requirements and expectations from all parties</li>
          <li><strong>Implementation Guidelines:</strong> Step-by-step guidelines for proper implementation of the requirements</li>
          <li><strong>Contact Information and Support:</strong> Detailed contact information for queries and support</li>
        </ul>
        
        <p><strong>Mandatory Instructions and Compliance Requirements:</strong></p>
        <p>All concerned parties are required to review the contents of this notice thoroughly and take immediate action as outlined. Non-compliance with the instructions provided in this notice may result in disciplinary action as per institutional policies. Students, faculty members, and staff are expected to adhere to all requirements and guidelines specified in this notice. Any deviations from the prescribed procedures must be approved by the appropriate authorities in advance.</p>
        
        <p><strong>Implementation Timeline and Deadlines:</strong></p>
        <p>Please note the following critical timeline for implementation and completion of all required actions: [Timeline Information]. Strict adherence to the specified timeline is essential for maintaining smooth institutional operations and ensuring that all stakeholders are properly informed and prepared. Any delays in implementation may affect other scheduled activities and cause inconvenience to the entire community. All parties are advised to plan their activities accordingly and ensure timely completion of all required tasks.</p>
        
        <p><strong>Quality Assurance and Monitoring:</strong></p>
        <p>The implementation of this notice will be closely monitored by the relevant departments to ensure compliance and effectiveness. Regular progress reports will be required from all concerned parties, and any issues or challenges encountered during implementation should be immediately reported to the designated authorities. The institution is committed to providing all necessary support and resources to ensure successful implementation of the requirements outlined in this notice.</p>
        
        <p><strong>Support and Assistance:</strong></p>
        <p>Comprehensive support and assistance are available to all stakeholders throughout the implementation process. The relevant departments have been instructed to provide detailed guidance and clarification on any aspect of this notice. Training sessions, workshops, or information sessions may be conducted as needed to ensure proper understanding and implementation. All queries and concerns will be addressed promptly to ensure smooth execution of the requirements.</p>
        
        <p><strong>Additional Resources and Information:</strong></p>
        <p>Additional resources, documentation, and reference materials related to this notice are available through the institutional website, notice boards, and relevant departments. Students and staff are encouraged to access these resources for comprehensive understanding of the subject matter. Regular updates and amendments, if any, will be communicated through official channels. All stakeholders are advised to stay informed about any changes or developments related to this notice.</p>
        
        <p><strong>Conclusion and Commitment:</strong></p>
        <p>We trust that this comprehensive notice provides all necessary information and guidance for successful implementation of the required actions. The institution is committed to maintaining the highest standards of communication, transparency, and efficiency in all its operations. We look forward to the cooperation and support of all stakeholders in implementing the requirements outlined in this notice and contributing to the continued success and growth of our institution.</p>
      `;
    };
    
    // Generate the complete document
    const title = getTitle();
    const mainContent = generateMainContent();
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `<div style="font-family: Times New Roman, serif; line-height: 1.5; color: #000;">
      <h2 style="text-align: center; margin-bottom: 20px;"><strong>${title}</strong></h2>
      
      <p><strong>Date:</strong> ${analysis.dates.length > 0 ? analysis.dates[0] : currentDate}</p>
      <p><strong>To:</strong> ${recipient || '[Recipient Information]'}</p>
      <p><strong>From:</strong> ${sender || '[Sender Information]'}</p>
      <p><strong>Subject:</strong> ${subject || purpose || '[Document Subject]'}</p>
      
      ${mainContent}
      
      <div style="margin-top: 25px;">
        <p><strong>${sender || '[Sender Information]'}</strong></p>
        <p>[Sender Title]</p>
        <p>[Organization Name]</p>
        <p>[Contact Information]</p>
      </div>
    </div>`;
  };
  
  // Generate content using the new intelligent system
  return generateDocumentContent(analysis);
};

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
    
    // Store original prompt for local fallback
    const originalPrompt = prompt;

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
        formattedPrompt = `Create a comprehensive, professional template based on this request: "${prompt}"

IMPORTANT INSTRUCTIONS:
1. Analyze the request carefully and identify the document type (notice, letter, memo, etc.)
2. Create detailed, relevant content that matches the specific request
3. Make the content substantial and informative - at least 300-500 words
4. Include all necessary sections and details for the document type
5. Use specific information from the request (dates, names, purposes, etc.)

FORMATTING REQUIREMENTS:
- Use <strong> for bold text instead of **
- Use <em> for italic text instead of *
- Use <h1>, <h2>, <h3> for headers
- Use <ul> and <li> for lists
- Use <p> for paragraphs
- Professional document structure
- Clear sections with proper spacing
- Include placeholders in [brackets] for customization
- Maintain proper spacing and readability
- Do not include any header text or titles, only the main content

CONTENT REQUIREMENTS:
- Be specific and detailed based on the request
- Include relevant dates, names, and context mentioned in the prompt
- Create comprehensive content that would be useful for the intended purpose
- Make it professional and well-structured
- Ensure the content directly addresses what was requested

Make sure the template is well-structured, comprehensive, and directly relevant to the request.`;
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
        formattedPrompt = `Create a comprehensive, professional document based on this request: "${prompt}"

ANALYSIS REQUIRED:
1. Identify what type of document is being requested
2. Extract key information (dates, names, purposes, etc.)
3. Create detailed, relevant content that matches the request
4. Make the content substantial and informative

FORMATTING REQUIREMENTS:
- Use <strong> for bold text instead of **
- Use <em> for italic text instead of *
- Use <h1>, <h2>, <h3> for headers
- Use <ul> and <li> for lists
- Use <p> for paragraphs
- Professional document structure
- Clear sections with proper spacing
- Include placeholders in [brackets] for customization
- Maintain proper spacing and readability
- Do not include any header text or titles, only the main content

CONTENT REQUIREMENTS:
- Be specific and detailed based on the request
- Include relevant dates, names, and context mentioned in the prompt
- Create comprehensive content that would be useful for the intended purpose
- Make it professional and well-structured
- Ensure the content directly addresses what was requested
- Minimum 300-500 words for substantial content

Make sure the document is well-structured, comprehensive, and directly relevant to the request.`;
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
        
        // Fall back to local content generation instead of throwing error
        console.log('Falling back to local content generation...');
        
        const localGeneratedText = generateLocalContent(originalPrompt, type);
        
        return res.status(200).json({
          success: true,
          data: {
            generated_text: localGeneratedText,
            source: 'local_fallback'
          },
        });
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
        
        // Fall back to local content generation
        console.log('Falling back to local content generation...');
        
        const localGeneratedText = generateLocalContent(originalPrompt, type);
        
        return res.status(200).json({
          success: true,
          data: {
            generated_text: localGeneratedText,
            source: 'local_fallback'
          },
        });
      }
    } else if (process.env.OLLAMA_API_URL) {
      // Use local Ollama model
      try {
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
      } catch (ollamaError) {
        console.error('Ollama API error:', ollamaError.response?.data || ollamaError.message);
        
        // Fall back to local content generation
        console.log('Falling back to local content generation...');
        
        const localGeneratedText = generateLocalContent(originalPrompt, type);
        
        return res.status(200).json({
          success: true,
          data: {
            generated_text: localGeneratedText,
            source: 'local_fallback'
          },
        });
      }
    } else {
      // No AI model configured - use local fallback
      console.log('No external AI model configured, using local content generation...');
      
      const localGeneratedText = generateLocalContent(originalPrompt, type);
      
      return res.status(200).json({
        success: true,
        data: {
          generated_text: localGeneratedText,
          source: 'local_fallback'
        },
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