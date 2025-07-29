import axios from 'axios';

const API_URL = '/api/users';

// Get all users (admin only)
export const getUsers = async (filters = {}) => {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  
  if (filters.role) queryParams.append('role', filters.role);
  if (filters.department) queryParams.append('department', filters.department);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);
  
  const queryString = queryParams.toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;
  
  const response = await axios.get(url);
  return {
    users: response.data.data,
    totalCount: response.data.total
  };
};

// Get user by ID (admin only)
export const getUserById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Create user (admin only)
export const createUser = async (userData) => {
  const response = await axios.post(API_URL, userData);
  return response.data;
};

// Update user (admin only)
export const updateUser = async (id, userData) => {
  const response = await axios.put(`${API_URL}/${id}`, userData);
  return response.data;
};

// Delete user (admin only)
export const deleteUser = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

// Update user role (admin only)
export const updateUserRole = async (id, role) => {
  const response = await axios.put(`${API_URL}/${id}/role`, { role });
  return response.data;
};