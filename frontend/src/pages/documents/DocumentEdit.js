import React from 'react';
import { useParams } from 'react-router-dom';
import DocumentForm from '../../components/documents/DocumentForm';

const DocumentEditPage = () => {
  const { id } = useParams();
  return <DocumentForm mode="edit" documentId={id} />;
};

export default DocumentEditPage;