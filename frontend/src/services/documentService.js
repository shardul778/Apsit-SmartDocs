import axios from './axiosConfig';

const API_URL = '/api/documents';

// Normalize backend document shape to always have id
const mapDocument = (doc) => {
  if (!doc) return doc;
  if (doc.id) return doc;
  if (doc._id) return { ...doc, id: doc._id };
  return doc;
};

// Build payload matching backend expectations
const buildPayload = (data = {}) => {
  const payload = {
    title: data.title,
    templateId: data.templateId,
    content: typeof data.content === 'string' ? { body: data.content } : (data.content || {}),
    metadata: {
      category: data.category || undefined,
      department: data.department || undefined,
    },
  };
  return payload;
};

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
  const docs = (response.data.data || []).map(mapDocument);
  return {
    documents: docs,
    totalCount: response.data.total || 0,
    pagination: response.data.pagination || { page: 1, limit: 10, pages: 1 }
  };
};

// Get document by ID
export const getDocumentById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return mapDocument(response.data.data || {});
};

// Create document
export const createDocument = async (documentData) => {
  const payload = buildPayload(documentData);
  const response = await axios.post(API_URL, payload);
  return mapDocument(response.data.data || {});
};

// Update document
export const updateDocument = async (id, documentData) => {
  const payload = buildPayload(documentData);
  const response = await axios.put(`${API_URL}/${id}`, payload);
  return mapDocument(response.data.data || {});
};

// Delete document
export const deleteDocument = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data.data || {};
};

// Submit document for approval
export const submitDocument = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/submit`);
  return mapDocument(response.data.data || {});
};

// Approve document (admin only)
export const approveDocument = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/approve`);
  return mapDocument(response.data.data || {});
};

// Reject document (admin only)
export const rejectDocument = async (id, reason) => {
  const response = await axios.put(`${API_URL}/${id}/reject`, { reason });
  return mapDocument(response.data.data || {});
};

// Generate PDF
export const generatePDF = async (id) => {
  const response = await axios.post(`${API_URL}/${id}/pdf`);
  const relativeUrl = response.data.pdfUrl || null;
  if (!relativeUrl) return null;
  // Ensure absolute URL so the app doesn't route to SPA 404
  const base = (axios.defaults.baseURL || '').replace(/\/$/, '');
  return `${base}${relativeUrl}`;
};

// Upload attachment to document
export const uploadAttachment = async (id, file) => {
  const formData = new FormData();
  formData.append('attachment', file);
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };
  
  const response = await axios.post(`${API_URL}/${id}/attachments`, formData, config);
  return response.data.data || {};
};

// Delete attachment from document
export const deleteAttachment = async (documentId, attachmentId) => {
  const response = await axios.delete(`${API_URL}/${documentId}/attachments/${attachmentId}`);
  return response.data || {};
};

// Download a file (PDF) by URL and trigger browser download
export const downloadFile = async (url, filename = 'document.pdf') => {
  if (!url) return;
  const response = await axios.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};