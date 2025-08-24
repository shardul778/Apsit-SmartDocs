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
        console.log('TemplateForm: Available AI models:', models);
        
        // Check if we have real AI models (not just local fallback)
        const hasRealModels = models.data && models.data.some(model => 
          model.provider && 
          (model.provider.includes('Google Gemini') || 
           model.provider.includes('Hugging Face') || 
           model.provider.includes('Ollama'))
        );
        
        setAiServiceAvailable(hasRealModels);
        console.log('TemplateForm: AI service available:', hasRealModels);
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
      logo: '/DS_header.png' // Fixed header image path only
    },
    footer: {
      text: '{pagenumber}', // Fixed footer with page number
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
            
                         // Ensure header structure exists with fixed values
             if (!templateData.header) {
               templateData.header = {
                 logo: '/DS_header.png'
               };
             } else {
               // Ensure logo is always set to fixed image
               templateData.header.logo = '/DS_header.png';
             }
             
             // Ensure footer structure exists with fixed values
             if (!templateData.footer) {
               templateData.footer = {
                 text: '{pagenumber}',
                 includePageNumbers: true
               };
             } else {
               // Ensure footer text is always set to fixed format
               templateData.footer.text = '{pagenumber}';
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
        // Process the generated text to convert markdown to HTML and preserve formatting
        let formattedText = response.data.generated_text;
        
        // Convert markdown-style formatting to HTML
        formattedText = formattedText
          // Convert markdown bold to HTML strong
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // Convert markdown italic to HTML em
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          // Convert markdown headers to HTML headers
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          // Convert markdown lists
          .replace(/^\* (.*$)/gim, '<li>$1</li>')
          .replace(/^- (.*$)/gim, '<li>$1</li>')
          // Convert markdown numbered lists
          .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
          // Ensure proper line breaks and spacing are preserved
          .replace(/\n\n/g, '</p><p>') // Convert double line breaks to paragraph breaks
          .replace(/\n/g, '<br>') // Convert single line breaks to HTML line breaks
          .replace(/^/, '<p>') // Start with opening paragraph tag
          .replace(/$/, '</p>'); // End with closing paragraph tag
        
        // Wrap lists properly
        formattedText = formattedText
          .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
          .replace(/<\/ul>\s*<ul>/g, ''); // Remove duplicate ul tags
        
        // Update the first field's defaultValue with formatted AI generated content
        const updatedFields = [...formikProps.values.fields];
        updatedFields[0] = { ...updatedFields[0], defaultValue: formattedText };
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
            message: 'Content generated successfully using Google Gemini AI!',
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
      
      // Show error message instead of using fallback content
      setAlert({
        open: true,
        message: `AI generation failed: ${error.message}. Please try again or contact support.`,
        severity: 'error'
      });
      
      setAiError(`Generation failed: ${error.message}`);
    } finally {
      setAiGenerating(false);
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
                          Header Configuration (Fixed)
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" sx={{ mr: 2 }}>
                            Header Image:
                          </Typography>
                                                     <Box 
                             component="img" 
                             src="/DS_header.png" 
                             alt="APSIT Header" 
                             sx={{ 
                               width: 200, 
                               height: 60, 
                               objectFit: 'contain',
                               border: '1px solid #ddd',
                               borderRadius: 1
                             }} 
                           />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Fixed header image: DS_header.png (no text content)
                        </Typography>
                      </Grid>
                    
                                         <Grid item xs={12} md={6}>
                       <Typography variant="subtitle2" gutterBottom>
                         Footer Configuration (Fixed)
                       </Typography>
                       <TextField
                         fullWidth
                         label="Footer Text"
                         value={values.footer?.text || '{pagenumber}'}
                         onChange={(e) => setFieldValue('footer.text', e.target.value)}
                         sx={{ mb: 2 }}
                         helperText="Fixed format: {pagenumber} will be replaced with actual page numbers"
                       />
                       <Typography variant="caption" color="text.secondary">
                         Footer will automatically show page numbers in format: 1, 2, 3, etc.
                       </Typography>
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
                      <Typography variant="subtitle2" gutterBottom sx={{ 
                        fontWeight: 'bold',
                        color: '#1a1a1a',
                        mb: 2
                      }}>
                        📄 Template Preview
                      </Typography>
                      <Paper 
                        sx={{ 
                          p: 3, 
                          bgcolor: 'white', 
                          color: 'black',
                          border: '2px solid',
                          borderColor: '#e0e0e0',
                          maxHeight: 400,
                          overflow: 'auto',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          borderRadius: 2
                        }}
                      >
                                               {/* Header Preview */}
                        <Box sx={{ 
                          mb: 2, 
                          textAlign: 'center', 
                          borderBottom: '1px solid #ddd', 
                          pb: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          p: 2
                        }}>
                                                     <Box 
                             component="img" 
                             src="/DS_header.png" 
                             alt="APSIT Header" 
                             sx={{ 
                               width: 200, 
                               height: 60, 
                               objectFit: 'contain',
                               filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                             }} 
                           />
                        </Box>
                       
                                               {/* Content Preview */}
                        <Box sx={{ mb: 2, minHeight: 100, p: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
                          {values.fields[0]?.defaultValue ? (
                            <Typography 
                              variant="body2" 
                              component="div" 
                              dangerouslySetInnerHTML={{
                                __html: values.fields[0]?.defaultValue
                              }}
                              sx={{ 
                                '& p': { margin: '0.5em 0', lineHeight: 1.6 },
                                '& br': { display: 'block', margin: '0.2em 0' },
                                '& strong': { fontWeight: 'bold' },
                                '& em': { fontStyle: 'italic' },
                                '& ul, & ol': { margin: '0.5em 0', paddingLeft: '1.5em' },
                                '& li': { margin: '0.2em 0' }
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Template content will appear here... Use the editor above or AI generation to add content.
                            </Typography>
                          )}
                        </Box>
                       
                                               {/* Footer Preview */}
                        <Box sx={{ 
                          textAlign: 'center', 
                          borderTop: '1px solid #ddd', 
                          pt: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          p: 2
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                            Page <strong>1</strong> of <strong>1</strong>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Footer format: {values.footer?.text || '{pagenumber}'} → Will show as: 1, 2, 3, etc.
                          </Typography>
                        </Box>
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
               bgcolor: aiServiceAvailable ? 'success.50' : 'warning.50', 
               borderRadius: 1, 
               border: '1px solid',
               borderColor: aiServiceAvailable ? 'success.200' : 'warning.200'
             }}>
               <Typography variant="body2" color={aiServiceAvailable ? 'success.700' : 'warning.700'}>
                 <strong>AI Service Status:</strong> 
                 {aiServiceAvailable ? ' Google Gemini AI available' : ' AI service unavailable'}
               </Typography>
               <Typography variant="caption" color={aiServiceAvailable ? 'success.600' : 'warning.600'} display="block" sx={{ mt: 1 }}>
                 {aiServiceAvailable 
                   ? 'Google Gemini AI is ready to generate high-quality content for your templates.'
                   : 'AI service is currently unavailable. Please try again later or contact support.'
                 }
               </Typography>
               <Typography variant="caption" color={aiServiceAvailable ? 'success.600' : 'warning.600'} display="block" sx={{ mt: 1 }}>
                 <strong>Note:</strong> {aiServiceAvailable 
                   ? 'Using Google Gemini AI for advanced content generation. No fallback content will be provided.'
                   : 'Please ensure the backend server is running and Gemini API is properly configured.'
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