import React, { useState, useEffect, useContext } from 'react';
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
  TextField,
  Paper,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as FileDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { documentService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, LoadingSpinner, ConfirmDialog, AlertMessage } from '../common';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [rejectReason, setRejectReason] = useState('');

  // Status color mapping
  const statusColors = {
    draft: theme.palette.info.main,
    pending: theme.palette.warning.main,
    approved: theme.palette.success.main,
    rejected: theme.palette.error.main
  };

  // Fetch document details
  const fetchDocument = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocumentById(id);
      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      setAlert({
        open: true,
        message: 'Failed to load document. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Handle delete document
  const handleDeleteDocument = async () => {
    try {
      await documentService.deleteDocument(id);
      setAlert({
        open: true,
        message: 'Document deleted successfully',
        severity: 'success'
      });
      // Navigate back to documents list after a short delay
      setTimeout(() => navigate('/documents'), 1500);
    } catch (error) {
      console.error('Error deleting document:', error);
      setAlert({
        open: true,
        message: 'Failed to delete document. Please try again later.',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Handle submit document for approval
  const handleSubmitDocument = async () => {
    try {
      await documentService.submitDocument(id);
      setAlert({
        open: true,
        message: 'Document submitted for approval successfully',
        severity: 'success'
      });
      fetchDocument(); // Refresh document data
    } catch (error) {
      console.error('Error submitting document:', error);
      setAlert({
        open: true,
        message: 'Failed to submit document. Please try again later.',
        severity: 'error'
      });
    } finally {
      setSubmitDialogOpen(false);
    }
  };

  // Handle approve document
  const handleApproveDocument = async () => {
    try {
      await documentService.approveDocument(id);
      setAlert({
        open: true,
        message: 'Document approved successfully',
        severity: 'success'
      });
      fetchDocument(); // Refresh document data
    } catch (error) {
      console.error('Error approving document:', error);
      setAlert({
        open: true,
        message: 'Failed to approve document. Please try again later.',
        severity: 'error'
      });
    } finally {
      setApproveDialogOpen(false);
    }
  };

  // Handle reject document
  const handleRejectDocument = async () => {
    try {
      await documentService.rejectDocument(id, rejectReason || 'Rejected by admin');
      setAlert({
        open: true,
        message: 'Document rejected successfully',
        severity: 'success'
      });
      fetchDocument(); // Refresh document data
    } catch (error) {
      console.error('Error rejecting document:', error);
      setAlert({
        open: true,
        message: 'Failed to reject document. Please try again later.',
        severity: 'error'
      });
    } finally {
      setRejectDialogOpen(false);
      setRejectReason('');
    }
  };

  // Handle download document as PDF
  const handleDownloadPdf = async () => {
    try {
      await documentService.generatePDF(id);
      // The actual download will be handled by the browser
    } catch (error) {
      console.error('Error downloading document:', error);
      setAlert({
        open: true,
        message: 'Failed to download document. Please try again later.',
        severity: 'error'
      });
    }
  };

  // Check if user can edit the document
  const canEditDocument = (document) => {
    const createdById = document?.createdBy?._id || document?.createdBy?.id || document?.userId;
    const userId = user?._id || user?.id;
    return isAuthenticated && userId && (userId === createdById || user?.role === 'admin');
  };

  // Check if user can delete the document
  const canDeleteDocument = (document) => canEditDocument(document);

  // Check if user can submit the document for approval
  const canSubmitDocument = (document) => {
    const createdById = document?.createdBy?._id || document?.createdBy?.id || document?.userId;
    const userId = user?._id || user?.id;
    return isAuthenticated && userId && (userId === createdById || user?.role === 'admin') && document.status === 'draft';
  };

  // Check if user can approve/reject the document
  const canApproveRejectDocument = () => {
    if (!document || !user) return false;
    return user.role === 'admin' && document.status === 'pending';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <LoadingSpinner message="Loading document..." />;
  }

  if (!document) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Document not found
        </Typography>
        <Button
          component={Link}
          to="/documents"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Documents
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title={document.title}
        subtitle={`Document ID: ${document.id || document._id}`}
        breadcrumbs={[
          { label: 'Dashboard', link: '/' },
          { label: 'Documents', link: '/documents' },
          { label: document.title, link: `/documents/${document.id || id}` }
        ]}
        action={{
          label: 'Back to Documents',
          icon: <ArrowBackIcon />,
          onClick: () => navigate('/documents'),
          link: '/documents'
        }}
      />

      {/* Document status and actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center">
                <Typography variant="subtitle1" sx={{ mr: 2 }}>
                  Status:
                </Typography>
                <Chip 
                  label={document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                  sx={{
                    backgroundColor: statusColors[document.status] || theme.palette.grey[500],
                    color: '#fff'
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              {/* Document actions */}
              <Box>
                {canEditDocument(document) && (
                  <Tooltip title="Edit Document">
                    <IconButton 
                      component={Link} 
                      to={`/documents/${document.id}/edit`}
                      color="primary"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Download PDF">
                  <IconButton 
                    onClick={handleDownloadPdf}
                    color="primary"
                    sx={{ mr: 1 }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </Tooltip>
                
                {canDeleteDocument(document) && (
                  <Tooltip title="Delete Document">
                    <IconButton 
                      onClick={() => setDeleteDialogOpen(true)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Workflow actions */}
          {(canSubmitDocument() || canApproveRejectDocument()) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="flex-end">
                {canSubmitDocument(document) && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SendIcon />}
                    onClick={() => setSubmitDialogOpen(true)}
                    sx={{ mr: 1 }}
                  >
                    Submit for Approval
                  </Button>
                )}
                
                {canApproveRejectDocument() && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => setApproveDialogOpen(true)}
                      sx={{ mr: 1 }}
                    >
                      Approve
                    </Button>
                    
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Document details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Document Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Category
            </Typography>
            <Typography variant="body1" gutterBottom>
              {document.category || 'N/A'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Department
            </Typography>
            <Typography variant="body1" gutterBottom>
              {document.department || 'N/A'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Created By
            </Typography>
            <Typography variant="body1" gutterBottom>
              {document.createdBy || 'N/A'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Created At
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(document.createdAt)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(document.updatedAt)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Template Used
            </Typography>
            <Typography variant="body1" gutterBottom>
              {document.templateName || 'Custom Document'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Document content */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Document Content
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ 
          p: 2, 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          bgcolor: theme.palette.background.paper,
          minHeight: '300px'
        }}>
          {/* This would typically be rendered HTML content from the document */}
          <div dangerouslySetInnerHTML={{ __html: document?.content?.body || document?.content || '<p>No content available</p>' }} />
        </Box>
      </Paper>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Document"
        message={`Are you sure you want to delete "${document.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteDocument}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
      />

      {/* Submit confirmation dialog */}
      <ConfirmDialog
        open={submitDialogOpen}
        title="Submit for Approval"
        message={`Are you sure you want to submit "${document.title}" for approval? Once submitted, you won't be able to edit it until it's approved or rejected.`}
        onConfirm={handleSubmitDocument}
        onCancel={() => setSubmitDialogOpen(false)}
        confirmText="Submit"
        cancelText="Cancel"
        severity="warning"
      />

      {/* Approve confirmation dialog */}
      <ConfirmDialog
        open={approveDialogOpen}
        title="Approve Document"
        message={`Are you sure you want to approve "${document.title}"?`}
        onConfirm={handleApproveDocument}
        onCancel={() => setApproveDialogOpen(false)}
        confirmText="Approve"
        cancelText="Cancel"
        severity="success"
      />

      {/* Reject confirmation dialog */}
      <ConfirmDialog
        open={rejectDialogOpen}
        title="Reject Document"
        message={`Are you sure you want to reject "${document.title}"?`}
        onConfirm={handleRejectDocument}
        onCancel={() => setRejectDialogOpen(false)}
        confirmText="Reject"
        cancelText="Cancel"
        severity="error"
      >
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            placeholder="Provide a reason for rejection"
          />
        </Box>
      </ConfirmDialog>

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

export default DocumentDetail;