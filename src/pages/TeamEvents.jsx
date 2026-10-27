import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, customFetch, buildUrl } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeToggle from '@/components/ThemeToggle';
import { CopyButton, Pager, QueryState, plainText } from '@/components/team/TeamShared';
import { toast } from 'sonner';
import { buildAdvisoryItems } from '@/hooks/usePublicEventDetail';
import { CalendarDays, ImageIcon, MapPin } from 'lucide-react';

const date = value => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) + ' IST' : '';
const readable = key => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, letter => letter.toUpperCase());
function Fields({ values }) {
  return <dl className="divide-y">{Object.entries(values).filter(([, value]) => plainText(value) !== '').map(([key, value]) => <div key={key} className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-start gap-2 py-2"><dt className="text-sm font-medium pt-1">{readable(key)}</dt><dd className="min-w-0 text-sm whitespace-pre-wrap break-words text-muted-foreground pt-1">{plainText(value)}</dd><CopyButton compact value={plainText(value)} label={`Copy ${readable(key).toLowerCase()}`} /></div>)}</dl>;
}
function Panel({ title, children }) { return <section className="rounded-lg border bg-card p-3"><h2 className="text-base font-semibold mb-1">{title}</h2>{children}</section>; }

function EventCard({ event }) {
  const ongoing = event.eventStatus === 'ONGOING';
  const city = event.venues[0]?.city;
  return (
    <Link to={`/team/events/${event.id}`} data-marketing-card
      className="group grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <div className="flex h-[104px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {event.flyerImage
          ? <img src={event.flyerImage} alt="" loading="lazy" className="h-full w-full object-cover" />
          : <ImageIcon aria-hidden="true" className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="min-w-0 space-y-1.5">
        <h2 className="m-0 line-clamp-2 min-h-[40px] font-sans text-[15px] font-semibold leading-[20px] tracking-normal text-foreground" title={event.title}>{event.title}</h2>
        <p className="m-0 truncate text-[12px] leading-4 text-muted-foreground" title={event.organizer.name}>{event.organizer.name}</p>
        <p className="m-0 flex items-start gap-1.5 text-[12px] leading-4 text-muted-foreground">
          <CalendarDays aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{date(event.startDate)}</span>
        </p>
        <div className="flex min-w-0 items-center justify-between gap-2 pt-0.5">
          <span className="flex min-w-0 items-center gap-1.5 text-[12px] leading-4 text-muted-foreground" title={city || 'Location to be announced'}>
            <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" /><span className="truncate">{city || 'Location TBA'}</span>
          </span>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-4 ${ongoing ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{ongoing ? 'Ongoing' : 'Upcoming'}</span>
        </div>
      </div>
    </Link>
  );
}

export default function TeamEvents() {
  const { eventId } = useParams();
  const { user, logout } = useAuth();
  const [filters, setFilters] = useState({ page: 1, q: '', status: '', city: '', category: '' });
  const query = useQuery({ queryKey: ['marketing', user?.id, eventId || filters], queryFn: async () => (await apiFetch(eventId ? `team/events/${eventId}` : `team/events?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== ''))}`)).data, staleTime: 0, gcTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: true, refetchInterval: 60000, retry: false });
  const canAdmin = (user?.roles || []).some(r => ['ADMIN', 'SUPER_ADMIN'].includes(r));
  return <main className="min-h-screen bg-background text-foreground"><header className="border-b bg-card px-4 py-3"><div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap"><Link to="/team/events" className="font-semibold text-base">Marketing events</Link><nav className="flex items-center gap-2"><span className="hidden sm:inline text-sm text-muted-foreground">{user?.name}</span>{canAdmin && <Button variant="outline" size="sm" asChild><Link to="/promoter/overview">Admin workspace</Link></Button>}{(user?.roles || []).includes('ORGANIZER') && <Link className="text-sm underline" to="/organizer/dashboard">Organizer</Link>}{(user?.roles || []).includes('USER') && <Link className="text-sm underline" to="/dashboard">My bookings</Link>}<ThemeToggle compact /><Button variant="ghost" size="sm" onClick={logout}>Sign out</Button></nav></div></header>
    <div className="max-w-6xl mx-auto p-4 space-y-3">{eventId ? <Link to="/team/events" className="text-sm underline">← All events</Link> : <><h1 className="text-xl font-semibold">Event marketing library</h1><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"><Input aria-label="Search events" placeholder="Event or organizer" value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value, page: 1 })} /><select aria-label="Event status" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}><option value="">All upcoming & ongoing</option><option value="ONGOING">Ongoing</option><option value="UPCOMING">Upcoming</option></select>{['city', 'category'].map(field => <Input key={field} aria-label={readable(field)} placeholder={readable(field)} value={filters[field]} onChange={e => setFilters({ ...filters, [field]: e.target.value, page: 1 })} />)}</div></>}
      <QueryState query={query} />
      {!query.isError && !query.isPending && (eventId ? <EventDetails key={eventId} event={query.data} /> : <><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{query.data.items.map(event => <EventCard key={event.id} event={event} />)}</div>{!query.data.items.length && <p className="text-sm py-4 text-muted-foreground">No eligible events match your filters.</p>}<Pager {...query.data} onChange={page => setFilters({ ...filters, page })} /></>)}
    </div></main>;
}

function EventDetails({ event }) {
  const [downloading, setDownloading] = useState(null);
  const advisories = buildAdvisoryItems(event.advisory?.warnings || event.advisory);
  const basics = { title: event.title, description: event.description, category: event.category, subCategory: event.subCategory, categories: event.categories, type: event.type, starts: date(event.startDate), ends: date(event.endDate), status: event.eventStatus, eventUrl: event.publicUrl };
  const { slug: _slug, logo, ...organizer } = event.organizer;
  const brief = { ...basics, venues: event.venues, artists: event.artists, tickets: event.tickets, sponsors: event.sponsors.map(({ sponsor }) => sponsor.name), organizer, terms: event.TC, advisory: advisories, questions: event.questions, organizerMessage: event.organizerNote };
  const assets = [...(event.flyerImage ? [{ id: 'banner', url: event.flyerImage, mimeType: event.flyerMimeType, sizeBytes: event.flyerSizeBytes }] : []), ...event.images];
  async function download(asset) {
    setDownloading(asset.id);
    try {
      const response = await customFetch(buildUrl(`team/events/${event.id}/media/${asset.id}/download`));
      if (response.headers.get('content-type')?.includes('application/json')) {
        const payload = await response.json();
        const anchor = document.createElement('a'); anchor.href = payload.data.url; anchor.rel = 'noopener'; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      } else {
        const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || `${event.title}-${asset.id}.jpg`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) { toast.error(error.message || 'Download failed. Please retry.'); } finally { setDownloading(null); }
  }
  return <><div className="flex items-start justify-between flex-wrap gap-2"><div><h1 className="text-xl font-semibold">{event.title}</h1><p className="text-sm text-muted-foreground">Approved event details · Read-only</p></div><div className="flex flex-wrap items-center gap-1"><CopyButton value={brief} label="Copy marketing brief" /><Button size="sm" variant="outline" asChild><a href={event.publicUrl} target="_blank" rel="noopener noreferrer">Open public event</a></Button></div></div>
    <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 items-start"><div className="space-y-3"><Panel title="Event details"><Fields values={basics} /></Panel><Panel title="Venues">{event.venues.map((venue, index) => <div key={index} className="border-b last:border-0"><Fields values={venue} />{venue.latitude != null && venue.longitude != null && <a className="text-sm underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}>Open map</a>}</div>)}</Panel>{event.artists.length > 0 && <Panel title="Artists">{event.artists.map(({ image, ...artist }, i) => <Fields key={i} values={{ ...artist, imageUrl: image }} />)}</Panel>}{event.tickets.length > 0 && <Panel title="Tickets">{event.tickets.map((ticket, i) => <Fields key={i} values={{ ...ticket, price: ticket.price == null ? null : `INR ${ticket.price}`, purchaseExpiry: date(ticket.purchaseExpiry) }} />)}</Panel>}<Panel title="Additional information"><Fields values={{ terms: event.TC, advisories, questions: event.questions, organizerMessage: event.organizerNote }} /></Panel></div>
    <div className="space-y-3"><Panel title="Organizer">{logo && <img src={logo} alt={`${organizer.name} logo`} className="max-w-28 h-16 object-contain mb-2" />}<CopyButton value={organizer} label="Copy organizer contacts" /><Fields values={organizer} /></Panel>{event.sponsors.length > 0 && <Panel title="Sponsors">{event.sponsors.map(({ sponsor }, i) => <Fields key={i} values={{ name: sponsor.name, website: sponsor.websiteUrl, logoUrl: sponsor.logoUrl }} />)}</Panel>}<Panel title="Banner & gallery"><p className="text-xs text-muted-foreground mb-3">Full stored files. Downloads apply no additional compression.</p><div className="grid grid-cols-2 gap-2">{assets.map((asset, i) => <div key={asset.id} className="border rounded p-2"><img src={asset.url} alt={asset.id === 'banner' ? 'Event banner' : `Gallery image ${i}`} className="h-28 w-full object-contain bg-muted rounded" loading="lazy" /><p className="text-xs mt-1">{asset.id === 'banner' ? 'Banner' : `Gallery ${i}`}{asset.sizeBytes ? ` · ${(asset.sizeBytes / 1024 / 1024).toFixed(2)} MB` : ''}</p><Button size="sm" variant="outline" className="w-full mt-2" disabled={downloading !== null} onClick={() => download(asset)}>{downloading === asset.id ? 'Preparing…' : 'Download'}</Button><CopyButton value={asset.url} label="Copy image URL" /></div>)}</div>{!assets.length && <p className="text-sm">No images available.</p>}</Panel></div></div>
  </>;
}
