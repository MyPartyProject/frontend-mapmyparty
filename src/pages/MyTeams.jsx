import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CopyButton, Pager, QueryState } from '@/components/team/TeamShared';

export default function MyTeams() {
  const [filters, setFilters] = useState({ page: 1, q: '', role: '' });
  const [editor, setEditor] = useState(null);
  const [mode, setMode] = useState('new');
  const [search, setSearch] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const catalog = useQuery({ queryKey: ['team-roles'], queryFn: async () => (await apiFetch('promoter/team/roles')).data });
  const members = useQuery({ queryKey: ['team-members', filters], queryFn: async () => (await apiFetch(`promoter/team/members?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== ''))}`)).data, staleTime: 0, refetchOnMount: true });
  const candidates = useQuery({ queryKey: ['team-candidates', search], queryFn: async () => (await apiFetch(`promoter/team/candidates?q=${encodeURIComponent(search)}`)).data, enabled: Boolean(editor && mode === 'existing' && search.length >= 3), staleTime: 0 });
  function open(member = {}) { setEditor(member); setMode(member.id ? 'edit' : 'new'); setSelectedRoles(member.roles?.filter(r => catalog.data?.some(c => c.name === r && c.assignable)) || ['SOCIAL_MEDIA_AGENT']); setError(''); setSearch(''); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const body = mode === 'new' ? { ...fields, roles: selectedRoles } : { ...(mode === 'existing' ? { userId: editor.id } : {}), roles: selectedRoles };
      if (mode === 'existing' && !editor.id) throw new Error('Select an existing account.');
      await apiFetch(mode === 'edit' ? `promoter/team/members/${editor.id}/roles` : 'promoter/team/members', { method: mode === 'edit' ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      toast.success('Team updated'); setEditor(null); await Promise.all([members.refetch(), catalog.refetch()]);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="p-4 space-y-4 text-foreground">
    <header className="flex items-center justify-between gap-3"><div><h1 className="text-xl font-semibold">My Teams</h1><p className="text-sm text-muted-foreground">Manage platform team access.</p></div><Button size="sm" onClick={() => open()} disabled={!catalog.data}>Add member</Button></header>
    <QueryState query={catalog} />
    <div className="flex flex-wrap gap-2"><Button size="sm" variant={!filters.role ? 'default' : 'outline'} onClick={() => setFilters({ ...filters, role: '', page: 1 })}>All roles</Button>{catalog.data?.map(role => <Button key={role.name} size="sm" variant={filters.role === role.name ? 'default' : 'outline'} disabled={role.deferred} onClick={() => setFilters({ ...filters, role: role.name, page: 1 })}>{role.label}{role.deferred ? ' · Coming later' : ` (${role.count ?? 0})`}</Button>)}</div>
    <Input aria-label="Search team" placeholder="Search name, email or user ID" value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value, page: 1 })} className="max-w-md" />
    <QueryState query={members} />
    {!members.isPending && !members.isError && <><div className="rounded-lg border divide-y bg-card">{members.data.items.length ? members.data.items.map(member => <div key={member.id} className="p-3 flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium">{member.name} {member.isSuspended && <Badge variant="secondary">Suspended</Badge>}</p><div className="text-sm text-muted-foreground break-all">{member.email}<CopyButton value={member.email} label="Copy email" /></div><div className="flex flex-wrap gap-1">{member.roles.map(role => <Badge key={role} variant="secondary">{catalog.data?.find(r => r.name === role)?.label || role}</Badge>)}</div></div><Button size="sm" variant="outline" disabled={!catalog.data || member.roles.includes('SUPER_ADMIN')} onClick={() => open(member)}>Manage roles</Button></div>) : <p className="p-4 text-sm text-muted-foreground">No team members match your search.</p>}</div><Pager {...members.data} onChange={page => setFilters({ ...filters, page })} /></>}
    <Dialog open={Boolean(editor)} onOpenChange={open => { if (!open && !busy) setEditor(null); }}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle className="text-lg">{mode === 'edit' ? 'Manage roles' : 'Add team member'}</DialogTitle><DialogDescription>Roles add permissions. Admin grants existing platform administration access.</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-3">
        {mode !== 'edit' && <div className="flex gap-2"><Button type="button" size="sm" variant={mode === 'new' ? 'default' : 'outline'} onClick={() => { setMode('new'); setEditor({}); }}>Create account</Button><Button type="button" size="sm" variant={mode === 'existing' ? 'default' : 'outline'} onClick={() => { setMode('existing'); setEditor({}); }}>Existing account</Button></div>}
        {mode === 'new' && <>{[['name', 'Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone (optional, 10 digits)', 'tel'], ['password', 'Initial password', 'password']].map(([name, label, type]) => <label key={name} className="block text-sm">{label}<Input name={name} type={type} required={name !== 'phone'} autoComplete={name === 'password' ? 'new-password' : 'off'} /></label>)}<p className="text-xs text-muted-foreground">Password: 8+ characters with uppercase, lowercase, number and special character. Share credentials privately; passwords are never displayed again.</p></>}
        {mode === 'existing' && <><Input aria-label="Find account" value={search} onChange={e => setSearch(e.target.value)} placeholder="Enter at least 3 characters" />{search.length >= 3 && <QueryState query={candidates} />}<div className="max-h-40 overflow-auto space-y-1">{candidates.data?.items.map(user => <button type="button" key={user.id} onClick={() => setEditor(user)} className={`w-full text-left rounded border p-2 text-sm ${editor?.id === user.id ? 'bg-accent' : 'bg-background'}`}>{user.name} · {user.email}</button>)}</div></>}
        {editor?.id && <p className="text-sm">Selected: {editor.name} · {editor.email}</p>}
        <fieldset className="space-y-2"><legend className="text-sm font-medium mb-2">Assigned team roles</legend>{catalog.data?.filter(role => role.assignable).map(role => <label key={role.name} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedRoles.includes(role.name)} onChange={e => setSelectedRoles(e.target.checked ? [...selectedRoles, role.name] : selectedRoles.filter(r => r !== role.name))} />{role.label}</label>)}</fieldset>
        {mode === 'edit' && selectedRoles.length === 0 && <p className="text-sm text-destructive">Saving removes all editable team roles. The account and other roles remain.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button disabled={busy || (mode !== 'edit' && !selectedRoles.length)}>{busy ? 'Saving…' : 'Save access'}</Button>
      </form>
    </DialogContent></Dialog>
  </section>;
}
