import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Este componente verifica a autenticação e autorização do usuário.
 * - Se o usuário não estiver logado, redireciona para /login.
 * - Se a rota exigir um grupo específico e o usuário não pertencer a ele, redireciona para a página inicial.
 */
const ProtectedRoute = ({ allowedGroups }) => {
  const { user, token } = useAuth();

  // Se não há token, o usuário não está autenticado.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Se a rota exige um grupo específico (ex: 'Admin')
  if (allowedGroups && user && !allowedGroups.includes(user.group)) {
    // Redireciona para a página inicial se o usuário não tiver permissão.
    return <Navigate to="/" replace />;
  }

  // Se tudo estiver OK, renderiza a página solicitada.
  return <Outlet />;
};

export default ProtectedRoute;
