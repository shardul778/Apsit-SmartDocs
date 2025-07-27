import React from 'react';
import { useParams } from 'react-router-dom';
import UserForm from '../../components/users/UserForm';

const UserEditPage = () => {
  const { id } = useParams();
  return <UserForm mode="edit" userId={id} />;
};

export default UserEditPage;