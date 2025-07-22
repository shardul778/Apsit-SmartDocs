import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Main Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Document Pages
import DocumentList from './pages/documents/DocumentList';
import DocumentCreate from './pages/documents/DocumentCreate';
import DocumentEdit from './pages/documents/DocumentEdit';
import DocumentView from './pages/documents/DocumentView';

// Template Pages
import TemplateList from './pages/templates/TemplateList';
import TemplateCreate from './pages/templates/TemplateCreate';
import TemplateEdit from './pages/templates/TemplateEdit';

// User Pages
import UserList from './pages/users/UserList';
import UserCreate from './pages/users/UserCreate';
import UserEdit from './pages/users/UserEdit';

// Other Pages
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="App">
      <CssBaseline />
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
        </Route>
        
        {/* Main Routes */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Document Routes */}
          <Route path="/documents" element={<DocumentList />} />
          <Route path="/documents/create" element={<DocumentCreate />} />
          <Route path="/documents/:id" element={<DocumentView />} />
          <Route path="/documents/:id/edit" element={<DocumentEdit />} />
          
          {/* Template Routes - Admin Only */}
          <Route path="/templates" element={
            <ProtectedRoute requiredRole="admin">
              <TemplateList />
            </ProtectedRoute>
          } />
          <Route path="/templates/create" element={
            <ProtectedRoute requiredRole="admin">
              <TemplateCreate />
            </ProtectedRoute>
          } />
          <Route path="/templates/:id/edit" element={
            <ProtectedRoute requiredRole="admin">
              <TemplateEdit />
            </ProtectedRoute>
          } />
          
          {/* User Routes - Admin Only */}
          <Route path="/users" element={
            <ProtectedRoute requiredRole="admin">
              <UserList />
            </ProtectedRoute>
          } />
          <Route path="/users/create" element={
            <ProtectedRoute requiredRole="admin">
              <UserCreate />
            </ProtectedRoute>
          } />
          <Route path="/users/:id/edit" element={
            <ProtectedRoute requiredRole="admin">
              <UserEdit />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;