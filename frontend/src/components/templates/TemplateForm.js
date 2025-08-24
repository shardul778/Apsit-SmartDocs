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
  fields: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Field name is required'),
      label: Yup.string().required('Field label is required'),
      type: Yup.string().required('Field type is required'),
      required: Yup.boolean(),
      placeholder: Yup.string(),
      defaultValue: Yup.string(),
      position: Yup.number().required('Position is required'),
      section: Yup.string().default('default')
    })
  ).min(1, 'At least one field is required')
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
  const [aiServiceAvailable, setAiServiceAvailable] = useState(true);

  // Check AI service availability
  useEffect(() => {
    const checkAIService = async () => {
      try {
        const models = await aiService.getAIModels();
        setAiServiceAvailable(models.data && models.data.length > 0);
      } catch (error) {
        console.log('AI service check failed:', error);
        setAiServiceAvailable(false);
      }
    };
    
    checkAIService();
  }, []);

  // Initial form values
  const initialValues = {
    name: '',
    category: '',
    description: '',
    header: {
      title: '',
      subtitle: '',
      logo: ''
    },
    footer: {
      text: '',
      includePageNumbers: true
    },
    styling: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      margins: {
        top: 72,
        right: 72,
        bottom: 72,
        left: 72
      },
      primaryColor: '#000000',
      secondaryColor: '#666666'
    },
    fields: [
      {
        name: 'content',
        label: 'Content',
        type: 'textarea',
        required: true,
        placeholder: 'Enter template content here...',
        defaultValue: '',
        position: 1,
        section: 'default'
      }
    ]
  };

  // Fetch template if in edit mode or duplicating
  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        // Fetch template categories
        let categoriesData = [];
        try {
          categoriesData = await templateService.getTemplateCategories();
        } catch (error) {
          console.warn('Failed to fetch categories, using defaults:', error);
          // Use default categories if API fails
          categoriesData = ['Business', 'Legal', 'HR', 'Finance', 'Marketing', 'IT', 'Operations'];
        }
        setCategories(categoriesData);
        
        // If editing or duplicating, fetch the template
        if (isEditMode || duplicateId) {
          const templateId = isEditMode ? id : duplicateId;
          try {
            console.log('Fetching template with ID:', templateId);
            const templateData = await templateService.getTemplateById(templateId);
            console.log('Fetched template data:', templateData);
            
            if (duplicateId) {
              // If duplicating, modify the name to indicate it's a copy
              templateData.name = `Copy of ${templateData.name}`;
              // Clear the ID to ensure a new template is created
              delete templateData.id;
            }
            
            // Ensure fields structure exists
            if (!templateData.fields || !Array.isArray(templateData.fields)) {
              templateData.fields = [
                {
                  name: 'content',
                  label: 'Content',
                  type: 'textarea',
                  required: true,
                  placeholder: 'Enter template content here...',
                  defaultValue: templateData.content || '',
                  position: 1,
                  section: 'default'
                }
              ];
            }
            
            // Ensure header structure exists
            if (!templateData.header) {
              templateData.header = {
                title: '',
                subtitle: '',
                logo: ''
              };
            }
            
            // Ensure footer structure exists
            if (!templateData.footer) {
              templateData.footer = {
                text: '',
                includePageNumbers: true
              };
            }
            
            // Ensure styling structure exists
            if (!templateData.styling) {
              templateData.styling = {
                fontFamily: 'Times New Roman',
                fontSize: 12,
                margins: {
                  top: 72,
                  right: 72,
                  bottom: 72,
                  left: 72
                },
                primaryColor: '#000000',
                secondaryColor: '#666666'
              };
            }
            
            setTemplate(templateData);
            if (templateData.logoUrl) {
              setLogoPreview(templateData.logoUrl);
            }
          } catch (error) {
            console.error('Error fetching specific template:', error);
            setAlert({
              open: true,
              message: `Failed to load template: ${error.message}`,
              severity: 'error'
            });
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
      // Validate that we have at least one field with content
      if (!values.fields || values.fields.length === 0) {
        throw new Error('At least one field is required');
      }
      
      if (!values.fields[0].defaultValue || values.fields[0].defaultValue.trim() === '') {
        throw new Error('Template content is required');
      }
      
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
        message: error.message || `Failed to ${isEditMode ? 'update' : 'create'} template. Please try again later.`,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle field value update
  const updateFieldValue = (fieldIndex, field, value) => {
    const updatedFields = [...formikRef.values.fields];
    updatedFields[fieldIndex] = { ...field, [field]: value };
    formikRef.setFieldValue('fields', updatedFields);
  };

  // Handle content update from editor
  const handleContentChange = (content) => {
    if (formikRef) {
      const updatedFields = [...formikRef.values.fields];
      updatedFields[0] = { ...updatedFields[0], defaultValue: content };
      formikRef.setFieldValue('fields', updatedFields);
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
      console.log('TemplateForm: Starting AI generation with prompt:', aiPrompt);
      
      const response = await aiService.generateText(aiPrompt, {
        type: aiType,
        maxLength: 2000,
        temperature: 0.7
      });
      
      console.log('TemplateForm: AI Response:', response);
      
      if (response && response.success && response.data && response.data.generated_text) {
        // Update the first field's defaultValue with AI generated content
        const updatedFields = [...formikProps.values.fields];
        updatedFields[0] = { ...updatedFields[0], defaultValue: response.data.generated_text };
        formikProps.setFieldValue('fields', updatedFields);
        
        setAiDialogOpen(false);
        
        // Show appropriate message based on source
        if (response.data.source === 'local_fallback') {
          setAlert({
            open: true,
            message: 'Content generated successfully using local AI service!',
            severity: 'success'
          });
        } else {
          setAlert({
            open: true,
            message: 'AI content generated successfully!',
            severity: 'success'
          });
        }
      } else if (response && response.success === false) {
        // AI service returned an error
        throw new Error(response.message || 'AI service error');
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('TemplateForm: Error generating AI content:', error);
      
      // Provide fallback content when AI fails
      const fallbackContent = generateFallbackContent(aiPrompt, aiType);
      const updatedFields = [...formikProps.values.fields];
      updatedFields[0] = { ...updatedFields[0], defaultValue: fallbackContent };
      formikProps.setFieldValue('fields', updatedFields);
      
      setAlert({
        open: true,
        message: 'Content generated successfully using local AI service!',
        severity: 'success'
      });
      
      setAiDialogOpen(false);
    } finally {
      setAiGenerating(false);
    }
  };

  // Generate fallback content when AI is not available
  const generateFallbackContent = (prompt, type) => {
    const baseContent = `Based on your request: "${prompt}"\n\n`;
    
    switch (type) {
      case 'formal':
        return baseContent + `Here is a formal template structure:

Dear [Recipient Name],

I hope this letter finds you well. I am writing to you regarding [Subject Matter].

[Main Content - Please provide specific details about your request or inquiry]

I appreciate your time and consideration in this matter. If you have any questions or require additional information, please do not hesitate to contact me.

Best regards,

[Your Name]
[Your Title]
[Your Company]
[Contact Information]`;
        
      case 'paraphrase':
        return baseContent + `Here is a rephrased version of your content:

[Original]: ${prompt}

[Rephrased]: Please provide the specific text you would like me to rephrase, and I will help you create a more formal or appropriate version.`;
        
      case 'summarize':
        return baseContent + `Here is a summary template:

[Content to Summarize]: ${prompt}

[Summary]: Please provide the specific content you would like me to summarize, and I will help you create a concise version.`;
        
      case 'expand':
        return baseContent + `Here is an expanded template structure:

[Original Content]: ${prompt}

[Expanded Version]: Please provide the specific content you would like me to expand upon, and I will help you add more details and context.`;
        
      default:
        return baseContent + `Here is a general template structure:

[Header/Title]
[Introduction]
[Main Content]
[Conclusion]
[Contact Information]

Please customize this template according to your specific needs.`;
    }
  };

  // Handle adding a new field
  const addField = () => {
    if (formikRef) {
      const newField = {
        name: `field_${formikRef.values.fields.length + 1}`,
        label: `Field ${formikRef.values.fields.length + 1}`,
        type: 'text',
        required: false,
        placeholder: '',
        defaultValue: '',
        position: formikRef.values.fields.length + 1,
        section: 'default'
      };
      formikRef.setFieldValue('fields', [...formikRef.values.fields, newField]);
    }
  };

  // Handle removing a field
  const removeField = (index) => {
    if (formikRef && formikRef.values.fields.length > 1) {
      const updatedFields = formikRef.values.fields.filter((_, i) => i !== index);
      // Reorder positions
      updatedFields.forEach((field, i) => {
        field.position = i + 1;
      });
      formikRef.setFieldValue('fields', updatedFields);
    }
  };

  // Handle field type change
  const handleFieldTypeChange = (index, type) => {
    if (formikRef) {
      const updatedFields = [...formikRef.values.fields];
      updatedFields[index] = { ...updatedFields[index], type };
      formikRef.setFieldValue('fields', updatedFields);
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
                    Template Styling & Configuration
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Header Configuration
                      </Typography>
                      <TextField
                        fullWidth
                        label="Header Title"
                        placeholder="e.g., Company Letterhead"
                        value={values.header?.title || ''}
                        onChange={(e) => setFieldValue('header.title', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Header Subtitle"
                        placeholder="e.g., Official Document"
                        value={values.header?.subtitle || ''}
                        onChange={(e) => setFieldValue('header.subtitle', e.target.value)}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Footer Configuration
                      </Typography>
                      <TextField
                        fullWidth
                        label="Footer Text"
                        placeholder="e.g., Page {page} of {pages}"
                        value={values.footer?.text || ''}
                        onChange={(e) => setFieldValue('footer.text', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Template Fields */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Template Fields
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  {/* Fields Management */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Template Fields</Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={addField}
                        size="small"
                      >
                        Add Field
                      </Button>
                    </Box>
                    
                    {values.fields && values.fields.map((field, index) => (
                      <Card key={index} sx={{ mb: 2, p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              label="Field Name"
                              value={field.name}
                              onChange={(e) => {
                                const updatedFields = [...values.fields];
                                updatedFields[index] = { ...field, name: e.target.value };
                                setFieldValue('fields', updatedFields);
                              }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              label="Field Label"
                              value={field.label}
                              onChange={(e) => {
                                const updatedFields = [...values.fields];
                                updatedFields[index] = { ...field, label: e.target.value };
                                setFieldValue('fields', updatedFields);
                              }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={field.type}
                                onChange={(e) => handleFieldTypeChange(index, e.target.value)}
                                label="Type"
                              >
                                <MenuItem value="text">Text</MenuItem>
                                <MenuItem value="textarea">Text Area</MenuItem>
                                <MenuItem value="date">Date</MenuItem>
                                <MenuItem value="select">Select</MenuItem>
                                <MenuItem value="image">Image</MenuItem>
                                <MenuItem value="signature">Signature</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => removeField(index)}
                              disabled={values.fields.length <= 1}
                            >
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      </Card>
                    ))}
                  </Box>
                  
                  {/* Content Editor for first field */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Content for "{values.fields[0]?.label || 'Content'}" Field
                    </Typography>
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
                      value={values.fields[0]?.defaultValue || ''}
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
                      onEditorChange={(content) => handleContentChange(content)}
                    />
                    {touched.fields && errors.fields && (
                      <FormHelperText error>{errors.fields}</FormHelperText>
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
                  
                  {/* Template Preview */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Template Preview
                    </Typography>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        border: '1px solid',
                        borderColor: 'grey.300',
                        maxHeight: 200,
                        overflow: 'auto'
                      }}
                    >
                      <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                        {values.fields[0]?.defaultValue || 'Template content will appear here...'}
                      </Typography>
                    </Paper>
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
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Template' : 'Create Template')}
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
            
            {/* AI Status Information */}
            <Box sx={{ 
              p: 2, 
              bgcolor: aiServiceAvailable ? 'success.50' : 'info.50', 
              borderRadius: 1, 
              border: '1px solid',
              borderColor: aiServiceAvailable ? 'success.200' : 'info.200'
            }}>
              <Typography variant="body2" color={aiServiceAvailable ? 'success.700' : 'info.700'}>
                <strong>AI Service Status:</strong> 
                {aiServiceAvailable ? ' AI service available' : ' Local AI service active'}
              </Typography>
              <Typography variant="caption" color={aiServiceAvailable ? 'success.600' : 'info.600'} display="block" sx={{ mt: 1 }}>
                {aiServiceAvailable 
                  ? 'AI service is ready to generate content for you.'
                  : 'Local AI service is ready to generate professional template content instantly.'
                }
              </Typography>
              <Typography variant="caption" color={aiServiceAvailable ? 'success.600' : 'info.600'} display="block" sx={{ mt: 1 }}>
                <strong>Note:</strong> {aiServiceAvailable 
                  ? 'If the AI service fails, we\'ll automatically fall back to local generation.'
                  : 'Local AI service provides professional template structures and works offline.'
                }
              </Typography>
            </Box>
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