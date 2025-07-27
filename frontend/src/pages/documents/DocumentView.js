import React from 'react';
import { useParams } from 'react-router-dom';
import DocumentViewer from '../../components/documents/DocumentViewer';

const DocumentViewPage = () => {
  const { id } = useParams();
  return <DocumentViewer documentId={id} />;
};

export default DocumentViewPage;