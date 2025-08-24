import axios from './axiosConfig';

const API_URL = '/api/templates';

// Helper function to map MongoDB _id to id for frontend compatibility
const mapTemplateData = (template) => {
  if (template._id) {
    return { ...template, id: template._id };
  }
  return template;
};

// Helper function to map array of templates
const mapTemplatesData = (templates) => {
  return templates.map(mapTemplateData);
};

// Get all templates
export const getTemplates = async (category) => {
  const url = category ? `${API_URL}?category=${category}` : API_URL;
  const response = await axios.get(url);
  return mapTemplatesData(response.data.data); // Map and return templates
};

// Get template by ID
export const getTemplateById = async (id) => {
  console.log('TemplateService: Fetching template with ID:', id);
  const response = await axios.get(`${API_URL}/${id}`);
  console.log('TemplateService: Raw response:', response.data);
  const mappedTemplate = mapTemplateData(response.data.data);
  console.log('TemplateService: Mapped template:', mappedTemplate);
  return mappedTemplate; // Map and return template
};

// Create template
export const createTemplate = async (templateData) => {
  console.log('TemplateService: Creating template with data:', templateData);
  const response = await axios.post(API_URL, templateData);
  console.log('TemplateService: Create response:', response.data);
  const mappedTemplate = mapTemplateData(response.data.data);
  console.log('TemplateService: Mapped created template:', mappedTemplate);
  return mappedTemplate; // Map and return template
};

// Update template
export const updateTemplate = async (id, templateData) => {
  const response = await axios.put(`${API_URL}/${id}`, templateData);
  return mapTemplateData(response.data.data); // Map and return template
};

// Delete template
export const deleteTemplate = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data.data; // Extract the template data from the response
};

// Upload template logo
export const uploadTemplateLogo = async (id, file) => {
  const formData = new FormData();
  formData.append('logo', file);
  
  const response = await axios.put(`${API_URL}/${id}/logo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return mapTemplateData(response.data.data); // Map and return template
};

// Get template categories
export const getTemplateCategories = async () => {
  const response = await axios.get(`${API_URL}/categories`);
  return response.data.data; // Extract the categories array from the response
};