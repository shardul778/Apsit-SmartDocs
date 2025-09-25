import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { documentService, templateService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, LoadingSpinner, AlertMessage, ConfirmDialog } from '../common';
import aiTextPlugin from '../../plugins/aiTextPlugin';

// Rich text editor (using a placeholder, you can replace with your preferred editor)
import { Editor } from '@tinymce/tinymce-react';

// Document form validation schema
const DocumentSchema = Yup.object().shape({
  title: Yup.string().required('Title is required').max(100, 'Title is too long'),
  category: Yup.string().required('Category is required'),
  department: Yup.string().required('Department is required'),
  content: Yup.string().required('Content is required')
});

const DocumentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  
  const [document, setDocument] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(isEditMode);
  const [editorKey, setEditorKey] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState(null);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Initial form values
  const initialValues = {
    title: '',
    category: '',
    department: user?.department || '',
    content: '',
    templateId: ''
  };

  // Fetch document if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchDocument = async () => {
        try {
          const data = await documentService.getDocumentById(id);
          setDocument(data);
          // Check if user has permission to edit
          if (data.userId !== user?.id && user?.role !== 'admin') {
            setAlert({
              open: true,
              message: 'You do not have permission to edit this document',
              severity: 'error'
            });
            setTimeout(() => navigate('/documents'), 2000);
          }
          // Check if document is in draft status
          if (data.status !== 'draft') {
            setAlert({
              open: true,
              message: 'Only documents in draft status can be edited',
              severity: 'warning'
            });
            setTimeout(() => navigate(`/documents/${id}`), 2000);
          }
        } catch (error) {
          console.error('Error fetching document:', error);
          setAlert({
            open: true,
            message: 'Failed to load document. Please try again later.',
            severity: 'error'
          });
          navigate('/documents');
        } finally {
          setLoading(false);
        }
      };
      fetchDocument();
    }
  }, [id, isEditMode, navigate, user]);

  // Fetch templates and categories
  useEffect(() => {
    const fetchTemplatesAndCategories = async () => {
      try {
        const [templatesData, categoriesData] = await Promise.all([
          templateService.getTemplates(),
          templateService.getTemplateCategories()
        ]);
        setTemplates(templatesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching templates or categories:', error);
        setAlert({
          open: true,
          message: 'Failed to load templates or categories. Please try again later.',
          severity: 'error'
        });
      }
    };
    fetchTemplatesAndCategories();
  }, []);

  // Build initial HTML content from a template definition
  const buildHtmlFromTemplate = (template) => {
    try {
      const lines = [];
      // Header
      if (template?.header?.title) {
        lines.push(`<h2>${template.header.title}</h2>`);
      }
      if (template?.header?.subtitle) {
        lines.push(`<p><em>${template.header.subtitle}</em></p>`);
      }
      // Group fields by section and sort by position
      const fields = Array.isArray(template?.fields) ? [...template.fields] : [];
      fields.sort((a, b) => (a.position || 0) - (b.position || 0));
      const sectionToFields = fields.reduce((acc, f) => {
        const section = f.section || 'Details';
        if (!acc[section]) acc[section] = [];
        acc[section].push(f);
        return acc;
      }, {});
      Object.entries(sectionToFields).forEach(([section, sectionFields]) => {
        if (sectionFields.length === 0) return;
        if (section && section !== 'default') {
          lines.push(`<h3>${section}</h3>`);
        }
        lines.push('<ul>');
        sectionFields.forEach((f) => {
          // Skip non-textual inputs in the initial content body
          if (['image', 'signature'].includes(f.type)) return;
          const label = f.label || f.name;
          const placeholder = f.placeholder || `[${label}]`;
          lines.push(`<li><strong>${label}:</strong> ${placeholder}</li>`);
        });
        lines.push('</ul>');
      });
      // Footer
      if (template?.footer?.text) {
        lines.push(`<p>${template.footer.text}</p>`);
      }
      return lines.join('\n');
    } catch (e) {
      return '';
    }
  };

  // Handle template selection
  const handleTemplateChange = async (event, setFieldValue) => {
    const templateId = event.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId) {
      try {
        const template = await templateService.getTemplateById(templateId);
        // Update form values with template data
        setFieldValue('category', template.category || '');
        setFieldValue('templateId', template.id || template._id || templateId);
        // Prefer explicit template.content; then fall back to first field defaultValue; then build from fields
        const html = (template.content && template.content.trim().length > 0)
          ? template.content
          : (Array.isArray(template.fields) && template.fields[0]?.defaultValue
              ? template.fields[0].defaultValue
              : buildHtmlFromTemplate(template));
        setFieldValue('content', html);
        setEditorKey((k) => k + 1);
        // Don't override the title if it's already set
        if (!document?.title && !initialValues.title) {
          setFieldValue('title', template.name || '');
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        setAlert({
          open: true,
          message: 'Failed to load template. Please try again later.',
          severity: 'error'
        });
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (isEditMode) {
        await documentService.updateDocument(id, values);
        setAlert({
          open: true,
          message: 'Document updated successfully',
          severity: 'success'
        });
      } else {
        const newDocument = await documentService.createDocument(values);
        setAlert({
          open: true,
          message: 'Document created successfully',
          severity: 'success'
        });
        // Navigate to the new document after a short delay
        setTimeout(() => navigate(`/documents/${newDocument.id}`), 1500);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      setAlert({
        open: true,
        message: `Failed to ${isEditMode ? 'update' : 'create'} document. Please try again later.`,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle submit for approval
  const handleSubmitForApproval = async () => {
    if (!formValues) return;
    
    try {
      let documentId;
      
      if (isEditMode) {
        const updated = await documentService.updateDocument(id, formValues);
        documentId = updated.id || id;
      } else {
        const newDocument = await documentService.createDocument(formValues);
        documentId = newDocument.id || newDocument._id;
      }
      
      // Submit for approval
      await documentService.submitDocument(documentId);
      
      setAlert({
        open: true,
        message: 'Document submitted for approval successfully',
        severity: 'success'
      });
      
      // Navigate to the document view after a short delay
      setTimeout(() => navigate(`/documents/${documentId}`), 1500);
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

  // Open submit dialog
  const openSubmitDialog = (values) => {
    setFormValues(values);
    setSubmitDialogOpen(true);
  };

  if (loading) {
    return <LoadingSpinner message="Loading document..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title={isEditMode ? 'Edit Document' : 'Create Document'}
        subtitle={isEditMode ? `Editing: ${document?.title}` : 'Create a new document'}
        breadcrumbs={[
          { label: 'Dashboard', link: '/' },
          { label: 'Documents', link: '/documents' },
          { label: isEditMode ? 'Edit Document' : 'Create Document', link: isEditMode ? `/documents/${id}/edit` : '/documents/create' }
        ]}
        action={{
          label: 'Back to Documents',
          icon: <ArrowBackIcon />,
          onClick: () => navigate('/documents'),
          link: '/documents'
        }}
      />

      <Formik
        initialValues={document || initialValues}
        validationSchema={DocumentSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, errors, touched, handleChange, setFieldValue }) => (
          <Form>
            <Grid container spacing={3}>
              {/* Document details */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Document Details
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Document Title"
                          name="title"
                          value={values.title}
                          onChange={handleChange}
                          error={touched.title && Boolean(errors.title)}
                          helperText={touched.title && errors.title}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={touched.category && Boolean(errors.category)}>
                          <InputLabel>Category</InputLabel>
                          <Field
                            as={Select}
                            name="category"
                            label="Category"
                            value={values.category}
                            onChange={handleChange}
                          >
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Field>
                          {touched.category && errors.category && (
                            <FormHelperText>{errors.category}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={touched.department && Boolean(errors.department)}>
                          <InputLabel>Department</InputLabel>
                          <Field
                            as={Select}
                            name="department"
                            label="Department"
                            value={values.department}
                            onChange={handleChange}
                          >
                            <MenuItem value="it">IT</MenuItem>
                            <MenuItem value="computer science">Computer Science</MenuItem>
                            <MenuItem value="data science">Data Science</MenuItem>
                            <MenuItem value="aiml">AIML</MenuItem>
                          </Field>
                          {touched.department && errors.department && (
                            <FormHelperText>{errors.department}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Template selection (only for new documents) */}
              {!isEditMode && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Template Selection (Optional)
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      
                      <FormControl fullWidth>
                        <InputLabel>Select Template</InputLabel>
                        <Select
                          value={selectedTemplate}
                          onChange={(e) => handleTemplateChange(e, setFieldValue)}
                          label="Select Template"
                        >
                          <MenuItem value="">None (Start from scratch)</MenuItem>
                          {templates.map((template) => (
                            <MenuItem key={template.id} value={template.id}>
                              {template.name} - {template.category}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          Selecting a template will pre-fill the document content
                        </FormHelperText>
                      </FormControl>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Document content */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Document Content
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Editor
                      key={editorKey}
                      apiKey="n0r9qv8xkmaybvmvjcoli20a4x7rznaa8bxoc6am16em7d03" // Replace with your TinyMCE API key
                      value={values.content}
                      init={{
                        height: 500,
                        menubar: true,
                        plugins: [
                          'advlist autolink lists link image charmap print preview anchor',
                          'searchreplace visualblocks code fullscreen',
                          'insertdatetime media table paste code help wordcount'
                        ],
                        toolbar:
                          // eslint-disable-next-line no-multi-str
                          'undo redo | formatselect | bold italic backcolor | \
                          alignleft aligncenter alignright alignjustify | \
                          bullist numlist outdent indent | aitext templates citation tableofcontents | removeformat | help',
                        setup: (editor) => {
                          aiTextPlugin(editor);
                        }
                      }}
                      onEditorChange={(content) => setFieldValue('content', content)}
                    />
                    {touched.content && errors.content && (
                      <FormHelperText error>{errors.content}</FormHelperText>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Form actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/documents')}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                  >
                    Save as Draft
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<SendIcon />}
                    disabled={isSubmitting}
                    onClick={() => openSubmitDialog(values)}
                  >
                    Save & Submit for Approval
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>

      {/* Submit confirmation dialog */}
      <ConfirmDialog
        open={submitDialogOpen}
        title="Submit for Approval"
        message="Are you sure you want to submit this document for approval? Once submitted, you won't be able to edit it until it's approved or rejected."
        onConfirm={handleSubmitForApproval}
        onCancel={() => setSubmitDialogOpen(false)}
        confirmButtonText="Submit"
        cancelButtonText="Cancel"
        severity="warning"
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

export default DocumentForm;