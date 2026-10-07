import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, KeyRound, Pencil, Plus, Power } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EntryAgentPassword from '@/components/EntryAgentPassword';
import './entry-agent-management.css';
import { apiFetch } from '@/config/api';
import { agentDate } from '@/services/entryAgentService';

const card = 'rounded-xl border border-border bg-card p-3';
const field = 'mt-1 min-h-[36px] w-full rounded-lg border border-input bg-background px-3 py-2';
const button = 'inline-flex min-h-[34px] items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 font-medium disabled:opacity-50';
const call = async (path = '', options = {}) => (await apiFetch(`organizer/entry-agents${path}`, { cache: 'no-store', ...options })).data;

function AgentForm({ agent, onSaved, onCancel, showTitle = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    const values = Object.fromEntries(form.entries());
    setBusy(true); setError('');
    try { const saved = await call(agent ? `/${agent.id}` : '', { method: agent ? 'PATCH' : 'POST', body: JSON.stringify(values) }); onSaved(saved); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <form className="space-y-3" onSubmit={submit}>
    {showTitle && <h3 className="font-semibold">Create entry agent</h3>}
    <div className="grid gap-3 sm:grid-cols-2">
      <label>Name<input className={field} name="name" required maxLength={100} defaultValue={agent?.name || ''} /></label>
      {!agent && <label>Agent ID<input className={field} name="agentId" required minLength={4} maxLength={32} pattern="[a-zA-Z0-9][a-zA-Z0-9_-]{3,31}" autoCapitalize="none" autoCorrect="off" /><span className="text-xs text-muted-foreground">4–32 letters, numbers, underscores or hyphens. Cannot be changed later.</span></label>}
      {!agent && <label className="sm:col-span-2">Password<EntryAgentPassword className={field} name="password" required minLength={8} maxLength={72} autoComplete="new-password" /><span className="text-xs text-muted-foreground">Include uppercase, lowercase, a number, and a special character (@$!%*?&). Share it personally; it cannot be retrieved later.</span></label>}
      <label>Phone (optional)<input className={field} name="phone" type="tel" maxLength={25} defaultValue={agent?.phone || ''} /></label>
      <label>Email (optional)<input className={field} name="email" type="email" maxLength={254} defaultValue={agent?.email || ''} /></label>
    </div>
    <label className="block">General guidelines<textarea className={field} name="guidelines" rows={2} maxLength={5000} defaultValue={agent?.guidelines || ''} /></label>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex gap-2"><button disabled={busy} className={`${button} bg-primary text-primary-foreground`}>{busy ? 'Saving…' : 'Save agent'}</button><button type="button" className={button} disabled={busy} onClick={onCancel}>Cancel</button></div>
  </form>;
}

function AgentDialog({ open, onClose, title, children, width = 640 }) {
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <DialogContent style={{ maxWidth: width }} className="entry-agent-ui w-[calc(100%-32px)] max-h-[85dvh] overflow-y-auto rounded-xl bg-card p-4 gap-3">
      <DialogTitle className="pr-8">{title}</DialogTitle>
      <DialogDescription className="sr-only">Manage your entry team and event access.</DialogDescription>
      {children}
    </DialogContent>
  </Dialog>;
}

export function EntryAgentAssignments({ eventId }) {
  const [open, setOpen] = useState(false);
  return <div className="entry-agent-ui">
    <button className={button} onClick={() => setOpen(true)}>Entry agents</button>
    <AgentDialog open={open} onClose={() => setOpen(false)} title="Event entry agents">
      <AssignmentEditor key={eventId} eventId={eventId} onClose={() => setOpen(false)} />
    </AgentDialog>
  </div>;
}

function AssignmentEditor({ eventId, onClose }) {
  const [agents, setAgents] = useState([]);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const initialized = useRef(false);
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++requestId.current;
    try {
      const [list, detail] = await Promise.all([call(), call(`/events/${eventId}?page=${page}`)]);
      if (request !== requestId.current) return;
      setAgents(list); setData(detail); setError('');
      if (!initialized.current) { setSelected(detail.agentIds); setInstructions(detail.event.entryInstructions); initialized.current = true; }
    } catch (err) { if (request === requestId.current) setError(err.message); }
  }, [eventId, page]);
  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => { if (!document.hidden) refresh(); }, 15000);
    return () => { ++requestId.current; window.clearInterval(timer); };
  }, [refresh]);
  const save = async () => {
    setBusy(true); setMessage(''); setError('');
    try { await call(`/events/${eventId}`, { method: 'PUT', body: JSON.stringify({ agentIds: selected, instructions }) }); setMessage('Assignments and instructions saved.'); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  if (creating) return <AgentForm showTitle onCancel={() => setCreating(false)} onSaved={agent => { setAgents(current => [...current, agent]); setSelected(current => [...current, agent.id]); setCreating(false); }} />;
  return <div className="space-y-3">
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {!data && <button className={button} onClick={refresh}>Load assignments</button>}
    {data && <>
      <p className="text-sm text-muted-foreground">Select all agents who can admit guests for {data.event.title}. Changes take effect after saving.</p>
      <div className="grid max-h-[220px] overflow-y-auto gap-2 sm:grid-cols-2">{agents.map(agent => <label key={agent.id} className="flex min-h-[40px] items-center gap-2 rounded-lg border border-border p-2">
        <input type="checkbox" checked={selected.includes(agent.id)} onChange={e => setSelected(current => e.target.checked ? [...current, agent.id] : current.filter(id => id !== agent.id))} />
        <span>{agent.name} <span className="text-xs text-muted-foreground">({agent.agentId}){agent.active ? '' : ' · inactive'}</span></span>
      </label>)}</div>
      <button className={button} onClick={() => setCreating(v => !v)}>Create a new agent</button>
      <label className="block">Instructions for everyone assigned to this event<textarea className={field} value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} maxLength={5000} /></label>
      <div className="flex gap-2"><button className={`${button} bg-primary text-primary-foreground`} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save assignments'}</button><button className={button} disabled={busy} onClick={onClose}>Cancel</button></div>
      {message && <p role="status" className="text-success">{message}</p>}
      <details className="border-t border-border pt-3"><summary className="cursor-pointer font-medium">Admission activity</summary><div className="space-y-3 pt-3"><h3 className="font-semibold">Admission totals by agent</h3>
      <p className="text-xs text-muted-foreground">Refreshes every 15 seconds. Historical admissions remain after an assignment is removed.</p>
      <div className="grid gap-2 sm:grid-cols-2">{data.counts.map(count => <div key={count.agentId || 'organizer'} className="rounded-lg border border-border p-3 text-sm">
        <p className="font-medium">{count.agentId ? agents.find(agent => agent.id === count.agentId)?.name || 'Entry agent' : 'Organizer / admin'}</p><p>{count.admissions} tickets · {count.attendees} attendees</p>
      </div>)}</div>
      <h3 className="font-semibold">Recent admissions</h3>
      {!data.activity.total && <p className="text-sm text-muted-foreground">No admissions yet.</p>}
      {data.activity.rows.map(row => <div key={row.id} className="border-t border-border pt-2 text-sm">
        <p>{row.attendeeName} · {row.ticketType} · {row.quantity} attendees</p><p className="text-xs text-muted-foreground">{row.agentName}{row.agentId ? ` (${row.agentId})` : ''} · {agentDate(row.checkedInAt)} · {row.ticketReference}</p>
      </div>)}
      <div className="flex justify-between"><button className={button} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><button className={button} disabled={page * 20 >= data.activity.total} onClick={() => setPage(p => p + 1)}>Next</button></div>
    </div></details></>}
  </div>;
}

export default function EntryAgentManagement() {
  const [search, setSearch] = useSearchParams();
  const eventId = search.get('event') || '';
  const [agents, setAgents] = useState([]);
  const [events, setEvents] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try { const [list, eventList] = await Promise.all([call(), call('/events')]); setAgents(list); setEvents(eventList); }
    catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const toggle = async agent => {
    setBusy(true); setError('');
    try { await call(`/${agent.id}`, { method: 'PATCH', body: JSON.stringify({ active: !agent.active }) }); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const reset = async e => {
    e.preventDefault(); const password = new FormData(e.currentTarget).get('password'); setBusy(true); setError('');
    try { await call(`/${resetting.id}/password`, { method: 'POST', body: JSON.stringify({ password }) }); setMessage(`Password reset for ${resetting.agentId}. Share the new password personally.`); setResetting(null); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const selectEvent = id => setSearch(current => { const next = new URLSearchParams(current); if (id) next.set('event', id); else next.delete('event'); return next; });
  const matchingEvents = events.filter(event => event.title.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="entry-agent-ui space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="font-semibold">Entry Agents <span className="text-xs text-muted-foreground">({agents.length})</span></h1><p className="mt-1 text-muted-foreground">Manage your entry team &middot; <Link className="underline underline-offset-2" to="/entry-agent/login">Agent login</Link></p></div>
      <div className="flex gap-2">
        <Popover open={pickerOpen} onOpenChange={value => { setPickerOpen(value); if (!value) setQuery(''); }}>
          <PopoverTrigger asChild><button className={button}>Assign event<ChevronDown size={14} /></button></PopoverTrigger>
          <PopoverContent align="end" className="entry-agent-ui w-[340px] max-w-[calc(100vw-32px)] p-2">
            <input aria-label="Search events" placeholder="Search events..." className={field} value={query} onChange={e => setQuery(e.target.value)} />
            <div className="mt-2 max-h-[280px] overflow-y-auto space-y-1">
              {matchingEvents.map(event => <button key={event.id} className="block w-full rounded-lg p-2 text-left hover:bg-accent focus-visible:bg-accent" onClick={() => { setPickerOpen(false); setQuery(''); selectEvent(event.id); }}><span className="block font-medium">{event.title}</span><span className="mt-1 flex items-end justify-between gap-2"><span className="text-xs text-muted-foreground">{event.startDate ? agentDate(event.startDate) : 'Date not set'}</span>{event.publishStatus === 'DRAFT' && <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">Draft</span>}</span></button>)}
              {!matchingEvents.length && <p className="p-2 text-muted-foreground">{events.length ? 'No matching events.' : 'No events available.'}</p>}
            </div>
          </PopoverContent>
        </Popover>
        <button className={button + ' bg-primary text-primary-foreground'} onClick={() => setEditing({})}><Plus size={14} />Create agent</button>
      </div>
    </div>
    {error && !resetting && <p role="alert" className="text-destructive">{error} <button className={button} onClick={refresh}>Retry</button></p>}
    {message && <p role="status" className="text-success">{message}</p>}
    <div className="grid grid-cols-[repeat(auto-fill,min(100%,300px))] gap-3">{agents.map(agent => <div key={agent.id} className={card + ' entry-agent-card space-y-2'}>
      <div className="flex items-center justify-between gap-2"><h2 className="min-w-0 truncate font-semibold" title={agent.name}>{agent.name}</h2><span className={'text-xs shrink-0 rounded-full px-2 py-0.5 ' + (agent.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>{agent.active ? 'Active' : 'Inactive'}</span></div>
      <div className="flex items-center justify-between gap-2"><span className="truncate text-xs text-muted-foreground">{agent.agentId}</span><div className="entry-agent-actions flex gap-1">
        <button className={button + ' !p-1.5'} aria-label={'Edit ' + agent.agentId} title="Edit agent" onClick={() => setEditing(agent)}><Pencil size={14} /></button>
        <button className={button + ' !p-1.5'} aria-label={'Reset password for ' + agent.agentId} title="Reset password" onClick={() => { setError(''); setResetting(agent); }}><KeyRound size={14} /></button>
        <button className={button + ' !p-1.5'} aria-label={(agent.active ? 'Deactivate ' : 'Reactivate ') + agent.agentId} title={agent.active ? 'Deactivate' : 'Reactivate'} disabled={busy} onClick={() => toggle(agent)}><Power size={14} /></button>
      </div></div>
    </div>)}</div>
    {!agents.length && !error && <p className={card + ' text-muted-foreground'}>Create your first agent to start building your entry team.</p>}
    <AgentDialog open={!!editing} onClose={() => setEditing(null)} width={520} title={editing?.id ? 'Edit agent' : 'Create entry agent'}>
      {editing && <AgentForm key={editing.id || 'new'} agent={editing.id ? editing : null} onCancel={() => setEditing(null)} onSaved={agent => { setEditing(null); setMessage('Saved ' + agent.agentId + '. Share credentials personally.'); refresh(); }} />}
    </AgentDialog>
    <AgentDialog open={!!resetting} onClose={() => { if (!busy) setResetting(null); }} width={400} title={'Reset password for ' + (resetting?.agentId || '')}>
      {resetting && <form onSubmit={reset} className="space-y-3"><p className="text-muted-foreground">This signs the agent out of all devices.</p><label className="block">New password<EntryAgentPassword className={field} name="password" autoComplete="new-password" required minLength={8} maxLength={72} /></label><p className="text-xs text-muted-foreground">Include uppercase, lowercase, a number, and a special character (@$!%*?&).</p>{error && <p role="alert" className="text-destructive">{error}</p>}<div className="flex gap-2"><button disabled={busy} className={button + ' bg-primary text-primary-foreground'}>Reset password</button><button type="button" disabled={busy} className={button} onClick={() => setResetting(null)}>Cancel</button></div></form>}
    </AgentDialog>
    <AgentDialog open={!!eventId} onClose={() => selectEvent('')} title="Event entry agents">
      {eventId && <AssignmentEditor key={eventId} eventId={eventId} onClose={() => selectEvent('')} />}
    </AgentDialog>
  </div>;
}
