import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Add as AddIcon,
  FileCopy as TemplateIcon,
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Drafts as DraftIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { documentService } from '../../services';
import { PageHeader, LoadingSpinner, EmptyState } from '../common';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch documents with pagination
        const response = await documentService.getDocuments({ limit: 5 });
        
        // Set recent documents
        setRecentDocuments(response.documents || []);
        
        // Calculate stats
        const documents = response.documents || [];
        const total = response.totalCount || 0;
        const draft = documents.filter(doc => doc.status === 'draft').length;
        const pending = documents.filter(doc => doc.status === 'pending').length;
        const approved = documents.filter(doc => doc.status === 'approved').length;
        const rejected = documents.filter(doc => doc.status === 'rejected').length;
        
        setStats({
          total,
          draft,
          pending,
          approved,
          rejected,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty data on error
        setRecentDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <DraftIcon color="action" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'approved':
        return <ApprovedIcon color="success" />;
      case 'rejected':
        return <RejectedIcon color="error" />;
      default:
        return <DocumentIcon color="primary" />;
    }
  };

  const getStatusChip = (status) => {
    let color;
    switch (status) {
      case 'draft':
        color = 'default';
        break;
      case 'pending':
        color = 'warning';
        break;
      case 'approved':
        color = 'success';
        break;
      case 'rejected':
        color = 'error';
        break;
      default:
        color = 'primary';
    }
    return (
      <Chip 
        label={status.charAt(0).toUpperCase() + status.slice(1)} 
        color={color} 
        size="small" 
      />
    );
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading dashboard..." />;
  }

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${user?.name || 'User'}!`}
        subtitle="Dashboard Overview"
        action
        actionText="Create Document"
        actionIcon={<AddIcon />}
        actionLink="/documents/create"
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderTop: '4px solid',
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Documents
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All your documents
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderTop: '4px solid',
              borderColor: 'warning.main',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Pending Approval
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {stats.pending}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Awaiting review
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderTop: '4px solid',
              borderColor: 'success.main',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Approved
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {stats.approved}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ready to use
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderTop: '4px solid',
              borderColor: 'error.main',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Rejected
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {stats.rejected}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Needs revision
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/documents/create')}
                  fullWidth
                >
                  Create New Document
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<DocumentIcon />}
                  onClick={() => navigate('/documents')}
                  fullWidth
                >
                  View All Documents
                </Button>
                {user?.role === 'admin' && (
                  <Button
                    variant="outlined"
                    color="info"
                    startIcon={<TemplateIcon />}
                    onClick={() => navigate('/templates')}
                    fullWidth
                  >
                    Manage Templates
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Documents */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {recentDocuments.length > 0 ? (
                <List>
                  {recentDocuments.map((doc) => (
                    <ListItem
                      key={doc._id}
                      button
                      onClick={() => navigate(`/documents/${doc._id}`)}
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <ListItemIcon>{getStatusIcon(doc.status)}</ListItemIcon>
                      <ListItemText
                        primary={doc.title}
                        secondary={
                          <>
                            {doc.template?.name || 'Unknown Template'} • 
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </>
                        }
                      />
                      {getStatusChip(doc.status)}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <EmptyState
                  title="No documents yet"
                  description="Create your first document to get started"
                  icon={<DocumentIcon sx={{ fontSize: 64 }} />}
                  actionText="Create Document"
                  onActionClick={() => navigate('/documents/create')}
                />
              )}
            </CardContent>
            {recentDocuments.length > 0 && (
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => navigate('/documents')}
                >
                  View All
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;