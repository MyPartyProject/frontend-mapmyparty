import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QrCode, ShieldCheck, LogOut, ArrowLeft, RefreshCw, Lock } from 'lucide-react';
import EntryAgentPassword from '@/components/EntryAgentPassword';
import QRScanner from '@/components/QRScanner';
import { agentFetch, agentDate } from '@/services/entryAgentService';
import { extractValidQrToken } from '@/utils/qrPayload';

const panel = 'rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3';
const button = 'min-h-11 rounded-xl border border-border px-4 py-3 font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const primary = `${button} bg-primary text-primary-foreground`;
const input = 'min-h-12 w-full rounded-xl border border-input bg-background px-3 py-3 text-base';

function Shell({ children }) {
  return <div className="min-h-[100dvh] bg-background text-foreground pb-[env(safe-area-inset-bottom)] [overflow-wrap:anywhere]">
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-5 sm:px-6">{children}</main>
  </div>;
}

export function EntryAgentLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      await agentFetch('login', { method: 'POST', body: JSON.stringify({ agentId: form.get('agentId'), password: form.get('password') }) });
      navigate('/entry-agent/events', { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <Shell><div className="mx-auto max-w-md space-y-6 py-8 sm:py-16">
    <ShieldCheck className="h-10 w-10 text-primary" aria-hidden="true" />
    <div><p className="text-sm text-muted-foreground">MapMyParty</p><h1 className="text-3xl font-semibold">Entry Agent</h1><p className="mt-2 text-muted-foreground">Sign in with the credentials from your organizer.</p></div>
    <form onSubmit={submit} className={panel}>
      <label className="block space-y-2"><span>Agent ID</span><input className={input} name="agentId" required autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={32} /></label>
      <label className="block space-y-2"><span>Password</span><EntryAgentPassword className={input} name="password" required autoComplete="current-password" maxLength={72} /></label>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <button className={`${primary} w-full`} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form><p className="text-sm text-muted-foreground">Forgot your credentials? Contact your organizer to reset your password.</p>
  </div></Shell>;
}

export default function EntryAgent() {
  const { eventId } = useParams();
  // Remount event state on navigation so a previous event's ticket cannot survive.
  return <AgentWorkspace key={eventId || 'events'} eventId={eventId} />;
}

function AgentWorkspace({ eventId }) {
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scanner, setScanner] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [result, setResult] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [page, setPage] = useState(1);
  const [updated, setUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [ready, setReady] = useState(false);
  const actionRef = useRef(false);
  const mounted = useRef(true);
  const refreshId = useRef(0);
  const refreshInFlight = useRef(false);
  const lastLookup = useRef(null);
  const manualInput = useRef(null);
  const ticketPanel = useRef(null);

  const handleFailure = useCallback((err, eventRead = false) => {
    if (!mounted.current) return;
    setError(err.message); setScanner(false);
    if (!err.status || err.status >= 500) setStale(true);
    if (err.status === 401) { navigate('/entry-agent/login', { replace: true }); return; }
    if (err.status === 403 || (eventRead && err.status === 404)) {
      setTicket(null); setReady(false);
      if (eventRead) setData(null);
    }
  }, [navigate]);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    const request = ++refreshId.current;
    try {
      const results = await Promise.allSettled([agentFetch('me'), agentFetch(eventId ? `events/${eventId}?page=${page}` : 'events')]);
      const failure = results.find(result => result.status === 'rejected');
      if (failure) throw failure.reason;
      const [profile, next] = results.map(result => result.value);
      if (!mounted.current || request !== refreshId.current) return;
      setAgent(profile); setData(next); setUpdated(new Date()); setStale(false); setError('');
    } catch (err) { if (request === refreshId.current) handleFailure(err, true); }
    finally {
      refreshInFlight.current = false;
      if (mounted.current) setRefreshing(false);
    }
  }, [eventId, page, handleFailure]);

  useEffect(() => {
    mounted.current = true; refresh();
    const hideScanner = () => { if (document.hidden) setScanner(false); };
    const reconnect = () => { if (!document.hidden) refresh(); };
    const offline = () => { setStale(true); setScanner(false); setReady(false); setError('You are offline. Reconnect and verify the ticket before admitting anyone.'); };
    document.addEventListener('visibilitychange', hideScanner);
    window.addEventListener('online', reconnect); window.addEventListener('offline', offline);
    return () => {
      mounted.current = false; ++refreshId.current;
      document.removeEventListener('visibilitychange', hideScanner);
      window.removeEventListener('online', reconnect); window.removeEventListener('offline', offline);
    };
  }, [refresh]);

  useEffect(() => {
    if (!data?.event) return;
    const remaining = new Date(data.event.endDate) - new Date(data.serverTime);
    const timer = window.setTimeout(() => { setScanner(false); setTicket(null); setData(null); refresh(); }, Math.max(0, Math.min(remaining, 2147483647)));
    return () => window.clearTimeout(timer);
  }, [data, refresh]);

  useEffect(() => {
    if (ticket) ticketPanel.current?.scrollIntoView({ block: 'start' });
  }, [ticket]);

  const verify = async payload => {
    if (actionRef.current) return;
    actionRef.current = true; setBusy(true); setScanner(false); setError(''); setTicket(null); setReady(false); setResult('');
    lastLookup.current = payload;
    try {
      const next = await agentFetch(`events/${eventId}/verify`, { method: 'POST', body: JSON.stringify(payload) });
      if (!mounted.current) return;
      setTicket(next); setReady(!next.checkedIn); setResult(next.checkedIn ? 'already' : 'review'); setStale(false);
    } catch (err) { handleFailure(err); if (err.status === 403) refresh(); }
    finally { actionRef.current = false; if (mounted.current) setBusy(false); }
  };
  const scan = raw => {
    const qrToken = extractValidQrToken(raw);
    if (!qrToken) { setScanner(false); setError('Unable to read this QR. Scan again or use the ticket code.'); return; }
    verify({ qrToken });
  };
  const admit = async () => {
    if (actionRef.current || !ticket || !ready) return;
    actionRef.current = true; setBusy(true); setReady(false); setError('');
    try {
      const next = await agentFetch(`events/${eventId}/admit`, { method: 'POST', body: JSON.stringify({ bookingItemId: ticket.bookingItemId }) });
      if (!mounted.current) return;
      setTicket(next); setResult(next.alreadyCheckedIn ? 'already' : 'success'); await refresh();
    } catch (err) { setResult('uncertain'); handleFailure(err); if (err.status === 403) refresh(); }
    finally { actionRef.current = false; if (mounted.current) setBusy(false); }
  };
  const reset = () => { setTicket(null); setResult(''); setError(''); setManualCode(''); setReady(false); lastLookup.current = null; };
  const logout = async () => {
    setScanner(false); setReady(false);
    try { await agentFetch('logout', { method: 'POST' }); navigate('/entry-agent/login', { replace: true }); }
    catch (err) { handleFailure(err); }
  };

  return <Shell>
    <header className="flex items-center justify-between gap-3">
      <div><p className="text-sm text-muted-foreground">MapMyParty · Entry Agent</p><h1 className="text-xl font-semibold">{agent?.name || 'Entry desk'}</h1></div>
      <button className={button} onClick={logout} aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
    </header>
    {eventId && <Link className="inline-flex min-h-11 items-center gap-2 text-sm" to="/entry-agent/events"><ArrowLeft className="h-4 w-4" /> Your events</Link>}
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <span role="status">{stale ? 'Connection interrupted · totals may be outdated' : updated ? `Updated ${updated.toLocaleTimeString()}` : 'Loading your workspace…'}</span>
      <button className="min-h-11 px-2 inline-flex items-center gap-1 disabled:opacity-50" disabled={refreshing || busy} onClick={refresh}><RefreshCw className="h-4 w-4" /> Refresh</button>
    </div>
    {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</p>}
    {!eventId && data && <>
      <h2 className="text-2xl font-semibold">Your events</h2>
      <p className="text-sm text-muted-foreground">Assigned events appear here after refresh. Entry access unlocks at 00:00 IST on the start date and remains available until the event ends.</p>
      {!data.length && <div className={panel}>No upcoming or ongoing events assigned. Contact your organizer if you expected an assignment.</div>}
      <div className="grid gap-4 sm:grid-cols-2">{data.map(event => {
        const locked = event.locked !== false;
        const Card = locked ? 'div' : Link;
        return <Card key={event.id} className={`${panel} ${locked ? 'border-dashed' : 'hover:border-primary'}`} {...(locked ? {} : { to: `/entry-agent/events/${event.id}` })}>
          <h3 className="text-lg font-semibold">{event.title}</h3><p className="text-sm">{agentDate(event.startDate)}</p><p className="text-sm text-muted-foreground">{event.venues.map(v => [v.name, v.city].filter(Boolean).join(', ')).join(' · ') || 'Venue to be confirmed'}</p>
          {locked ? <span className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4 shrink-0" aria-hidden="true" />{event.unlockAt ? `Unlocks on ${agentDate(event.unlockAt)}` : 'Entry access locked'}</span> : <span className="inline-flex min-h-11 items-center font-medium text-primary">Open entry desk →</span>}
        </Card>;
      })}</div>
    </>}
    {eventId && data?.event && <>
      <section className={panel}><h2 className="text-2xl font-semibold">{data.event.title}</h2><p className="text-sm">{agentDate(data.event.startDate)} — {agentDate(data.event.endDate)}</p>
        {data.event.venues.map((v, i) => <p className="text-sm text-muted-foreground" key={i}>{[v.name, v.fullAddress, v.city].filter(Boolean).join(', ')}</p>)}
      </section>
      <details className={panel}><summary className="min-h-11 cursor-pointer font-medium">Organizer instructions</summary>
        <h3 className="font-medium">For you</h3><p className="whitespace-pre-wrap text-sm">{data.guidelines || 'No general instructions provided.'}</p>
        <h3 className="font-medium">For this event</h3><p className="whitespace-pre-wrap text-sm">{data.event.instructions || 'No event instructions provided.'}</p>
      </details>
      <section className="grid grid-cols-2 gap-3" aria-label="Event entry totals">
        <div className={panel}><p className="text-sm text-muted-foreground">Attendees admitted</p><p className="text-2xl font-semibold">{data.totals.checkedInQuantity} / {data.totals.bookedQuantity}</p></div>
        <div className={panel}><p className="text-sm text-muted-foreground">Tickets checked in</p><p className="text-2xl font-semibold">{data.totals.total} / {data.totals.totalBooked}</p></div>
      </section>
      {!ticket && <section className={panel}>
        <button disabled={busy || stale} className={`${primary} w-full flex justify-center items-center gap-2`} onClick={() => { setError(''); setScanner(true); }}><QrCode className="h-5 w-5" /> Scan ticket QR</button>
        <p className="text-center text-sm text-muted-foreground">or use the code printed on the ticket</p>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); verify({ manualCheckInCode: manualCode }); }}>
          <label className="block space-y-2"><span>Ticket check-in code</span><input ref={manualInput} className={input} value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="e.g. 9sv9begy" required minLength={6} maxLength={12} autoCorrect="off" autoCapitalize="none" spellCheck={false} /></label>
          <button className={`${button} w-full`} disabled={busy}>{busy ? 'Verifying…' : 'Verify ticket'}</button>
        </form>
      </section>}
      {ticket && <section ref={ticketPanel} className={`${panel} scroll-mt-4`} aria-live="polite">
        <h2 className={`text-xl font-semibold ${result === 'success' ? 'text-success' : result === 'already' ? 'text-warning' : ''}`}>{result === 'success' ? 'Entry confirmed' : result === 'already' ? 'Already checked in' : result === 'uncertain' ? 'Admission not confirmed' : 'Review ticket'}</h2>
        <p className="text-sm text-muted-foreground">{ticket.event.title}</p><h3 className="text-xl font-semibold">{ticket.attendeeName}</h3>
        <p>{ticket.ticketType} · <span className="capitalize">{ticket.ticketCategory?.toLowerCase().replaceAll('_', ' ')}</span></p><p className="font-semibold">{ticket.quantity} attendee{ticket.quantity === 1 ? '' : 's'} · whole group</p>
        <p className="text-xs text-muted-foreground">Ticket {ticket.ticketReference}</p>
        {ticket.checkedInAt && <p className="text-sm">Admitted {agentDate(ticket.checkedInAt)}</p>}
        {result === 'review' && <button className={`${primary} w-full`} onClick={admit} disabled={busy || !ready || stale}>Allow entry · Admit all {ticket.quantity} attendee{ticket.quantity === 1 ? '' : 's'}</button>}
        {result === 'review' && !ready && !busy && <button className={`${button} w-full`} onClick={() => verify(lastLookup.current)}>Verify again</button>}
        {result === 'uncertain' && <><p className="text-sm">Verify again to find out whether the server recorded this admission.</p><button className={`${button} w-full`} disabled={busy} onClick={() => verify(lastLookup.current)}>Verify again</button></>}
        <div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={reset}>Use another code</button><button className={button} disabled={busy || stale} onClick={() => { reset(); setScanner(true); }}>Scan next</button></div>
      </section>}
      <section className={panel}><h2 className="text-lg font-semibold">Your admissions ({data.activity.total})</h2>
        {!data.activity.rows.length && <p className="text-sm text-muted-foreground">Your confirmed admissions will appear here.</p>}
        {data.activity.rows.map(row => <div key={row.id} className="border-t border-border pt-3 text-sm"><p className="font-medium">{row.attendeeName} · {row.quantity} attendees</p><p>{row.ticketType}</p><p className="text-xs text-muted-foreground">{agentDate(row.checkedInAt)} · {row.ticketReference}</p></div>)}
        <div className="flex justify-between"><button className={button} disabled={refreshing || page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><button className={button} disabled={refreshing || page * 20 >= data.activity.total} onClick={() => setPage(p => p + 1)}>Next</button></div>
      </section>
    </>}
    {scanner && <QRScanner rearOnly onScan={scan} onClose={() => { setScanner(false); window.setTimeout(() => manualInput.current?.focus(), 0); }} isProcessing={busy} />}
  </Shell>;
}
