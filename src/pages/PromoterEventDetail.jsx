import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
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
    key: "MOVE_TO_REVIEW",
    label: "Send back to review",
    description: "Keeps the event out of public discovery until the organizer updates it.",
    buttonVariant: "outline",
  },
  {
    key: "REJECT",
    label: "Reject event",
    description: "Rejects the current submission and returns it to draft state.",
    buttonVariant: "destructive",
  },
];

const PromoterEventDetail = () => {
  const { id } = useParams();
  const { currency, statusBadge } = useOutletContext();
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
        });
        toast.success("Event moderation updated.");
        setActiveAction(null);
        loadEvent();
      } catch (actionError) {
        toast.error(actionError.message || "Failed to update moderation status.");
      } finally {
        if (mountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [event?.id, isSubmitting, loadEvent, moderationNotes]
  );

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
      <div className="space-y-6">
        <Link to="/promoter/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>
        <Card className="bg-card/70 border-border/60">
          <CardContent className="py-16 text-center">
            <p className="text-lg font-semibold">Event not found</p>
            <p className="mt-2 text-sm text-muted-foreground">Select another event from the moderation list.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/promoter/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to events
      </Link>

      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Error loading event details</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {event && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="bg-card/70 border-border/60">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{event.title}</CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
                      <Badge variant={statusBadge(event.eventStatus)}>{event.eventStatus}</Badge>
                      <Badge variant={publishBadgeVariant[event.publishStatus] || "outline"}>{event.publishStatus}</Badge>
                      <Badge variant="outline">{event.category}</Badge>
                      {event.subCategory && <span>{event.subCategory}</span>}
                    </CardDescription>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-2">
                    <p className="text-xs text-muted-foreground">Event ID</p>
                    <p className="text-sm">{event.publicId || event.id}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{event.description || "No description provided."}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.startDate, true)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {event.endDate ? formatDate(event.endDate, true) : "Single-session event"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {primaryVenue?.name || "Venue not set"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {[primaryVenue?.city, primaryVenue?.state, primaryVenue?.country].filter(Boolean).join(", ") || "Location not set"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-card/70 border-border/60">
                <CardContent className="p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Ticket className="h-4 w-4" /> Tickets sold
                  </p>
                  <p className="text-2xl font-semibold">{soldTickets.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">of {totalTickets.toLocaleString()} total</p>
                </CardContent>
              </Card>
              <Card className="bg-card/70 border-border/60">
                <CardContent className="p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-4 w-4" /> Organizer
                  </p>
                  <p className="text-lg font-semibold">{event.organizer?.name || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.organizer?.isVerified ? "Verified organizer" : "Unverified organizer"}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/70 border-border/60">
                <CardContent className="p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wallet2 className="h-4 w-4" /> Lowest price
                  </p>
                  <p className="text-2xl font-semibold text-accent">
                    {lowestTicketPrice !== null ? currency(lowestTicketPrice) : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">{event.type || "Event type not set"}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/70 border-border/60">
              <CardHeader>
                <CardTitle>Tickets</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Ticket tiers and current inventory.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.tickets?.length ? (
                  event.tickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-xl border border-border/60 bg-card/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{ticket.name}</p>
                          <p className="text-xs text-muted-foreground">{ticket.publicId || ticket.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-accent">{currency(ticket.price)}</p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.soldQty}/{ticket.totalQty} sold
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-border/60 bg-card/80 p-6 text-sm text-muted-foreground">
                    No tickets configured for this event.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/70 border-border/60">
              <CardHeader>
                <CardTitle>Moderator actions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Review, approve, or return this event without editing organizer data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="moderation-notes" className="text-sm font-medium">
                    Moderator notes
                  </label>
                  <Textarea
                    id="moderation-notes"
                    value={moderationNotes}
                    onChange={(eventValue) => setModerationNotes(eventValue.target.value)}
                    placeholder="Add guidance for the organizer or internal moderation context."
                    className="mt-2"
                    maxLength={1000}
                  />
                </div>
                <div className="space-y-3">
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
                          className="w-full justify-start"
                          disabled={isSubmitting}
                        >
                          {action.label}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{action.label}?</AlertDialogTitle>
                          <AlertDialogDescription>{action.description}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleModeration(action.key)}
                            disabled={isSubmitting}
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
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Review status and organizer trust signals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                  <p className="text-xs text-muted-foreground">Publish status</p>
                  <p className="font-semibold">{event.publishStatus}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/80 p-3">
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
                <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                  <p className="text-xs text-muted-foreground">Last moderation update</p>
                  <p className="font-semibold">
                    {event.moderationReviewedAt ? formatDate(event.moderationReviewedAt, true) : "Not reviewed yet"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                  <p className="text-xs text-muted-foreground">Capacity used</p>
                  <p className="font-semibold">{capacityUsed}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-border/60">
              <CardHeader>
                <CardTitle>Organizer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
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
