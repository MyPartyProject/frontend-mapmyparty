import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QrCode, ShieldCheck, LogOut, ArrowLeft, ArrowRight, RefreshCw, Lock, CalendarDays, MapPin, Users, Ticket, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EntryAgentPassword from '@/components/EntryAgentPassword';
import QRScanner from '@/components/QRScanner';
import { agentFetch, agentDate } from '@/services/entryAgentService';
import { extractValidQrToken } from '@/utils/qrPayload';

const panel = 'min-w-0 rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4 shadow-[var(--shadow-card)]';
const button = 'h-auto min-h-11 whitespace-normal rounded-xl px-4 py-3 duration-150 motion-reduce:transition-none';
const primary = `${button} min-h-12`;
const input = 'min-h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function Brand({ name }) {
  return <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent-foreground"><ShieldCheck aria-hidden="true" className="h-6 w-6" /></span><div className="min-w-0"><p className="font-bold tracking-tight">MapMyParty</p><p className="text-xs text-muted-foreground">{name || 'Entry agent workspace'}</p></div></div>;
}

function Shell({ children }) {
  return <div className="entry-agent-light min-h-[100dvh] bg-surface text-foreground pb-[env(safe-area-inset-bottom)] [overflow-wrap:anywhere]">
    <main className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-5 sm:px-6 sm:py-8">{children}</main>
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
  return <Shell><div className="mx-auto max-w-[440px] space-y-6 py-4 sm:py-12">
    <Brand />
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-elegant)]">
    <div className="space-y-3 bg-secondary p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-accent-foreground">A warm welcome starts with you</p><h1 className="text-3xl font-bold tracking-tight">Ready at the door.</h1><p className="text-sm leading-relaxed text-muted-foreground">Sign in with the credentials from your organizer to start checking in guests.</p></div>
    <form onSubmit={submit} className="space-y-5 p-6 sm:p-8">
      <label className="block space-y-2"><span>Agent ID</span><input className={input} name="agentId" required autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={32} /></label>
      <label className="block space-y-2"><span>Password</span><EntryAgentPassword className={input} name="password" required autoComplete="current-password" maxLength={72} /></label>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <Button className={`${primary} w-full`} disabled={busy}>{busy ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}{busy ? 'Signing in…' : 'Sign in'}</Button>
    </form></div><p className="px-2 text-center text-sm leading-relaxed text-muted-foreground">Forgot your credentials? Contact your organizer to reset your password.</p>
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
    if (ticket) ticketPanel.current?.focus();
  }, [ticket, result]);

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

  const progress = data?.totals?.bookedQuantity > 0 ? Math.min(100, Math.max(0, data.totals.checkedInQuantity / data.totals.bookedQuantity * 100)) : 0;
  const resultTone = result === 'success' ? 'bg-success-soft text-success' : ['already', 'uncertain'].includes(result) ? 'bg-warning-soft text-warning' : 'bg-secondary text-accent-foreground';
  const ResultIcon = result === 'success' ? CheckCircle2 : ['already', 'uncertain'].includes(result) ? AlertTriangle : ShieldCheck;

  return <Shell>
    <header className="flex items-center justify-between gap-3 border-b border-border/60 pb-5">
      <Brand name={agent?.name} /><Button variant="outline" className={button + ' shrink-0'} onClick={logout} aria-label="Sign out"><LogOut aria-hidden="true" /><span className="hidden sm:inline">Sign out</span></Button>
    </header>
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      {eventId ? <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/entry-agent/events"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Your events</Link> : <p className="text-sm text-muted-foreground">Your shift, at a glance</p>}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span role="status">{stale ? 'Connection interrupted · totals may be outdated' : updated ? 'Updated ' + updated.toLocaleTimeString() : refreshing ? 'Loading your workspace…' : 'Workspace unavailable'}</span><Button variant="ghost" className={button} disabled={refreshing || busy} onClick={refresh}><RefreshCw aria-hidden="true" className={refreshing ? 'animate-spin motion-reduce:animate-none' : ''} /> Refresh</Button></div>
    </div>
    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{error}</p></div>}
    {!data && !error && <div className={panel + ' flex min-h-40 items-center justify-center gap-3 text-muted-foreground'} role="status"><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Loading your workspace…</div>}
    {!data && error && <div className={panel}><h2 className="text-xl font-bold">Let's get you back on track</h2><p className="text-sm text-muted-foreground">Refresh to try again, or contact your organizer if your access has changed.</p><Button className={button} disabled={refreshing} onClick={refresh}>Try again</Button></div>}
    {!eventId && data && <>
      <div className="space-y-2"><h1 className="text-3xl font-bold tracking-tight">Your events</h1><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">Choose an event to welcome your guests. Entry access unlocks at 00:00 IST on the start date and stays available until the event ends.</p></div>
      {!data.length && <div className={panel + ' py-12 text-center'}><CalendarDays className="mx-auto h-10 w-10 text-primary" aria-hidden="true" /><h2 className="text-xl font-bold">No events assigned yet</h2><p className="text-sm text-muted-foreground">No upcoming or ongoing events assigned. Contact your organizer if you expected an assignment.</p></div>}
      {[false, true].map(locked => {
        const events = data.filter(event => (event.locked !== false) === locked);
        if (!events.length) return null;
        return <section key={String(locked)} className="space-y-4" aria-label={locked ? 'Upcoming assignments' : 'Ready for entry'}>
          <h2 className="flex items-center gap-2 text-lg font-bold">{locked ? 'Upcoming assignments' : 'Ready for entry'}<span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-accent-foreground">{events.length}</span></h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{events.map(event => {
            const Card = locked ? 'div' : Link;
            return <Card key={event.id} className={panel + ' flex flex-col ' + (locked ? '' : 'transition-[border-color,box-shadow] duration-150 hover:border-primary hover:shadow-[var(--shadow-elegant)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none')} {...(locked ? {} : { to: '/entry-agent/events/' + event.id })}>
              <span className={'inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ' + (locked ? 'bg-muted text-muted-foreground' : 'bg-secondary text-accent-foreground')}>{locked ? <Lock className="h-3.5 w-3.5" aria-hidden="true" /> : <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}{locked ? 'Upcoming · Locked' : 'Entry open'}</span>
              <h3 className="text-xl font-bold leading-snug">{event.title}</h3>
              <p className="flex items-start gap-2 text-sm text-muted-foreground"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{agentDate(event.startDate)}</p>
              <p className="flex flex-1 items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{event.venues.map(v => [v.name, v.city].filter(Boolean).join(', ')).join(' · ') || 'Venue to be confirmed'}</p>
              {locked ? <span className="border-t border-border/60 pt-4 text-sm text-muted-foreground">{event.unlockAt ? 'Unlocks on ' + agentDate(event.unlockAt) : 'Entry access locked'}</span> : <span className="flex min-h-12 items-center justify-between gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-accent-foreground">Open entry desk <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></span>}
            </Card>;
          })}</div>
        </section>;
      })}
    </>}
    {eventId && data?.event && <>
      <section className="space-y-3"><p className="text-xs font-bold uppercase tracking-widest text-accent-foreground">Entry desk</p><h1 className="text-3xl font-bold tracking-tight">{data.event.title}</h1><p className="flex items-start gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />{agentDate(data.event.startDate)} — {agentDate(data.event.endDate)}</p>
        {data.event.venues.map((v, i) => <p className="flex items-start gap-2 text-sm text-muted-foreground" key={i}><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />{[v.name, v.fullAddress, v.city].filter(Boolean).join(', ')}</p>)}
      </section>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0">
      {!ticket && <section className={panel} aria-busy={busy}>
        <div className="flex items-start gap-3"><span className="rounded-xl bg-secondary p-3 text-accent-foreground"><QrCode className="h-6 w-6" aria-hidden="true" /></span><div><h2 className="text-2xl font-bold">Welcome your next guest</h2><p className="mt-1 text-sm text-muted-foreground">Scan a ticket, review the details, then allow entry.</p></div></div>
        <Button disabled={busy || stale} className={primary + ' w-full'} onClick={() => { setError(''); setScanner(true); }}><QrCode aria-hidden="true" /> Scan ticket QR</Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border/60" />or enter the printed ticket code<span className="h-px flex-1 bg-border/60" /></div>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); verify({ manualCheckInCode: manualCode }); }}>
          <label className="block space-y-2"><span className="text-sm font-semibold">Ticket check-in code</span><input ref={manualInput} className={input} value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="e.g. 9sv9begy" required minLength={6} maxLength={12} autoCorrect="off" autoCapitalize="none" spellCheck={false} /></label>
          <Button variant="outline" className={button + ' w-full'} disabled={busy}>{busy && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}{busy ? 'Verifying…' : 'Verify ticket'}</Button>
        </form>
        <p className="text-xs leading-relaxed text-muted-foreground">No rear camera? Use the ticket code. Scanning never admits a guest automatically.</p>
      </section>}
      {ticket && <section className={panel + ' scroll-mt-4'} aria-live="polite" aria-busy={busy}>
        <div className={'flex items-center gap-3 rounded-xl p-4 ' + resultTone}><ResultIcon className="h-6 w-6 shrink-0" aria-hidden="true" /><h2 ref={ticketPanel} tabIndex={-1} className="rounded text-xl font-bold focus:outline-none">{result === 'success' ? 'Entry confirmed' : result === 'already' ? 'Already checked in' : result === 'uncertain' ? 'Admission not confirmed' : 'Review ticket'}</h2></div>
        <p className="text-sm text-muted-foreground">{ticket.event.title}</p><h3 className="text-2xl font-bold">{ticket.attendeeName}</h3>
        <p className="text-sm">{ticket.ticketType} · <span className="capitalize">{ticket.ticketCategory?.toLowerCase().replaceAll('_', ' ')}</span></p>
        <p className="flex items-center gap-2 rounded-xl bg-muted p-4 font-bold"><Users className="h-5 w-5 shrink-0 text-accent-foreground" aria-hidden="true" />{ticket.quantity} attendee{ticket.quantity === 1 ? '' : 's'} · whole group</p>
        <p className="text-xs text-muted-foreground">Ticket {ticket.ticketReference}</p>
        {ticket.checkedInAt && <p className="text-sm text-muted-foreground">Admitted {agentDate(ticket.checkedInAt)}</p>}
        {result === 'review' && <><p className="text-sm text-muted-foreground">Check that the whole group is present before allowing entry.</p><Button className={primary + ' w-full'} onClick={admit} disabled={busy || !ready || stale}>{busy ? 'Confirming entry…' : 'Allow entry · Admit all ' + ticket.quantity + ' attendee' + (ticket.quantity === 1 ? '' : 's')}</Button></>}
        {result === 'review' && !ready && !busy && <Button variant="outline" className={button + ' w-full'} onClick={() => verify(lastLookup.current)}>Verify again</Button>}
        {result === 'uncertain' && <><p className="text-sm">Verify again to find out whether the server recorded this admission.</p><Button className={primary + ' w-full'} disabled={busy} onClick={() => verify(lastLookup.current)}>Verify again</Button></>}
        <div className="flex flex-wrap gap-2"><Button variant="outline" className={button + ' flex-1'} disabled={busy} onClick={() => { reset(); window.setTimeout(() => manualInput.current?.focus(), 0); }}>Use another code</Button><Button variant={['success', 'already'].includes(result) ? 'default' : 'secondary'} className={button + ' flex-1'} disabled={busy || stale} onClick={() => { reset(); setScanner(true); }}><QrCode aria-hidden="true" />Scan next</Button></div>
      </section>}
      </div>
      <aside className="min-w-0 space-y-5">
        <section className={panel} aria-label="Event entry totals"><h2 className="text-lg font-bold">Entry overview</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
            <div className="min-w-0 rounded-xl bg-secondary p-4"><Users className="mb-3 h-5 w-5 text-accent-foreground" aria-hidden="true" /><p className="text-xs text-muted-foreground">Attendees admitted</p><p className="mt-2 text-2xl font-bold">{data.totals.checkedInQuantity}<span className="text-sm font-normal text-muted-foreground"> / {data.totals.bookedQuantity}</span></p></div>
            <div className="min-w-0 rounded-xl bg-muted p-4"><Ticket className="mb-3 h-5 w-5 text-accent-foreground" aria-hidden="true" /><p className="text-xs text-muted-foreground">Tickets checked in</p><p className="mt-2 text-2xl font-bold">{data.totals.total}<span className="text-sm font-normal text-muted-foreground"> / {data.totals.totalBooked}</span></p></div>
          </div><div className="space-y-2"><div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>Attendee entry progress</span><span>{Math.round(progress)}%</span></div><div role="progressbar" aria-label="Attendee entry progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primaryCTA" style={{ width: progress + '%' }} /></div></div>
        </section>
        <details className={panel}><summary className="min-h-11 cursor-pointer rounded-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Organizer instructions</summary><h3 className="text-sm font-semibold">For you</h3><p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{data.guidelines || 'No general instructions provided.'}</p><h3 className="text-sm font-semibold">For this event</h3><p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{data.event.instructions || 'No event instructions provided.'}</p></details>
      </aside>
      </div>
      <section className={panel}><h2 className="text-xl font-bold">Your admissions ({data.activity.total})</h2><p className="text-sm text-muted-foreground">Guests you have checked in for this event.</p>
        {!data.activity.rows.length && <div className="rounded-xl bg-muted px-4 py-8 text-center"><CheckCircle2 className="mx-auto mb-3 h-7 w-7 text-accent-foreground" aria-hidden="true" /><p className="text-sm text-muted-foreground">Your confirmed admissions will appear here.</p></div>}
        {data.activity.rows.map(row => <div key={row.id} className="grid gap-2 border-t border-border/60 pt-4 text-sm md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)]"><p className="font-semibold">{row.attendeeName}<span className="mt-1 block text-xs font-normal text-muted-foreground">{row.quantity} attendee{row.quantity === 1 ? '' : 's'}</span></p><p>{row.ticketType}</p><p className="text-xs text-muted-foreground md:text-right">{agentDate(row.checkedInAt)}<span className="mt-1 block">{row.ticketReference}</span></p></div>)}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4"><Button variant="outline" className={button} disabled={refreshing || page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button><span className="text-xs text-muted-foreground">Page {page}</span><Button variant="outline" className={button} disabled={refreshing || page * 20 >= data.activity.total} onClick={() => setPage(p => p + 1)}>Next</Button></div>
      </section>
    </>}
    {scanner && <QRScanner presentation="agent" rearOnly onScan={scan} onClose={() => { setScanner(false); window.setTimeout(() => manualInput.current?.focus(), 0); }} isProcessing={busy} />}
  </Shell>;
}
