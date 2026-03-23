import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader,
  Clock,
  Tag,
  Plus,
  X,
  AlertTriangle,
  Ban,
  Users,
  RotateCcw,
  BarChart2,
} from "lucide-react";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import { apiFetch } from "@/config/api";
import { toast } from "sonner";

const MyEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();

  const {
    events: rawEvents,
    loading,
    error,
    invalidateCache,
    refresh,
  } = useOrganizerEvents();

  useEffect(() => {
    console.log("MyEvents mounted — Loading:", loading, "Error:", error, "Count:", rawEvents?.length || 0);
  }, [loading, error, rawEvents]);

  const events = useMemo(() => {
    if (!Array.isArray(rawEvents)) return [];
    return rawEvents.map((event) => {
      const startDate = event.startDate ? new Date(event.startDate) : null;
      const endDate = event.endDate ? new Date(event.endDate) : null;
      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        flyerImage: event.flyerImage || "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
        category: event.category,
        subCategory: event.subCategory,
        description: event.description,
        eventStatus: event.eventStatus || event.status1,
        publishStatus: event.publishStatus || event.status2 || event.status,
        startDate,
        endDate,
        createdAt: event.createdAt ? new Date(event.createdAt) : null,
        venues: event.venues || [],
        organizer: event.organizer,
        stats: event.stats || {},
        _count: event._count || {},
        location:
          event.venues && event.venues.length > 0
            ? `${event.venues[0].city || ""}${event.venues[0].city && event.venues[0].state ? ", " : ""}${event.venues[0].state || ""}`.trim()
            : "Location TBD",
        attendees: event._count?.bookings || 0,
        revenue: event.stats?.totalRevenue || 0,
        ticketsSold: event.stats?.totalTicketsSold || 0,
      };
    });
  }, [rawEvents]);

  const formatDateShort = (start, end) => {
    if (!start) return "Date TBD";
    const s = start.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    if (!end || start.toDateString() === end.toDateString()) return s;
    const e = end.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    return `${s} - ${e}`;
  };

  const formatTime = (start, end) => {
    if (!start) return "Time TBD";
    const s = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (!end) return s;
    return `${s} - ${end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const getPublishBadge = (publishStatus) => {
    const n = (publishStatus || "").toUpperCase();
    if (n === "PUBLISHED" || n === "ACTIVE") return { text: "Published", cls: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" };
    if (n === "DRAFT") return { text: "Draft", cls: "bg-amber-500/10 text-amber-300 border border-amber-500/20" };
    if (n === "PENDING" || n === "REVIEW") return { text: "Review", cls: "bg-secondary/15 text-accent border border-secondary/30" };
    if (n === "ARCHIVED" || n === "CANCELLED") return { text: n.charAt(0) + n.slice(1).toLowerCase(), cls: "bg-destructive/10 text-destructive border border-destructive/30" };
    return { text: publishStatus || "Unknown", cls: "bg-background/60 text-muted-foreground border border-border/60" };
  };

  const getStateBadge = (eventStatus) => {
    const n = (eventStatus || "").toUpperCase();
    if (n === "UPCOMING") return { text: "Upcoming", cls: "bg-primary/15 text-accent border border-primary/30" };
    if (n === "ONGOING" || n === "LIVE") return { text: "Live", cls: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20", dot: true };
    if (n === "COMPLETED" || n === "ENDED" || n === "PAST") return { text: "Completed", cls: "bg-background/60 text-muted-foreground border border-border/60" };
    if (n === "CANCELLED") return { text: "Cancelled", cls: "bg-destructive/10 text-destructive border border-destructive/30" };
    return { text: eventStatus || "TBD", cls: "bg-background/60 text-muted-foreground border border-border/60" };
  };

  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    if (!searchTerm.trim()) return events;
    const q = searchTerm.toLowerCase();
    return events.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.subCategory?.toLowerCase().includes(q)
    );
  }, [events, searchTerm]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  const summary = useMemo(() => {
    const published = events.filter((e) => getPublishBadge(e.publishStatus).text === "Published").length;
    const drafts = events.filter((e) => getPublishBadge(e.publishStatus).text === "Draft").length;
    const upcoming = events.filter((e) => getStateBadge(e.eventStatus).text === "Upcoming").length;
    return { total: events.length, published, drafts, upcoming };
  }, [events]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete?.id) return;
    setDeleteLoading(true);
    try {
      const response = await apiFetch(`api/event/delete-event/${confirmDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response || response.error || response.success === false) {
        throw new Error(response?.message || "Failed to delete event");
      }
      invalidateCache();
      refresh();
      toast.success("Event deleted successfully");
      if (startIndex >= filteredEvents.length - 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      toast.error(err.message || "Failed to delete event. Please try again.");
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  }, [confirmDelete, invalidateCache, refresh, startIndex, filteredEvents.length, currentPage]);

  const handleCancel = useCallback(async () => {
    if (!confirmCancel?.id) return;
    setCancelLoading(true);
    try {
      const response = await apiFetch(`api/event/cancel-event/${confirmCancel.id}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response || response.error || response.success === false) {
        throw new Error(response?.message || "Failed to cancel event");
      }
      invalidateCache();
      refresh();
      toast.success(
        response?.message ||
          "Cancellation request submitted. Promoter/Admin will handle cancellation approval and refund initiation."
      );
    } catch (err) {
      console.error("Error cancelling event:", err);
      toast.error(err.message || "Failed to submit cancellation request. Please try again.");
    } finally {
      setCancelLoading(false);
      setConfirmCancel(null);
    }
  }, [confirmCancel, invalidateCache, refresh]);

  const isCancellable = (event) => {
    const status = (event.eventStatus || "").toUpperCase();
    return status !== "CANCELLED" && status !== "COMPLETED";
  };

  const isDeletable = (event) => {
    const pubStatus = (event.publishStatus || "").toUpperCase();
    const evtStatus = (event.eventStatus || "").toUpperCase();
    return pubStatus === "DRAFT" || evtStatus === "CANCELLED";
  };

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleEditEvent = useCallback((event) => {
    setConfirmDelete(null);
    setConfirmCancel(null);
    navigate(`/organizer/create-event?edit=${event.id}`, { state: { event } });
  }, [navigate]);

  return (
    <div className="w-full max-w-6xl mx-auto text-foreground space-y-6">
      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-in {
          animation: card-in 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>

      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-elegant)] space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Organizer Portal</p>
            <h1 className="text-xl font-semibold tracking-tight">My Events</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage published, draft, and upcoming events from one place.</p>
          </div>
          <button
            onClick={() => navigate("/organizer/select-event-type")}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-[var(--shadow-card)]"
          >
            <Plus className="w-3.5 h-3.5" />
            New Event
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Total", value: summary.total, cls: "text-foreground" },
            { label: "Published", value: summary.published, cls: "text-emerald-300" },
            { label: "Drafts", value: summary.drafts, cls: "text-accent" },
            { label: "Upcoming", value: summary.upcoming, cls: "text-accent" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/60 border border-border/60 text-xs"
            >
              <span className="text-muted-foreground">{s.label}</span>
              <span className={`font-semibold ${s.cls}`}>{s.value}</span>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, location, category..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-9 pr-10 py-2.5 text-sm bg-background/60 border border-border/60 rounded-lg placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="w-5 h-5 text-muted-foreground animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Loading events...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
          <p className="text-sm font-medium text-destructive">Error loading events</p>
          <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedEvents.map((event, i) => {
              const pub = getPublishBadge(event.publishStatus);
              const state = getStateBadge(event.eventStatus);
              return (
                <div
                  key={event.id}
                  className="group animate-card-in rounded-2xl bg-card border border-border/60 overflow-hidden shadow-[var(--shadow-card)] hover:border-primary/30 hover:bg-card/95 transition-all duration-200"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Image */}
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={event.flyerImage}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${pub.cls}`}>{pub.text}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 ${state.cls}`}>
                        {state.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {state.text}
                      </span>
                    </div>
                    {/* Category pill on image */}
                    {event.category && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-background/75 text-foreground/80 border border-border/60 backdrop-blur-sm">
                        {event.category}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-3.5 space-y-2.5">
                    {/* Title */}
                    <h3 className="text-[13px] font-semibold leading-snug truncate" title={event.title}>
                      {event.title || "Untitled Event"}
                    </h3>

                    {/* Meta rows */}
                    <div className="space-y-1.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                        <span>{formatDateShort(event.startDate, event.endDate)}</span>
                        <span className="text-border mx-0.5">|</span>
                        <Clock className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                        <span>{formatTime(event.startDate, event.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    {/* Sub-category tag */}
                    {event.subCategory && (
                      <div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground bg-background/60 border border-border/60">
                          <Tag className="w-2.5 h-2.5" />
                          {event.subCategory}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
                      <button
                        onClick={() => event.organizer?.slug && event.slug && navigate(`/events/${event.organizer.slug}/${event.slug}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        title="View event"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/organizer/events/${event.id}/attendees`)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-primary/10 transition-colors"
                        title="View attendees"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/organizer/${event.organizer?.slug}/events/${event.slug}/analytics`,
                            {
                              state: {
                                organizerId: event.organizer?.id,
                                eventId: event.id,
                                eventTitle: event.title,
                              },
                            }
                          )
                        }
                        className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-secondary/15 transition-colors"
                        title="View analytics"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/organizer/events/${event.id}/refunds`)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-primary/10 transition-colors"
                        title="View refunds"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex-1" />
                      {isCancellable(event) && (
                        <button
                          onClick={() => setConfirmCancel(event)}
                          className="p-1.5 rounded-md text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          title="Cancel event"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isDeletable(event) && (
                        <button
                          onClick={() => setConfirmDelete(event)}
                          className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* No search results */}
          {filteredEvents.length === 0 && searchTerm && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full bg-background/60 border border-border/60 flex items-center justify-center mb-3">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No events found</p>
              <p className="text-xs text-muted-foreground/80 mt-0.5">Try a different search term</p>
            </div>
          )}

          {/* Empty state */}
          {events.length === 0 && !searchTerm && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full bg-background/60 border border-border/60 flex items-center justify-center mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No events yet</p>
              <p className="text-xs text-muted-foreground/80 mt-0.5 mb-4">Create your first event to get started</p>
              <button
                onClick={() => navigate("/organizer/select-event-type")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Event
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 px-1">
              <p className="text-xs text-muted-foreground">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredEvents.length)} of {filteredEvents.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                      page === currentPage
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-card-in"
            onClick={() => !deleteLoading && setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-sm bg-card border border-border/60 rounded-xl p-5 shadow-[var(--shadow-elegant)] animate-card-in space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-lg bg-destructive/10 border border-destructive/25">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Delete event?</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  <span className="text-foreground font-medium">"{confirmDelete.title || "Untitled"}"</span> will be permanently removed.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleteLoading}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-background/60 border border-border/60 text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {deleteLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-card-in"
            onClick={() => !cancelLoading && setConfirmCancel(null)}
          />
          <div className="relative w-full max-w-sm bg-card border border-border/60 rounded-xl p-5 shadow-[var(--shadow-elegant)] animate-card-in space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-lg bg-secondary/15 border border-secondary/25">
                <Ban className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Cancel event?</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  <span className="text-foreground font-medium">"{confirmCancel.title || "Untitled"}"</span> cancellation will be submitted for promoter/admin approval.
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-secondary/10 border border-secondary/20 px-3 py-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Refunds are not initiated from organizer side. Promoter/Admin will manually approve and trigger automated refunds.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmCancel(null)}
                disabled={cancelLoading}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-background/60 border border-border/60 text-foreground hover:bg-muted transition-colors"
              >
                Keep Event
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/85 transition-colors disabled:opacity-60"
              >
                {cancelLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEvents;
