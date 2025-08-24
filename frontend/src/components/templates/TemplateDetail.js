import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { templateService } from '../../services';
import { PageHeader, LoadingSpinner, ConfirmDialog, AlertMessage } from '../common';

const TemplateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch template details
  const fetchTemplate = async () => {
    setLoading(true);
    try {
      console.log('Fetching template with ID:', id);
      const data = await templateService.getTemplateById(id);
      console.log('Fetched template data:', data);
      setTemplate(data);
    } catch (error) {
      console.error('Error fetching template:', error);
      setAlert({
        open: true,
        message: `Failed to load template: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTemplate();
  }, [id]);

  // Handle delete template
  const handleDeleteTemplate = async () => {
    try {
      await templateService.deleteTemplate(id);
      setAlert({
        open: true,
        message: 'Template deleted successfully',
        severity: 'success'
      });
      // Navigate back to templates list after a short delay
      setTimeout(() => navigate('/templates'), 1500);
    } catch (error) {
      console.error('Error deleting template:', error);
      setAlert({
        open: true,
        message: 'Failed to delete template. Please try again later.',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <LoadingSpinner message="Loading template..." />;
  }

  if (!template) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Template not found
        </Typography>
        <Button
          component={Link}
          to="/templates"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Templates
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title={template.name}
        subtitle={`Template Category: ${template.category}`}
        breadcrumbs={[
          { label: 'Dashboard', link: '/' },
          { label: 'Templates', link: '/templates' },
          { label: template.name, link: `/templates/${template.id}` }
        ]}
        action={{
          label: 'Back to Templates',
          icon: <ArrowBackIcon />,
          onClick: () => navigate('/templates'),
          link: '/templates'
        }}
      />

      {/* Template actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center">
                <Chip 
                  label={template.category}
                  sx={{
                    backgroundColor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              {/* Template actions */}
              <Box>
                <Tooltip title="Edit Template">
                  <IconButton 
                    component={Link} 
                    to={`/templates/${template.id}/edit`}
                    color="primary"
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Duplicate Template">
                  <IconButton 
                    component={Link} 
                    to={`/templates/create?duplicate=${template.id}`}
                    color="primary"
                    sx={{ mr: 1 }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Create Document from Template">
                  <IconButton 
                    component={Link} 
                    to={`/documents/create?template=${template.id}`}
                    color="primary"
                    sx={{ mr: 1 }}
                  >
                    <DescriptionIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete Template">
                  <IconButton 
                    onClick={() => setDeleteDialogOpen(true)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Template details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Template Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1" gutterBottom>
              {template.name}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Category
            </Typography>
            <Typography variant="body1" gutterBottom>
              {template.category}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Created At
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(template.createdAt)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(template.updatedAt)}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1" gutterBottom>
              {template.description || 'No description provided'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Template content preview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Template Structure
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          {/* Fields Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Fields ({template.fields ? template.fields.length : 0})
            </Typography>
            {template.fields && template.fields.length > 0 ? (
              template.fields.map((field, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, color: 'black', bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>{field.label}</strong> ({field.type})
                    {field.required && <Chip label="Required" size="small" sx={{ ml: 1 }} />}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No fields defined
              </Typography>
            )}
          </Grid>
          
          {/* Header & Footer Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondar" gutterBottom>
              Configuration
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Header Title:</strong> {template.header?.title || 'Not set'}
              </Typography>
              <Typography variant="body2">
                <strong>Header Subtitle:</strong> {template.header?.subtitle || 'Not set'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>Footer Text:</strong> {template.footer?.text || 'Not set'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Template content preview */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Template Content Preview
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ 
          p: 2, 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          color: 'black',
          bgcolor: theme.palette.background.paper,
          minHeight: '300px'
        }}>
          {/* Display content from fields structure */}
          {template.fields && template.fields.length > 0 ? (
            template.fields.map((field, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {field.label} ({field.type})
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: theme.palette.grey[50],
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  {field.type === 'textarea' ? (
                    <div dangerouslySetInnerHTML={{ __html: field.defaultValue || '<p>No content available</p>' }} />
                  ) : (
                    <Typography variant="body2">
                      {field.defaultValue || 'No content available'}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No content available
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Template"
        message={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteTemplate}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        severity="error"
      />

      {/* Alert message */}
      <AlertMessage
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  );
};

export default TemplateDetail;