import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

const DocumentViewer = ({ documentId }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocumentById(documentId);
      setDocument(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await documentService.generatePDF(documentId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${document.title}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download document');
    }
  };

  const handleEdit = () => {
    navigate(`/documents/edit/${documentId}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentService.deleteDocument(documentId);
        navigate('/documents');
      } catch (err) {
        setError('Failed to delete document');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!document) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Document not found
      </Alert>
    );
  }

  const canEdit = currentUser && (currentUser._id === document.createdBy._id || isAdmin);
  const canDelete = currentUser && (currentUser._id === document.createdBy._id || isAdmin);

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {document.title}
              </Typography>
              <Chip
                label={document.status.toUpperCase()}
                color={getStatusColor(document.status)}
                size="small"
              />
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Download PDF
              </Button>
              {canEdit && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Content
          </Typography>
          <Box
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              p: 2,
              minHeight: '400px',
              backgroundColor: '#fafafa'
            }}
            dangerouslySetInnerHTML={{ __html: document.content }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Document Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Template
            </Typography>
            <Typography variant="body1">
              {document.template?.name || 'N/A'}
            </Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Created By
            </Typography>
            <Typography variant="body1">
              {document.createdBy?.name || 'Unknown'}
            </Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Created Date
            </Typography>
            <Typography variant="body1">
              {new Date(document.createdAt).toLocaleDateString()}
            </Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">
              Last Modified
            </Typography>
            <Typography variant="body1">
              {new Date(document.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>

          {document.approvedBy && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Approved By
              </Typography>
              <Typography variant="body1">
                {document.approvedBy.name}
              </Typography>
            </Box>
          )}

          {document.rejectionReason && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Rejection Reason
              </Typography>
              <Typography variant="body1" color="error">
                {document.rejectionReason}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DocumentViewer;