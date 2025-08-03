import React from 'react';
import { useParams } from 'react-router-dom';
import TemplateDetail from '../../components/templates/TemplateDetail';

const TemplateDetailPage = () => {
  const { id } = useParams();
  return <TemplateDetail templateId={id} />;
};

export default TemplateDetailPage;