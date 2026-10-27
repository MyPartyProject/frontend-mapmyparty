import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function TeamAccess({ children, owner = false }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  if (loading) return <p className="p-4 text-sm" role="status">Checking session…</p>;
  if (!isAuthenticated) return <Navigate to={`/team/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  const allowed = owner ? ['SUPER_ADMIN'] : ['SUPER_ADMIN', 'ADMIN', 'SOCIAL_MEDIA_AGENT'];
  if (!(user?.roles || [user?.role]).some(role => allowed.includes(role))) return <div className="p-4 text-sm" role="alert">You do not have access to this workspace.</div>;
  return children;
}
