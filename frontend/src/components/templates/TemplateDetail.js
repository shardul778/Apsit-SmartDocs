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
      const data = await templateService.getTemplateById(id);
      setTemplate(data);
    } catch (error) {
      console.error('Error fetching template:', error);
      setAlert({
        open: true,
        message: 'Failed to load template. Please try again later.',
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
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Template Content Preview
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ 
          p: 2, 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          bgcolor: theme.palette.background.paper,
          minHeight: '300px'
        }}>
          {/* This would typically be rendered HTML content from the template */}
          <div dangerouslySetInnerHTML={{ __html: template.content || '<p>No content available</p>' }} />
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