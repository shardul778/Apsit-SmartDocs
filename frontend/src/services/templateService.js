import axios from 'axios';

const API_URL = '/api/templates';

// Get all templates
export const getTemplates = async (category) => {
  const url = category ? `${API_URL}?category=${category}` : API_URL;
  const response = await axios.get(url);
  return response.data.data; // Extract the templates array from the response
};

// Get template by ID
export const getTemplateById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data.data; // Extract the template data from the response
};

// Create template
export const createTemplate = async (templateData) => {
  const response = await axios.post(API_URL, templateData);
  return response.data.data; // Extract the template data from the response
};

// Update template
export const updateTemplate = async (id, templateData) => {
  const response = await axios.put(`${API_URL}/${id}`, templateData);
  return response.data.data; // Extract the template data from the response
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
  
  return response.data.data; // Extract the template data from the response
};

// Get template categories
export const getTemplateCategories = async () => {
  const response = await axios.get(`${API_URL}/categories`);
  return response.data.data; // Extract the categories array from the response
};