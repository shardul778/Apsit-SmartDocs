import React from 'react';
import { useParams } from 'react-router-dom';
import TemplateForm from '../../components/templates/TemplateForm';

const TemplateEditPage = () => {
  const { id } = useParams();
  return <TemplateForm mode="edit" templateId={id} />;
};

export default TemplateEditPage;