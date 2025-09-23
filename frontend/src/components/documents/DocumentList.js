import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { documentService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, LoadingSpinner, EmptyState, ConfirmDialog, AlertMessage } from '../common';
import { DialogContentText, TextField as MuiTextField } from '@mui/material';

const DocumentList = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    department: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [documentToAct, setDocumentToAct] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Status color mapping
  const statusColors = {
    draft: theme.palette.info.main,
    pending: theme.palette.warning.main,
    approved: theme.palette.success.main,
    rejected: theme.palette.error.main
  };

  // Fetch documents with pagination and filters
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentService.getDocuments({
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage,
        ...filters
      });
      setDocuments(response.documents);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setAlert({
        open: true,
        message: 'Failed to load documents. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, [page, rowsPerPage, filters]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0); // Reset to first page when filters change
  };

  // Handle search input
  const handleSearchChange = (event) => {
    const { value } = event.target;
    setFilters(prev => ({
      ...prev,
      search: value
    }));
  };

  // Handle search submit
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchDocuments();
  };

  // Handle delete document
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      await documentService.deleteDocument(documentToDelete.id);
      setAlert({
        open: true,
        message: 'Document deleted successfully',
        severity: 'success'
      });
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Error deleting document:', error);
      setAlert({
        open: true,
        message: 'Failed to delete document. Please try again later.',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  // Open approve/reject dialogs
  const openApproveDialog = (document) => {
    setDocumentToAct(document);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (document) => {
    setDocumentToAct(document);
    setRejectDialogOpen(true);
  };

  // Approve document
  const handleApproveDocument = async () => {
    if (!documentToAct) return;
    try {
      await documentService.approveDocument(documentToAct.id);
      setAlert({ open: true, message: 'Document approved successfully', severity: 'success' });
      fetchDocuments();
    } catch (error) {
      console.error('Error approving document:', error);
      setAlert({ open: true, message: 'Failed to approve document.', severity: 'error' });
    } finally {
      setApproveDialogOpen(false);
      setDocumentToAct(null);
    }
  };

  // Reject document
  const handleRejectDocument = async () => {
    if (!documentToAct) return;
    try {
      await documentService.rejectDocument(documentToAct.id, rejectReason || 'Rejected by admin');
      setAlert({ open: true, message: 'Document rejected successfully', severity: 'success' });
      fetchDocuments();
    } catch (error) {
      console.error('Error rejecting document:', error);
      setAlert({ open: true, message: 'Failed to reject document.', severity: 'error' });
    } finally {
      setRejectDialogOpen(false);
      setDocumentToAct(null);
      setRejectReason('');
    }
  };

  // Handle download document as PDF
  const handleDownloadPdf = async (documentId) => {
    try {
      await documentService.generatePDF(documentId);
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

  // Check if user can edit a document
  const canEditDocument = (document) => {
    return document.userId === user?.id || user?.role === 'admin';
  };

  // Check if user can delete a document
  const canDeleteDocument = (document) => {
    return document.userId === user?.id || user?.role === 'admin';
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Documents" 
        subtitle="Manage your documents"
        breadcrumbs={[
          { label: 'Dashboard', link: '/' },
          { label: 'Documents', link: '/documents' }
        ]}
        action={{
          label: 'Create Document',
          icon: <AddIcon />,
          onClick: () => {/* Navigate to create document page */},
          link: '/documents/create'
        }}
      />

      {/* Search and filter section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <form onSubmit={handleSearchSubmit}>
                <TextField
                  fullWidth
                  placeholder="Search documents..."
                  name="search"
                  value={filters.search}
                  onChange={handleSearchChange}
                  InputProps={{
                    endAdornment: (
                      <IconButton type="submit" edge="end">
                        <SearchIcon />
                      </IconButton>
                    )
                  }}
                />
              </form>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                variant="outlined"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Grid>

            {/* Filters */}
            {showFilters && (
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        label="Status"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        label="Category"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="legal">Legal</MenuItem>
                        <MenuItem value="hr">HR</MenuItem>
                        <MenuItem value="finance">Finance</MenuItem>
                        <MenuItem value="marketing">Marketing</MenuItem>
                        <MenuItem value="operations">Operations</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Department</InputLabel>
                      <Select
                        name="department"
                        value={filters.department}
                        onChange={handleFilterChange}
                        label="Department"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="legal">Legal</MenuItem>
                        <MenuItem value="hr">HR</MenuItem>
                        <MenuItem value="finance">Finance</MenuItem>
                        <MenuItem value="marketing">Marketing</MenuItem>
                        <MenuItem value="it">IT</MenuItem>
                        <MenuItem value="operations">Operations</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Documents table */}
      {loading ? (
        <LoadingSpinner message="Loading documents..." />
      ) : documents.length === 0 ? (
        <EmptyState 
          message="No documents found"
          description="Create your first document or adjust your filters to see results."
          action={{
            label: 'Create Document',
            link: '/documents/create'
          }}
        />
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((document) => (
                  <TableRow hover key={document.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{document.title}</Typography>
                    </TableCell>
                    <TableCell>{document.category}</TableCell>
                    <TableCell>{document.department}</TableCell>
                    <TableCell>
                      {new Date(document.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                        size="small"
                        sx={{
                          backgroundColor: statusColors[document.status] || theme.palette.grey[500],
                          color: '#fff'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton 
                          component={Link} 
                          to={`/documents/${document.id}`}
                          size="small"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {canEditDocument(document) && (
                        <Tooltip title="Edit">
                          <IconButton 
                            component={Link} 
                            to={`/documents/${document.id}/edit`}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Download PDF">
                        <IconButton 
                          onClick={() => handleDownloadPdf(document.id)}
                          size="small"
                        >
                          <FileDownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {/* Admin approve/reject for pending */}
                      {user?.role === 'admin' && document.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton 
                              onClick={() => openApproveDialog(document)}
                              size="small"
                              color="success"
                              sx={{ ml: 0.5 }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton 
                              onClick={() => openRejectDialog(document)}
                              size="small"
                              color="error"
                              sx={{ ml: 0.5 }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {canDeleteDocument(document) && (
                        <Tooltip title="Delete">
                          <IconButton 
                            onClick={() => openDeleteDialog(document)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Document"
        message={`Are you sure you want to delete "${documentToDelete?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteDocument}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDocumentToDelete(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
      />

      {/* Approve confirmation dialog */}
      <ConfirmDialog
        open={approveDialogOpen}
        title="Approve Document"
        message={`Are you sure you want to approve "${documentToAct?.title || ''}"?`}
        onConfirm={handleApproveDocument}
        onCancel={() => {
          setApproveDialogOpen(false);
          setDocumentToAct(null);
        }}
        confirmText="Approve"
        cancelText="Cancel"
        severity="success"
      />

      {/* Reject confirmation dialog with reason */}
      <ConfirmDialog
        open={rejectDialogOpen}
        title="Reject Document"
        message={`Provide a reason and confirm to reject "${documentToAct?.title || ''}".`}
        onConfirm={handleRejectDocument}
        onCancel={() => {
          setRejectDialogOpen(false);
          setDocumentToAct(null);
          setRejectReason('');
        }}
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

export default DocumentList;