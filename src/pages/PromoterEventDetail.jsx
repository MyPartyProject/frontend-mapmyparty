import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  Clock,
  Loader,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Users,
  Wallet2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { fetchModerationEventDetail, reviewModerationEvent } from "@/services/adminService";
import { toast } from "sonner";

const publishBadgeVariant = {
  PUBLISHED: "success",
  PENDING: "default",
  DRAFT: "secondary",
  UNPUBLISHED: "secondary",
};

const moderationActions = [
  {
    key: "APPROVE",
    label: "Approve event",
    description: "Publishes the event for discovery if all other conditions are met.",
    buttonVariant: "default",
  },
  {
    key: "REQUEST_CHANGES",
    label: "Request changes",
    description: "Returns this submission to the organizer for changes. The last approved event stays live.",
    buttonVariant: "outline",
  },
  {
    key: "REJECT",
    label: "Reject event",
    description: "Initial publication is permanently blocked. For a live event, only these edits are rejected; the approved event remains live.",
    buttonVariant: "destructive",
  },
];

const reviewLabel = key => ({ TC: 'Terms and conditions', flyerImage: 'Event flyer', images: 'Gallery', totalQty: 'Capacity', entryType: 'Admission', purchaseExpiry: 'Sales close', gstType: 'Tax type', gstRate: 'Tax rate' }[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase()));
const reviewKeys = object => Object.entries(object || {}).filter(([key]) => !/Storage|Mime|Size|^id$|^eventId$|^publicId$|lastUpdated/i.test(key));
function ReviewValue({ value, name = '' }) {
  if (value == null || value === '') return <span className="text-muted-foreground">Not provided</span>;
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (typeof value === 'string' && ['flyerImage', 'url', 'image', 'logoUrl'].includes(name) && /^https?:\/\//.test(value)) return <a href={value} target="_blank" rel="noreferrer"><img src={value} alt={reviewLabel(name)} className="max-h-36 max-w-full rounded-md object-contain" /></a>;
  if (Array.isArray(value)) return value.length ? <div className="space-y-3">{value.map((item, index) => <div key={item?.id || index} className="min-w-0 border-l border-border/50 pl-3"><ReviewValue value={item} name={name} /></div>)}</div> : <span className="text-muted-foreground">None</span>;
  if (typeof value === 'object') return <dl className="space-y-2">{reviewKeys(value).map(([key, item]) => <div key={key}><dt className="text-xs text-muted-foreground">{reviewLabel(key)}</dt><dd className="min-w-0 [overflow-wrap:anywhere]"><ReviewValue value={item} name={key} /></dd></div>)}</dl>;
  const text = typeof value === 'string' && /<[^>]+>/.test(value) ? new DOMParser().parseFromString(value, 'text/html').body.textContent : String(value);
  return <p className="whitespace-pre-wrap break-words text-sm">{text}</p>;
}

const PromoterEventDetail = () => {
  const { id } = useParams();
  const { currency, statusBadge, taskSummary } = useOutletContext();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [moderationNotes, setModerationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const mountedRef = useRef(true);

  const loadEvent = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await fetchModerationEventDetail(id);
      if (mountedRef.current) {
        setEvent(data || null);
        setModerationNotes(data?.moderationNotes || "");
      }
    } catch (fetchError) {
      if (!mountedRef.current) return;
      if (fetchError.status === 404) {
        setNotFound(true);
        setEvent(null);
      } else {
        setError(fetchError.message || "Failed to fetch event details");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    loadEvent();
    return () => {
      mountedRef.current = false;
    };
  }, [loadEvent]);

  const handleModeration = useCallback(
    async (action) => {
      if (!event?.id || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await reviewModerationEvent(event.id, {
          action,
          notes: moderationNotes.trim(),
          revisionId: event.publication.id,
          expectedVersion: event.publication.version,
        });
        toast.success("Event moderation updated.");
        setActiveAction(null);
        taskSummary.refresh();
        loadEvent();
      } catch (actionError) {
        toast.error(actionError.message || "Failed to update moderation status.");
      } finally {
        if (mountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [event, isSubmitting, loadEvent, moderationNotes, taskSummary]
  );

  const publicEventPath = event?.organizer?.slug && event?.slug
    ? '/events/' + encodeURIComponent(event.organizer.slug) + '/' + encodeURIComponent(event.slug)
    : null;
  const publicEventUrl = publicEventPath ? new URL(publicEventPath, window.location.origin).href : null;

  const primaryVenue = event?.venues?.find((venue) => venue.isPrimary) || event?.venues?.[0] || null;
  const totalTickets = useMemo(
    () => event?.tickets?.reduce((sum, ticket) => sum + Number(ticket.totalQty || 0), 0) || 0,
    [event?.tickets]
  );
  const soldTickets = useMemo(
    () => event?.tickets?.reduce((sum, ticket) => sum + Number(ticket.soldQty || 0), 0) || 0,
    [event?.tickets]
  );
  const capacityUsed = totalTickets ? Math.round((soldTickets / totalTickets) * 100) : 0;
  const lowestTicketPrice = useMemo(() => {
    if (!event?.tickets?.length) return null;
    return Math.min(...event.tickets.map((ticket) => Number(ticket.price || 0)));
  }, [event?.tickets]);

  const formatDate = useCallback((value, withTime = false) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-w-0 space-y-4 text-sm [overflow-wrap:anywhere] [&_svg]:shrink-0">
        {/* <Link to="/promoter/events" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-9">
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link> */}
        <Card className="bg-card/70 border-border/60">
          <CardContent className="p-6 text-center">
            <p className="text-base font-semibold">Event not found</p>
            <p className="mt-2 text-sm text-muted-foreground">Select another event from the moderation list.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 text-sm [overflow-wrap:anywhere] [&_svg]:shrink-0">
      {/* <Link to="/promoter/events" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-9">
        <ArrowLeft className="w-4 h-4" /> Back to events
      </Link> */}

      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Error loading event details</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {event && (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            <Card className="bg-card/70 border-border/60">
              <CardHeader className="p-4 pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl leading-snug [overflow-wrap:anywhere]">{event.title}</CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground [&>div]:max-w-full [&>div]:px-2">
                      <Badge variant={statusBadge(event.eventStatus)}>{event.eventStatus}</Badge>
                      <Badge variant={publishBadgeVariant[event.publishStatus] || "outline"}>{event.publishStatus}</Badge>
                      <Badge variant="outline">{event.category}</Badge>
                      {event.subCategory && <span>{event.subCategory}</span>}
                    </div>
                  </div>
                  <div className="min-w-0 text-muted-foreground">
                    <p className="text-xs text-muted-foreground">Event ID</p>
                    <p className="break-all text-xs">{event.publicId || event.id}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-0">
                <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">About the event</p><ReviewValue value={event.description || "No description provided."} /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">Starts</p><p className="text-sm text-foreground">{formatDate(event.startDate, true)}</p></div>
                  </div>
                  <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">Ends</p><p className="text-sm text-foreground">{event.endDate ? formatDate(event.endDate, true) : "Single-session event"}</p></div>
                  </div>
                  <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">Venue</p><p className="text-sm text-foreground">{primaryVenue?.name || "Venue not set"}</p></div>
                  </div>
                  <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">Location</p><p className="text-sm text-foreground">{[primaryVenue?.city, primaryVenue?.state, primaryVenue?.country].filter(Boolean).join(", ") || "Location not set"}</p></div>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Event detail URL</p>
                    {publicEventUrl ? (
                      <a href={publicEventUrl} target="_blank" rel="noopener noreferrer" className="block break-all rounded-sm text-xs text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring light:text-accent-foreground">{publicEventUrl}</a>
                    ) : <p className="text-xs text-muted-foreground">Event link is not available yet.</p>}
                    {event.publishStatus !== 'PUBLISHED' && <p className="text-xs text-muted-foreground">This event is not published. Its public page may be unavailable.</p>}
                  </div>
                  {publicEventUrl && (
                    <Button asChild variant="outline" size="sm" className="h-11 shrink-0 md:h-9 [@media(pointer:coarse)]:h-11">
                      <a href={publicEventUrl} target="_blank" rel="noopener noreferrer">Open event page <ExternalLink className="h-4 w-4" /></a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid min-w-0 divide-y divide-border/50 rounded-lg border border-border/60 bg-card/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">


            <div className="min-w-0">
                <div className="space-y-1 p-3 sm:p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Ticket className="h-4 w-4" /> Tickets sold
                  </p>
                  <p className="text-base font-semibold tabular-nums">{soldTickets.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">of {totalTickets.toLocaleString()} total</p>
                </div>
              </div>
              <div className="min-w-0">
                <div className="space-y-1 p-3 sm:p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-4 w-4" /> Organizer
                  </p>
                  <p className="text-base font-semibold">{event.organizer?.name || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.organizer?.isVerified ? "Verified organizer" : "Unverified organizer"}
                  </p>
                </div>
              </div>
              <div className="min-w-0">
                <div className="space-y-1 p-3 sm:p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wallet2 className="h-4 w-4" /> Lowest price
                  </p>
                  <p className="text-base font-semibold tabular-nums text-accent light:text-accent-foreground">
                    {lowestTicketPrice !== null ? currency(lowestTicketPrice) : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">{event.type || "Event type not set"}</p>
                </div>
              </div>
            </div>

            <Card className="bg-card/70 border-border/60">
              <CardHeader className="p-4 pb-3"><CardTitle className="text-base leading-snug">Submitted content</CardTitle><CardDescription>{event.publication?.status?.replaceAll('_', ' ')} / {event.publication?.isInitial ? 'Initial publication' : 'Changes to a live event'}</CardDescription></CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-0">
                {reviewKeys(event.submittedContent).map(([key, value]) => <details key={key} className="group min-w-0 rounded-md border border-border/50 px-3 open:bg-muted/20">
                  <summary className="cursor-pointer rounded-sm py-3 text-sm font-medium break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{reviewLabel(key)}{event.approvedContent && JSON.stringify(value) !== JSON.stringify(event.approvedContent[key]) ? ' (changed)' : ''}</summary>
                  <div className={event.approvedContent ? 'grid min-w-0 gap-4 border-t border-border/40 py-3 md:grid-cols-2 [&>div]:min-w-0' : 'border-t border-border/40 py-3'}>
                    {event.approvedContent && <div><p className="text-xs text-muted-foreground">Currently approved</p><ReviewValue value={event.approvedContent[key]} name={key} /></div>}
                    <div><p className="text-xs text-muted-foreground">Submitted</p><ReviewValue value={value} name={key} /></div>
                  </div>
                </details>)}
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-border/60">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-base leading-snug">Tickets</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Ticket tiers and current inventory.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4 pt-0">
                {event.tickets?.length ? (
                  event.tickets.map((ticket) => (
                    <div key={ticket.id} className="min-w-0 border-b border-border/40 py-3 first:pt-0 last:border-0 last:pb-0">
                      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div>
                          <p className="font-semibold">{ticket.name}</p>
                          <p className="text-xs text-muted-foreground">{ticket.publicId || ticket.id}</p>
                        </div>
                        <div className="min-w-0 tabular-nums sm:text-right">
                          <p className="font-semibold text-accent light:text-accent-foreground">{currency(ticket.price)}</p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.soldQty}/{ticket.totalQty} sold
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-3 text-sm text-muted-foreground">
                    No tickets configured for this event.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 space-y-4 text-sm [overflow-wrap:anywhere] [&_svg]:shrink-0">
            <Card className="bg-card/70 border-border/60">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-base leading-snug">Moderator actions</CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  Review the submitted content before choosing an action.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-0">
                <div>
                  <label htmlFor="moderation-notes" className="text-sm font-medium">
                    Moderator notes
                  </label>
                  <Textarea
                    id="moderation-notes"
                    value={moderationNotes}
                    onChange={(eventValue) => setModerationNotes(eventValue.target.value)}
                    placeholder="Explain the changes needed or the rejection reason. The organizer will see this note."
                    className="mt-1.5 min-h-24 text-sm"
                    maxLength={1000}
                  />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{event.publication?.status === "PENDING" ? "A note is required when requesting changes or rejecting an event." : "Review actions are available only for pending submissions."}</p>
                <div className="space-y-2">
                  {moderationActions.map((action) => (
                    <AlertDialog
                      key={action.key}
                      open={activeAction === action.key}
                      onOpenChange={(open) => setActiveAction(open ? action.key : null)}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant={action.buttonVariant}
                          className="h-11 w-full justify-center text-sm md:h-9 [@media(pointer:coarse)]:h-11"
                          disabled={isSubmitting || event.publication?.status !== 'PENDING' || (action.key !== 'APPROVE' && !moderationNotes.trim())}
                        >
                          {action.label}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg p-4 sm:p-5">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base">{action.label}?</AlertDialogTitle>
                          <AlertDialogDescription>{action.description}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:space-x-0 [&_button]:m-0 [&_button]:h-11 [&_button]:text-sm md:[&_button]:h-9 [@media(pointer:coarse)]:[&_button]:h-11">
                          <AlertDialogCancel disabled={isSubmitting || event.publication?.status !== 'PENDING'}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => { if (action.key !== 'APPROVE' && !moderationNotes.trim()) { toast.error('A review note is required.'); return; } handleModeration(action.key); }}
                            disabled={isSubmitting || event.publication?.status !== 'PENDING'}
                            className={
                              action.buttonVariant === "destructive"
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : undefined
                            }
                          >
                            {isSubmitting ? "Updating..." : action.label}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-border/60">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-base leading-snug">Compliance</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Review status and organizer trust signals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-0 text-sm">
                <div className="min-w-0 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">Publish status</p>
                  <p className="font-semibold">{event.publishStatus}</p>
                </div>
                <div className="min-w-0 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">Organizer state</p>
                  <p className="font-semibold flex items-center gap-2">
                    {event.organizer?.isSuspended ? (
                      <>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        Suspended
                      </>
                    ) : event.organizer?.isVerified ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Needs review
                      </>
                    )}
                  </p>
                </div>
                <div className="min-w-0 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">Last moderation update</p>
                  <p className="font-semibold">
                    {event.moderationReviewedAt ? formatDate(event.moderationReviewedAt, true) : "Not reviewed yet"}
                  </p>
                </div>
                <div className="min-w-0 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">Capacity used</p>
                  <p className="font-semibold">{capacityUsed}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-border/60">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-base leading-snug">Organizer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-0 text-sm">
                <div>
                  <p className="font-semibold">{event.organizer?.name || "Unknown organizer"}</p>
                  <p className="text-muted-foreground">{event.organizer?.slug || "No slug"}</p>
                </div>
                <div className="grid gap-2 text-muted-foreground">
                  <p>Owner: {event.organizer?.owner?.name || "N/A"}</p>
                  <p>Email: {event.organizer?.owner?.email || "N/A"}</p>
                  <p>Phone: {event.organizer?.owner?.phone || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoterEventDetail;
