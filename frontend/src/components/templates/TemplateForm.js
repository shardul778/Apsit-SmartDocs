import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Upload as UploadIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { templateService } from '../../services';
import { aiService } from '../../services';
import { PageHeader, LoadingSpinner, AlertMessage } from '../common';

// Rich text editor (using a placeholder, you can replace with your preferred editor)
import { Editor } from '@tinymce/tinymce-react';

// Template form validation schema
const TemplateSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').max(100, 'Name is too long'),
  category: Yup.string().required('Category is required'),
  description: Yup.string().max(500, 'Description is too long'),
  content: Yup.string().required('Content is required')
});

const TemplateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isEditMode = Boolean(id);
  const queryParams = new URLSearchParams(location.search);
  const duplicateId = queryParams.get('duplicate');
  
  const [template, setTemplate] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode || Boolean(duplicateId));
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // AI Dialog state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiType, setAiType] = useState('formal');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [formikRef, setFormikRef] = useState(null);

  // Initial form values
  const initialValues = {
    name: '',
    category: '',
    description: '',
    content: ''
  };

  // Fetch template if in edit mode or duplicating
  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        // Fetch template categories
        const categoriesData = await templateService.getTemplateCategories();
        setCategories(categoriesData);
        
        // If editing or duplicating, fetch the template
        if (isEditMode || duplicateId) {
          const templateId = isEditMode ? id : duplicateId;
          const templateData = await templateService.getTemplateById(templateId);
          
          if (duplicateId) {
            // If duplicating, modify the name to indicate it's a copy
            templateData.name = `Copy of ${templateData.name}`;
            // Clear the ID to ensure a new template is created
            delete templateData.id;
          }
          
          setTemplate(templateData);
          if (templateData.logoUrl) {
            setLogoPreview(templateData.logoUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching template data:', error);
        setAlert({
          open: true,
          message: 'Failed to load template data. Please try again later.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplateData();
  }, [id, isEditMode, duplicateId]);

  // Handle logo file change
  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      let templateData = { ...values };
      let templateId;
      
      if (isEditMode) {
        // Update existing template
        templateData.id = id;
        await templateService.updateTemplate(id, templateData);
        templateId = id;
      } else {
        // Create new template
        const newTemplate = await templateService.createTemplate(templateData);
        templateId = newTemplate.id;
      }
      
      // Upload logo if selected
      if (logoFile) {
        await templateService.uploadTemplateLogo(templateId, logoFile);
      }
      
      setAlert({
        open: true,
        message: `Template ${isEditMode ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      
      // Navigate to the template detail page after a short delay
      setTimeout(() => navigate(`/templates/${templateId}`), 1500);
    } catch (error) {
      console.error('Error saving template:', error);
      setAlert({
        open: true,
        message: `Failed to ${isEditMode ? 'update' : 'create'} template. Please try again later.`,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle adding a new category
  const handleAddCategory = (newCategory, setFieldValue) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setFieldValue('category', newCategory);
    }
  };
  
  // Handle AI content generation
  const handleAiGenerate = async (formikProps) => {
    if (!aiPrompt.trim()) {
      setAiError('Please enter a prompt for the AI');
      return;
    }
    
    setAiGenerating(true);
    setAiError('');
    
    try {
      const response = await aiService.generateText({
        prompt: aiPrompt,
        type: aiType,
        maxLength: 2000,
        temperature: 0.7
      });
      
      if (response && response.text) {
        formikProps.setFieldValue('content', response.text);
        setAiDialogOpen(false);
        setAlert({
          open: true,
          message: 'AI content generated successfully!',
          severity: 'success'
        });
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      setAiError(error.response?.data?.message || 'Failed to generate AI content. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading template data..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title={isEditMode ? 'Edit Template' : 'Create Template'}
        subtitle={isEditMode ? `Editing: ${template?.name}` : 'Create a new document template'}
        breadcrumbs={[
          { label: 'Dashboard', link: '/' },
          { label: 'Templates', link: '/templates' },
          { label: isEditMode ? 'Edit Template' : 'Create Template', link: isEditMode ? `/templates/${id}/edit` : '/templates/create' }
        ]}
        action={{
          label: 'Back to Templates',
          icon: <ArrowBackIcon />,
          onClick: () => navigate('/templates'),
          link: '/templates'
        }}
      />

      <Formik
        initialValues={template || initialValues}
        validationSchema={TemplateSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {(formikProps) => {
          // Store formik reference for AI dialog
          const { isSubmitting, values, errors, touched, handleChange, setFieldValue } = formikProps;
          if (!formikRef) setFormikRef(formikProps);
          return (
          <Form>
            <Grid container spacing={3}>
              {/* Template details */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Template Details
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Template Name"
                          name="name"
                          value={values.name}
                          onChange={handleChange}
                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
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
                            <MenuItem value="__new__">
                              <em>+ Add New Category</em>
                            </MenuItem>
                          </Field>
                          {touched.category && errors.category && (
                            <FormHelperText>{errors.category}</FormHelperText>
                          )}
                        </FormControl>
                        
                        {/* New category input (shown when "Add New Category" is selected) */}
                        {values.category === '__new__' && (
                          <Box sx={{ mt: 2 }}>
                            <TextField
                              fullWidth
                              label="New Category Name"
                              variant="outlined"
                              onBlur={(e) => handleAddCategory(e.target.value, setFieldValue)}
                            />
                          </Box>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Template Logo (Optional)
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Button
                              variant="outlined"
                              component="label"
                              startIcon={<UploadIcon />}
                            >
                              Upload Logo
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleLogoChange}
                              />
                            </Button>
                            {logoPreview && (
                              <Box 
                                component="img" 
                                src={logoPreview} 
                                alt="Logo Preview" 
                                sx={{ 
                                  ml: 2, 
                                  width: 50, 
                                  height: 50, 
                                  objectFit: 'contain' 
                                }} 
                              />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Recommended size: 200x200 pixels. Max file size: 2MB.
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Description"
                          name="description"
                          value={values.description}
                          onChange={handleChange}
                          error={touched.description && Boolean(errors.description)}
                          helperText={touched.description && errors.description}
                          multiline
                          rows={3}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Template content */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Template Content
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={() => setAiDialogOpen(true)}
                        sx={{ mb: 1 }}
                      >
                        Generate with AI
                      </Button>
                    </Box>
                    <Editor
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
                          'undo redo | formatselect | bold italic backcolor | \
                          alignleft aligncenter alignright alignjustify | \
                          bullist numlist outdent indent | removeformat | help'
                      }}
                      onEditorChange={(content) => setFieldValue('content', content)}
                    />
                    {touched.content && errors.content && (
                      <FormHelperText error>{errors.content}</FormHelperText>
                    )}
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Available Variables
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Use these variables in your template to be replaced with actual values when creating a document:
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: theme.palette.background.default, 
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" component="div">
                          <code>{'{{user.name}}'}</code> - User's full name
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" component="div">
                          <code>{'{{user.email}}'}</code> - User's email
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" component="div">
                          <code>{'{{user.department}}'}</code> - User's department
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" component="div">
                          <code>{'{{user.position}}'}</code> - User's position
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" component="div">
                          <code>{'{{date}}'}</code> - Current date
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" component="div">
                          <code>{'{{company.name}}'}</code> - Company name
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>

              {/* Form actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/templates')}
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
                    {isEditMode ? 'Update Template' : 'Create Template'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        )}}
      </Formik>

      {/* Alert message */}
      <AlertMessage
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
      
      {/* AI Content Generation Dialog */}
      <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Template Content with AI</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Describe what kind of template you want to create"
              multiline
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g., Create a formal business letter template for client communications"
              error={Boolean(aiError)}
              helperText={aiError}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>AI Style</InputLabel>
              <Select
                value={aiType}
                onChange={(e) => setAiType(e.target.value)}
                label="AI Style"
              >
                <MenuItem value="formal">Formal</MenuItem>
                <MenuItem value="paraphrase">Creative</MenuItem>
                <MenuItem value="summarize">Concise</MenuItem>
                <MenuItem value="expand">Detailed</MenuItem>
              </Select>
              <FormHelperText>Select the style for your generated content</FormHelperText>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (formikRef) {
                handleAiGenerate(formikRef);
              } else {
                setAiError('Could not access form context. Please try again.');
              }
            }}
            variant="contained" 
            color="primary"
            disabled={aiGenerating}
            startIcon={aiGenerating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          >
            {aiGenerating ? 'Generating...' : 'Generate Content'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateForm;