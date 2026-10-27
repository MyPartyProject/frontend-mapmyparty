import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeToggle from '@/components/ThemeToggle';

export default function TeamLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(params.get('reset') === 'success' ? 'Password reset. Sign in with your new password.' : '');
  const [reset, setReset] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (reset) { await apiFetch('auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: values.email, role: 'SOCIAL_MEDIA_AGENT' }) }); setMessage('If this account exists, a password reset link will be sent.'); return; }
      const session = await login(values);
      if (!(session.user.roles || []).some(r => ['ADMIN', 'SUPER_ADMIN', 'SOCIAL_MEDIA_AGENT'].includes(r))) { await logout(); throw new Error('This account has no team access.'); }
      const redirect = params.get('redirect');
      navigate(redirect?.startsWith('/team/events') ? redirect : '/team/events', { replace: true });
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-background text-foreground grid place-items-center p-4"><div className="w-full max-w-sm rounded-lg border bg-card p-5 space-y-4">
    <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Team sign in</h1><ThemeToggle compact /></div>
    <p className="text-sm text-muted-foreground">Access your assigned MapMyParty workspace.</p>
    <form onSubmit={submit} className="space-y-3"><label className="block text-sm">Email<Input name="email" type="email" autoComplete="username" required /></label>
      {!reset && <label className="block text-sm">Password<Input name="password" type="password" autoComplete="current-password" required /></label>}
      <Button disabled={busy} className="w-full">{busy ? 'Please wait…' : reset ? 'Send reset link' : 'Sign in'}</Button></form>
    {message && <p role="status" className="text-sm">{message}</p>}
    <Button variant="link" onClick={() => { setReset(!reset); setMessage(''); }}>{reset ? 'Back to sign in' : 'Forgot password?'}</Button><Link className="text-sm underline" to="/">Home</Link>
  </div></main>;
}
