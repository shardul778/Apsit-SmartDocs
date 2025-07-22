import React, { useState, useEffect } from 'react';
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
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { templateService } from '../../services';
import { PageHeader, LoadingSpinner, EmptyState, ConfirmDialog, AlertMessage } from '../common';

const TemplateList = () => {
  const theme = useTheme();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch templates and categories
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const [templatesData, categoriesData] = await Promise.all([
        templateService.getTemplates(filter),
        templateService.getTemplateCategories()
      ]);
      setTemplates(templatesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setAlert({
        open: true,
        message: 'Failed to load templates. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTemplates();
  }, [filter]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  // Handle search input
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    // Filter templates based on search query
    // This is a client-side search since we don't have a search endpoint
    // In a real application, you might want to implement server-side search
  };

  // Handle delete template
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      await templateService.deleteTemplate(templateToDelete.id);
      setAlert({
        open: true,
        message: 'Template deleted successfully',
        severity: 'success'
      });
      fetchTemplates(); // Refresh the list
    } catch (error) {
      console.error('Error deleting template:', error);
      setAlert({
        open: true,
        message: 'Failed to delete template. Please try again later.',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query)
    );
  });

  // Paginate templates
  const paginatedTemplates = filteredTemplates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Templates" 
        subtitle="Manage document templates"
        breadcrumbs={[
          { label: 'Dashboard', link: '/' },
          { label: 'Templates', link: '/templates' }
        ]}
        action={{
          label: 'Create Template',
          icon: <AddIcon />,
          onClick: () => {/* Navigate to create template page */},
          link: '/templates/create'
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
                  placeholder="Search templates..."
                  value={searchQuery}
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
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filter}
                    onChange={handleFilterChange}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Templates table */}
      {loading ? (
        <LoadingSpinner message="Loading templates..." />
      ) : paginatedTemplates.length === 0 ? (
        <EmptyState 
          message="No templates found"
          description={searchQuery ? "Try adjusting your search or filters." : "Create your first template to get started."}
          action={{
            label: 'Create Template',
            link: '/templates/create'
          }}
        />
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTemplates.map((template) => (
                  <TableRow hover key={template.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{template.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={template.category}
                        size="small"
                        sx={{
                          backgroundColor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {template.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(template.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton 
                          component={Link} 
                          to={`/templates/${template.id}`}
                          size="small"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Edit">
                        <IconButton 
                          component={Link} 
                          to={`/templates/${template.id}/edit`}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Duplicate">
                        <IconButton 
                          component={Link} 
                          to={`/templates/create?duplicate=${template.id}`}
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => openDeleteDialog(template)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
            count={filteredTemplates.length}
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
        title="Delete Template"
        message={`Are you sure you want to delete "${templateToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteTemplate}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setTemplateToDelete(null);
        }}
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

export default TemplateList;