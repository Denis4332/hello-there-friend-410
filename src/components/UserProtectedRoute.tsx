import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

export const UserProtectedRoute = ({ children }: UserProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  // No timeout redirect - let the auth state resolve naturally
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lädt...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to auth with next param
  if (!user) {
    const nextPath = location.pathname + location.search;
    return <Navigate to={`/auth?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  return <>{children}</>;
};
