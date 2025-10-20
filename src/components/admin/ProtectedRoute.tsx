import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // TODO Auth: Replace with proper JWT/Session validation
  // SECURITY WARNING: localStorage is NOT secure for production!
  const isAuthed = localStorage.getItem('escoria_authed') === 'true';
  
  if (!isAuthed) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};
