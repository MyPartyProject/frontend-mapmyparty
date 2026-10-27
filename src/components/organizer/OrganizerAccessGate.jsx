import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { clearOrganizerOnboardingCache } from '@/services/organizerOnboardingService';
import OrganizerSupport from '@/pages/OrganizerSupport';
import { Button } from '@/components/ui/button';

export default function OrganizerAccessGate({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const [access, setAccess] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    let checking = false;
    let accessVersion = 0;
    const restrict = (status) => {
      if (!mounted) return;
      if (status.isSuspended) {
        queryClient.clear();
        clearOrganizerOnboardingCache();
      }
      setAccess(status);
      setFailed(false);
    };
    const check = async () => {
      if (checking) return;
      checking = true;
      const requestVersion = accessVersion;
      try {
        const response = await apiFetch('organizer/me/access-status', { cache: 'no-store' });
        if (requestVersion !== accessVersion) {
          checking = false;
          return check();
        }
        if (typeof response?.data?.isSuspended !== 'boolean') throw new Error('Invalid access status');
        restrict(response.data);
      } catch {
        if (mounted) {
          setFailed(true);
          setAccess(current => current?.isSuspended ? current : null);
        }
      } finally { checking = false; }
    };
    const suspended = () => {
      accessVersion += 1;
      restrict({ isSuspended: true });
      check();
    };
    check();
    const interval = window.setInterval(check, 15000);
    window.addEventListener('focus', check);
    window.addEventListener('organization:suspended', suspended);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', check);
      window.removeEventListener('organization:suspended', suspended);
    };
  }, [user.id, queryClient]);

  if (!access) return <div className="min-h-screen bg-background p-6 text-sm text-foreground" role="status">
    {failed ? 'Unable to verify organizer access. Please refresh to retry.' : 'Checking organizer access…'}
  </div>;
  if (!access.isSuspended) return children;
  if (pathname !== '/organizer/support') return <Navigate to="/organizer/support" replace />;

  return <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <div className="rounded-lg border border-border bg-card p-4" role="status">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">Organization suspended</p>
          <div className="flex items-center gap-3">
            {user.roles?.includes('USER') && <Link className="text-sm underline" to="/dashboard">Customer account</Link>}
            {user.roles?.includes('ADMIN') && <Link className="text-sm underline" to="/promoter">Admin workspace</Link>}
            <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Only support is available for this organization.</p>
        {access.suspensionReason && <p className="mt-2 text-sm">{access.suspensionReason}</p>}
      </div>
    </div>
    <OrganizerSupport />
  </main>;
}
