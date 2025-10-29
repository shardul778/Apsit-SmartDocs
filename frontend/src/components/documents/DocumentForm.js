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
  ArrowBack as ArrowBackIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetZoomIcon
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
  const [zoom, setZoom] = useState(1);
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
          // Normalize backend shape for the form/editor
          const normalized = {
            title: data.title || '',
            category: data.metadata?.category || '',
            department: data.metadata?.department || user?.department || '',
            content: typeof data.content === 'string' ? data.content : (data.content?.body || ''),
            templateId: data.template?.id || data.template?._id || data.templateId || '',
          };
          setDocument(normalized);
          // Check if user has permission to edit
          if ((data.userId || data.createdBy?._id || data.createdBy?.id) !== (user?.id || user?._id) && user?.role !== 'admin') {
            setAlert({
              open: true,
              message: 'You do not have permission to edit this document',
              severity: 'error'
            });
            setTimeout(() => navigate('/documents'), 2000);
          }
          // Check if document is in draft status (allow admins to edit any status)
          if (data.status !== 'draft' && user?.role !== 'admin') {
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.1).toFixed(2))))}
                        startIcon={<ZoomOutIcon />}
                      >
                        Zoom Out
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setZoom(1)}
                        startIcon={<ResetZoomIcon />}
                      >
                        100%
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setZoom((z) => Math.min(2, parseFloat((z + 0.1).toFixed(2))))}
                        startIcon={<ZoomInIcon />}
                      >
                        Zoom In
                      </Button>
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {Math.round(zoom * 100)}%
                      </Typography>
                    </Box>
                    <Editor
                      key={`${editorKey}-${zoom}`}
                      apiKey="n0r9qv8xkmaybvmvjcoli20a4x7rznaa8bxoc6am16em7d03" // Replace with your TinyMCE API key
                      value={values.content}
                      init={{
                        height: 1000,
                        menubar: true,
                        plugins: [
                          'advlist autolink lists link image charmap print preview anchor',
                          'searchreplace visualblocks code fullscreen pagebreak',
                          'insertdatetime media table paste code help wordcount'
                        ],
                        toolbar: 'undo redo | formatselect | bold italic backcolor | pagebreak | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | aitext templates citation tableofcontents | removeformat | help',
                        pagebreak_split_block: true,
                        pagebreak_separator: '<div style="page-break-before:always"></div>',
                        content_style:
                          `html { background: #eaeaea; }` +
                          `body.mce-content-body { background: transparent; padding: 12px 0; margin: 0; color: #000; zoom: ${zoom}; }` +
                          `.page { width: 210mm; height: 297mm; margin: 12px auto; background: #ffffff; box-shadow: 0 6px 18px rgba(0,0,0,0.15); border: 1px solid #ddd; border-radius: 2px; box-sizing: border-box; padding: 20mm 15mm; overflow: hidden; }` +
                          'body.mce-content-body p { color: #000; }' +
                          'hr.mce-pagebreak, .mce-pagebreak { position: relative; height: 0; border: 0; border-top: 2px dashed #9e9e9e; margin: 18px auto; width: 210mm; }' +
                          '.mce-pagebreak:before { content: "Page Break"; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #fff; color: #666; font-size: 11px; padding: 0 6px; }' +
                          '@media print { html { background: transparent; } body.mce-content-body { padding: 0; margin: 0; zoom: 1; } .page { box-shadow: none; border: none; margin: 0; page-break-after: always; } .page:last-child { page-break-after: auto; } .mce-pagebreak { display: none; } }',
                        setup: (editor) => {
                          aiTextPlugin(editor);
                          let lastAutoBreak = 0;
                          const getMmToPx = () => {
                            const doc = editor.getDoc();
                            const test = doc.createElement('div');
                            test.style.width = '10mm';
                            test.style.position = 'absolute';
                            test.style.visibility = 'hidden';
                            doc.body.appendChild(test);
                            const px = test.getBoundingClientRect().width;
                            doc.body.removeChild(test);
                            return px / 10;
                          };
                          // Ensure first .page wrapper exists
                          const ensureFirstPageWrapper = () => {
                            const body = editor.getBody();
                            if (!body) return;
                            if (!body.querySelector('div.page')) {
                              const first = editor.getDoc().createElement('div');
                              first.className = 'page';
                              // move existing children into first page
                              const nodes = Array.from(body.childNodes);
                              body.appendChild(first);
                              nodes.forEach((n) => {
                                if (n !== first) first.appendChild(n);
                              });
                            }
                          };
                          const tryAutoPageBreak = (force) => {
                            const now = Date.now();
                            if (!force && (now - lastAutoBreak < 200)) return;
                            const bodyEl = editor.getBody();
                            if (!bodyEl) return;
                            const mmToPx = getMmToPx();
                            const pageHeightPx = 297 * mmToPx;
                            // Measure within current .page container
                            const selNode = editor.selection.getNode();
                            const block = editor.dom.getParent(selNode, editor.dom.isBlock) || selNode;
                            const currentPage = block.closest('div.page') || bodyEl;
                            const blockBottom = block.offsetTop + block.offsetHeight;
                            const posInPage = blockBottom;
                            if (posInPage <= pageHeightPx - (10 * mmToPx)) return;
                            editor.undoManager.transact(() => {
                              // If a next page already exists, just move caret into it and avoid creating duplicates
                              const nextPage = currentPage.nextElementSibling && currentPage.nextElementSibling.classList?.contains('page')
                                ? currentPage.nextElementSibling
                                : null;
                              if (nextPage) {
                                const doc = editor.getDoc();
                                let target = nextPage.firstChild;
                                if (!target) {
                                  target = doc.createElement('p');
                                  target.innerHTML = '<br />';
                                  nextPage.appendChild(target);
                                }
                                const rng2 = doc.createRange();
                                rng2.setStart(target, 0);
                                rng2.collapse(true);
                                editor.selection.setRng(rng2);
                                return;
                              }
                              // Otherwise insert a break, create exactly one new page, and move following siblings into it
                              editor.selection.select(block, true);
                              editor.selection.collapse(false);
                              editor.insertContent('<hr class="mce-pagebreak" />');
                              const body = editor.getBody();
                              const brk = body.querySelector('hr.mce-pagebreak:last-of-type, .mce-pagebreak:last-of-type');
                              if (!brk) return;
                              const doc = editor.getDoc();
                              const newPage = doc.createElement('div');
                              newPage.className = 'page';
                              const pageParent = currentPage.parentNode || body;
                              pageParent.insertBefore(newPage, currentPage.nextSibling);
                              // Move nodes after the break into new page (only siblings after break within currentPage)
                              let cursor = brk.nextSibling;
                              while (cursor) {
                                const node = cursor;
                                cursor = node.nextSibling;
                                newPage.appendChild(node);
                              }
                              // place caret into new page
                              let para = newPage.firstChild;
                              if (!para) {
                                para = doc.createElement('p');
                                para.innerHTML = '<br />';
                                newPage.appendChild(para);
                              }
                              const rng2 = doc.createRange();
                              rng2.setStart(para, 0);
                              rng2.collapse(true);
                              editor.selection.setRng(rng2);
                            });
                            lastAutoBreak = now;
                          };
                          editor.on('init', ensureFirstPageWrapper);
                          editor.on('SetContent', ensureFirstPageWrapper);
                          editor.on('keydown', (e) => {
                            if (e.keyCode === 13) { // Enter
                              const rng = editor.selection.getRng();
                              if (rng && rng.collapsed) {
                                // If at end of a page, insert break instead of normal newline
                                const mm = getMmToPx();
                                const pageHeightPx = 297 * mm;
                                const selNode = editor.selection.getNode();
                                const block = editor.dom.getParent(selNode, editor.dom.isBlock) || selNode;
                                const page = block.closest('div.page') || editor.getBody();
                                const blockBottom = block.offsetTop + block.offsetHeight;
                                // Only when on last line (no next element sibling)
                                const nextEl = block.nextElementSibling;
                                if (!nextEl && blockBottom > pageHeightPx - (8 * mm)) {
                                  e.preventDefault();
                                  tryAutoPageBreak(true);
                                }
                              }
                            }
                          });
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