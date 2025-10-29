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
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { documentService } from '../../services';
import { useAuth } from '../../context/AuthContext';

const DocumentViewer = ({ documentId }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Function to add page break indicators to content
  const addPageBreakIndicators = (htmlContent) => {
    if (!htmlContent) return '';
    
    // Split content into logical sections (after headings, long paragraphs)
    let content = htmlContent;
    
    // Add page breaks after major headings (h1, h2)
    content = content.replace(/<\/h[12][^>]*>/gi, (match) => {
      return match + '<div class="page-break">--- Page Break ---</div>';
    });
    
    // Add page breaks after long paragraphs (more than 200 characters)
    content = content.replace(/<\/p>/gi, (match, offset, string) => {
      // Find the paragraph content
      const paragraphStart = string.lastIndexOf('<p', offset);
      const paragraphContent = string.substring(paragraphStart, offset + match.length);
      const textContent = paragraphContent.replace(/<[^>]*>/g, '');
      
      if (textContent.length > 200) {
        return match + '<div class="page-break">--- Page Break ---</div>';
      }
      return match;
    });
    
    // Add page breaks after lists
    content = content.replace(/<\/ul>/gi, (match) => {
      return match + '<div class="page-break">--- Page Break ---</div>';
    });
    
    return content;
  };

  // Function to format content for better readability
  const formatContent = (content) => {
    if (!content) return '<p>No content available</p>';
    
    // If content is plain text, wrap it in paragraphs
    if (!content.includes('<')) {
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    }
    
    return content;
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const doc = await documentService.getDocumentById(documentId);
      setDocument(doc);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const pdfUrl = await documentService.generatePDF(documentId);
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
      } else {
        setError('Failed to generate PDF');
      }
    } catch (err) {
      setError('Failed to download document');
    }
  };

  const handleEdit = () => {
    navigate(`/documents/${documentId}/edit`);
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

  const createdById = document?.createdBy?._id || document?.createdBy?.id;
  const userId = user?._id || user?.id;
  const canEdit = isAuthenticated && userId && (userId === createdById || user?.role === 'admin');
  const canDelete = canEdit;

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
            className="document-content"
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              p: 2,
              minHeight: '600px', // Minimum height for scrolling
              maxHeight: '80vh', // Maximum height to prevent overflow
              backgroundColor: '#fafafa',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '4px',
                '&:hover': {
                  background: '#a8a8a8',
                },
              },
            }}
            dangerouslySetInnerHTML={{ 
              __html: addPageBreakIndicators(formatContent(document?.content?.body || document?.content || '')) 
            }}
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