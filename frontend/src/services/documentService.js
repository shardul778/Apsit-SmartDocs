import axios from 'axios';

const API_URL = '/api/documents';

// Get all documents with optional filters
export const getDocuments = async (filters = {}) => {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.department) queryParams.append('department', filters.department);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);
  
  const queryString = queryParams.toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;
  
  const response = await axios.get(url);
  return response.data;
};

// Get document by ID
export const getDocumentById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Create document
export const createDocument = async (documentData) => {
  const response = await axios.post(API_URL, documentData);
  return response.data;
};

// Update document
export const updateDocument = async (id, documentData) => {
  const response = await axios.put(`${API_URL}/${id}`, documentData);
  return response.data;
};

// Delete document
export const deleteDocument = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

// Submit document for approval
export const submitDocument = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/submit`);
  return response.data;
};

// Approve document (admin only)
export const approveDocument = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/approve`);
  return response.data;
};

// Reject document (admin only)
export const rejectDocument = async (id, reason) => {
  const response = await axios.put(`${API_URL}/${id}/reject`, { reason });
  return response.data;
};

// Generate PDF
export const generatePDF = async (id) => {
  const response = await axios.post(`${API_URL}/${id}/pdf`);
  return response.data;
};