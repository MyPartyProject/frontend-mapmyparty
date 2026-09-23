import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ArrowLeft, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/config/api";
import { resolveEventBannerImage, normalizeEventBannerUrl } from "@/utils/eventBannerImage";
import { mobileEventList } from "@/utils/organizerMobile";

const card = "rounded-xl border border-border bg-card p-4";
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const label = (value) => String(value || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const date = (value, withTime = false) => !value || Number.isNaN(new Date(value).getTime()) ? "To be announced" : new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) });
const money = (value) => value == null ? "Price unavailable" : Number(value) === 0 ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

// Parse in an inert document and render only text, never event-provided markup.
function plainText(value) {
  if (typeof value !== "string") return "";
  const parser = new DOMParser();
  let doc = parser.parseFromString(value, "text/html");
  if (!doc.body.children.length && /<\/?[a-z]/i.test(doc.body.textContent || "")) doc = parser.parseFromString(doc.body.textContent, "text/html");
  doc.querySelectorAll("script, style, iframe, object, template").forEach((element) => element.remove());
  doc.querySelectorAll("br").forEach((element) => element.replaceWith("\n"));
  doc.querySelectorAll("p, div, li, h1, h2, h3, h4, tr").forEach((element) => element.append("\n"));
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

function Status({ event }) {
  return <div className="flex flex-wrap gap-1.5">{[event.publishStatus, event.eventStatus].filter(Boolean).map((status, index) => <span key={`${status}-${index}`} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{label(status)}</span>)}</div>;
}

function QueryState({ query, children }) {
  if (query.isPending) return <p role="status" className={`${card} text-sm text-muted-foreground`}>Loading events…</p>;
  if (query.error) {
    const unavailable = [403, 404].includes(query.error.status);
    return <div role="alert" className={`${card} space-y-3`}><p className="text-sm">{unavailable ? "This event is unavailable or you do not have access to it." : "Unable to load event information."}</p>{!unavailable && <button className={button} onClick={() => query.refetch()}>Try again</button>}</div>;
  }
  return children;
}

export function OrganizerMobileEvents() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const query = useQuery({
    queryKey: ["organizer-mobile-events", user.id],
    queryFn: async () => {
      // ponytail: client search loads the existing full list; use server search/pagination if event volumes grow.
      const response = await apiFetch("event/my-events", { method: "GET" });
      return (response.data ?? response).events || [];
    },
    retry: false,
  });
  const list = mobileEventList(query.data || [], search, params.get("page"));
  const update = (nextSearch, page, replace = false) => {
    const next = new URLSearchParams();
    if (nextSearch) next.set("search", nextSearch);
    if (page > 1) next.set("page", String(page));
    setParams(next, { replace });
  };
  return <section className="space-y-3" aria-label="Your events">
    <label className="block text-sm font-medium">Search events<input type="search" placeholder="Search by title" value={search} onChange={(event) => update(event.target.value, 1, true)} className="mt-2 min-h-11 w-full rounded-xl border border-input bg-card px-3 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
    <QueryState query={query}>
      <p className="text-xs text-muted-foreground" aria-live="polite">{list.total} {list.total === 1 ? "event" : "events"}{search ? " found" : " · All statuses"}</p>
      {list.events.length === 0 && <p className={`${card} text-sm text-muted-foreground`}>{search ? "No matching events. Try another title." : "No events yet. Create your first event on desktop."}</p>}
      {list.events.map((event) => {
        const image = resolveEventBannerImage(event);
        const venue = event.venues?.[0];
        return <Link key={event.id} to={{ pathname: `/organizer/events/${encodeURIComponent(event.id)}/preview`, search: params.toString() }} className="flex min-h-11 items-start gap-3 rounded-xl border border-border bg-card p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/40">
          {image ? <img src={image} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-lg object-cover" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted"><CalendarDays size={20} aria-hidden="true" /></span>}
          <div className="min-w-0 flex-1 space-y-1.5"><h2 className="break-words text-sm font-semibold">{event.title || "Untitled event"}</h2><p className="text-xs text-muted-foreground">{date(event.startDate)}</p><p className="break-words text-xs text-muted-foreground">{[venue?.name, venue?.city].filter(Boolean).join(", ") || "Location to be announced"}</p><Status event={event} /></div>
          <ChevronRight size={16} className="mt-1 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>;
      })}
      {list.totalPages > 1 && <nav aria-label="Event pages" className="flex items-center justify-between gap-2"><button className={button} disabled={list.page <= 1} onClick={() => update(search, list.page - 1)}>Previous</button><span className="text-xs text-muted-foreground">{list.page} / {list.totalPages}</span><button className={button} disabled={list.page >= list.totalPages} onClick={() => update(search, list.page + 1)}>Next</button></nav>}
    </QueryState>
  </section>;
}

function Section({ title, children, collapsible = false }) {
  return collapsible ? <details className={card}><summary className="min-h-11 cursor-pointer py-2.5 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{title}</summary><div className="mt-2 space-y-3 text-sm">{children}</div></details> : <section className={`${card} space-y-3`}><h2 className="text-base font-semibold">{title}</h2><div className="space-y-3 text-sm">{children}</div></section>;
}

function Text({ value }) {
  return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{plainText(value)}</p>;
}

function EventContent({ event }) {
  const image = resolveEventBannerImage(event);
  const gallery = (event.images || []).filter((item) => !item.type || item.type === "EVENT_GALLERY");
  const terms = event.termsAndConditions || (event.TC ? [event.TC] : []);
  const advisory = event.advisory?.warnings || event.advisory;
  const warnings = typeof advisory === "string" ? [advisory] : Array.isArray(advisory) ? advisory.filter((item) => typeof item === "string") : Object.entries(advisory || {}).flatMap(([key, value]) => value === true ? [label(key.replace(/([a-z])([A-Z])/g, "$1 $2"))] : Array.isArray(value) ? value.filter((item) => typeof item === "string") : typeof value === "string" ? [value] : []);
  return <div className="space-y-3">
    <section className={`${card} space-y-3`} aria-label="Event summary">
      {image && <img src={image} alt="" className="max-h-48 w-full rounded-lg object-cover" />}
      <h2 className="break-words text-base font-semibold">{event.title || "Untitled event"}</h2><Status event={event} />
      <p className="text-xs text-muted-foreground">{[event.category, event.subCategory].filter(Boolean).map(label).join(" · ")}</p>
      <dl className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Starts</dt><dd>{date(event.startDate, true)}</dd></div><div><dt className="text-xs text-muted-foreground">Ends</dt><dd>{date(event.endDate, true)}</dd></div></dl>
    </section>
    <Section title="Venues">{event.venues?.length ? event.venues.map((venue) => <div key={venue.id}><h3 className="font-medium">{venue.name}</h3><p className="text-muted-foreground">{[venue.fullAddress, venue.city, venue.state, venue.postalCode, venue.country].filter(Boolean).join(", ")}</p></div>) : <p className="text-muted-foreground">Venue to be announced.</p>}</Section>
    {event.description && <Section title="About" collapsible><Text value={event.description} /></Section>}
    <Section title="Tickets">{event.tickets?.length ? event.tickets.map((ticket) => <div key={ticket.id} className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0"><div className="flex flex-wrap justify-between gap-2 font-medium"><h3>{ticket.name || label(ticket.type) || "Ticket"}</h3><span>{money(ticket.price)}</span></div>{ticket.info && <Text value={ticket.info} />}<p className="text-xs text-muted-foreground">{[label(ticket.entryType), ticket.comingSoon && "Coming soon", ticket.onGroundOnly && "On-ground only", ticket.totalQty != null && `${ticket.soldQty ?? 0} / ${ticket.totalQty} sold`, ticket.maxPerUser != null && `Limit ${ticket.maxPerUser} per person`].filter(Boolean).join(" · ")}</p>{ticket.purchaseExpiry && <p className="text-xs text-muted-foreground">Sales close {date(ticket.purchaseExpiry, true)}</p>}</div>) : <p className="text-muted-foreground">No ticket options added.</p>}</Section>
    {!!event.artists?.length && <Section title="Artists" collapsible>{event.artists.map((artist) => <div key={artist.id} className="flex items-center gap-3">{artist.image && <img src={normalizeEventBannerUrl(artist.image)} alt="" loading="lazy" className="h-12 w-12 rounded-lg object-cover" />}<p>{artist.name}</p></div>)}</Section>}
    {!!gallery.length && <Section title="Gallery" collapsible><div className="grid grid-cols-2 gap-2">{gallery.map((item) => <img key={item.id || item.url} src={normalizeEventBannerUrl(item.url)} alt="Event gallery" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />)}</div></Section>}
    {!!event.sponsors?.length && <Section title="Sponsors" collapsible>{event.sponsors.map((entry) => { const sponsor = entry.sponsor || entry; return <div key={entry.id || sponsor.id} className="flex items-center gap-3">{sponsor.logoUrl && <img src={normalizeEventBannerUrl(sponsor.logoUrl)} alt="" loading="lazy" className="h-12 w-12 rounded-lg object-contain" />}<p>{sponsor.name}</p></div>; })}</Section>}
    {!!warnings.length && <Section title="Advisories" collapsible>{warnings.map((warning, index) => <Text key={index} value={warning} />)}</Section>}
    {event.organizerNote && <Section title="Organizer note" collapsible><Text value={event.organizerNote} /></Section>}
    {!!terms.length && <Section title="Terms and conditions" collapsible>{terms.map((term, index) => <Text key={term.id || index} value={typeof term === "string" ? term : term.content || term.terms || ""} />)}</Section>}
  </div>;
}

export function OrganizerMobileEventDetail() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const query = useQuery({
    queryKey: ["organizer-mobile-event", user.id, eventId],
    queryFn: async () => {
      const response = await apiFetch(`event/manage/${encodeURIComponent(eventId)}`, { method: "GET" });
      const event = response.data ?? response;
      if (!event?.id) throw Object.assign(new Error("Event unavailable"), { status: 404 });
      return event;
    },
    retry: false,
  });
  const backParams = new URLSearchParams();
  if (params.get("search")) backParams.set("search", params.get("search"));
  if (params.get("page")) backParams.set("page", params.get("page"));
  return <div className="space-y-3"><Link to={{ pathname: "/organizer/myevents", search: backParams.toString() }} className={button}><ArrowLeft size={16} />Back to events</Link><QueryState query={query}>{query.data && <EventContent event={query.data} />}</QueryState></div>;
}
