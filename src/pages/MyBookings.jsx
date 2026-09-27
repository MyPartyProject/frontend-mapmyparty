import { useState, useEffect, useMemo, useCallback } from "react";
import { Ticket, Calendar, MapPin, Loader2, Receipt, CreditCard, Download, Search, ChevronRight, Star, Eye, LifeBuoy } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import VintageTicket from "@/components/VintageTicket";
import { apiFetch, downloadFile } from "@/config/api";
import { toast } from "sonner";
import StarRating from "@/components/StarRating";
import { resolveEventBannerImage } from "@/utils/eventBannerImage";
import { formatIndianRupee } from "@/utils/priceFormatter";
import { getUpcomingBookings, loadAllBookings } from "@/utils/userBookings";

const MyBookings = ({
  browseEventsPath = "/dashboard/browse-events",
  showSummarySections = true,
}) => {
  const feedbackSuggestions = [
    "Loved every minute of the performances!",
    "Great crowd energy and smooth entry experience.",
    "Sound and lighting were on point, would attend again.",
    "Felt the schedule ran late; could improve timing.",
  ];

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const refreshRequest = useRef(null);
  const upcomingTrigger = useRef(null);
  const ticketTrigger = useRef(null);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [ticketsModalOpen, setTicketsModalOpen] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedBookingTickets, setSelectedBookingTickets] = useState([]);
  const [selectedBookingForTickets, setSelectedBookingForTickets] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [bookingAnalytics, setBookingAnalytics] = useState({
    totalBookings: 0,
    totalSpent: 0,
  });
  const [bookingAnalyticsLoaded, setBookingAnalyticsLoaded] = useState(false);

  const getBookingDisplayId = useCallback((booking) => {
    return booking?.publicId || booking?.id || "N/A";
  }, []);

  const fetchBookings = useCallback(async (signal) => {
    try {
      setError(null);
      const items = await loadAllBookings(apiFetch, signal);
      if (signal.aborted) return;
      const normalized = items.map((item) => {
        const evt = item.event || {};
        const startDate = evt.startDate || null;
        const endDate = evt.endDate || null;
        const statusNormalized = (item.status || "").toLowerCase();
        const paymentStatus = (item.payment?.status || "").toLowerCase();
        const location = evt.venue ? [evt.venue.city, evt.venue.state].filter(Boolean).join(", ") : null;
        const formatTime = (date) => {
          if (!date) return "Time TBA";
          const d = new Date(date);
          if (isNaN(d)) return "Time TBA";
          return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        };
        return {
          id: item.id,
          publicId: item.publicId || item.id,
          paymentTransactionId: item.payment?.transactionId || null,
          bookingDate: item.createdAt || evt.createdAt,
          status: statusNormalized,
          paymentStatus,
          eventId: evt.id,
          eventTitle: evt.title || "Event",
          eventDate: startDate || endDate,
          eventEndDate: endDate,
          eventTime: formatTime(startDate),
          image: resolveEventBannerImage(evt, null),
          category: evt.category || evt.subCategory || null,
          location,
          totalPrice: Number(item.totalAmount) || 0,
          payment: item.payment,
          review: item.review || null,
          status1: evt.status1,
          status2: evt.status2,
          eventStatus: evt.eventStatus,
          venue: evt.venue,
          organizer: evt.organizer,
        };
      });
      setBookings(normalized);
    } catch (err) {
      if (signal.aborted) return;
      console.error("Failed to load bookings", err);
      setError(err?.message || "Failed to load your bookings.");
    }
  }, []);

  const fetchBookingsAnalytics = useCallback(async (signal) => {
    try {
      setAnalyticsError(null);
      const response = await apiFetch("/api/user/bookings/analytics", { method: "GET", cache: "no-store", signal });
      if (signal.aborted) return;
      if (response?.success && response?.data) {
        setBookingAnalytics({
          totalBookings: Number(response.data.totalBookings) || 0,
          totalSpent: Number(response.data.totalSpent) || 0,
        });
        setBookingAnalyticsLoaded(true);
      } else { throw new Error("Failed to load booking summary."); }
    } catch (err) {
      if (signal.aborted) return;
      console.error("Failed to load booking analytics", err);
      setAnalyticsError("Could not load your booking summary.");
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    if (refreshRequest.current) return;
    const controller = new AbortController();
    refreshRequest.current = controller;
    setLoading(true);
    try {
      await Promise.all([
        fetchBookings(controller.signal),
        ...(showSummarySections ? [fetchBookingsAnalytics(controller.signal)] : []),
      ]);
    } finally {
      if (refreshRequest.current === controller) {
        refreshRequest.current = null;
        setLoading(false);
      }
    }
  }, [fetchBookings, fetchBookingsAnalytics, showSummarySections]);

  useEffect(() => {
    refreshBookings();
    return () => {
      refreshRequest.current?.abort();
      refreshRequest.current = null;
    };
  }, [refreshBookings]);

  const fetchBookingTickets = useCallback(async (booking) => {
    ticketTrigger.current = document.activeElement;
    setUpcomingModalOpen(false);
    setTicketsLoading(true);
    setSelectedBookingForTickets(booking);
    setTicketsModalOpen(true);
    try {
      const response = await apiFetch(`/api/user/tickets?bookingId=${booking.id}`, { method: "GET" });
      if (response?.success && Array.isArray(response?.data?.items)) {
        const bookingTickets = response.data.items.filter(t => t.bookingId === booking.id);
        setSelectedBookingTickets(bookingTickets);
      } else {
        setSelectedBookingTickets([]);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
      toast.error("Failed to load tickets");
      setSelectedBookingTickets([]);
    } finally { setTicketsLoading(false); }
  }, []);

  const closeTicketsModal = () => { setTicketsModalOpen(false); setSelectedBookingTickets([]); setSelectedBookingForTickets(null); };

  const canDownloadInvoice = useCallback((booking) => {
    return booking?.status === "confirmed" && booking?.paymentStatus === "success";
  }, []);

  const getBookingStatusMeta = (status) => {
    switch (status) {
      case "confirmed":
        return {
          label: "Confirmed",
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "cancelled":
      case "failed":
      case "expired":
        return {
          label: status.charAt(0).toUpperCase() + status.slice(1),
          className: "bg-red-500/10 text-red-300 border-red-500/20",
        };
      default:
        return {
          label: "Pending",
          className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
    }
  };

  const getPaymentStatusMeta = (status) => {
    if (status === "success") {
      return {
        label: "Success",
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    }

    if (status === "failed" || status === "refunded") {
      return {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        className: "bg-red-500/10 text-red-300 border-red-500/20",
      };
    }

    return {
      label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Payment",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    const d = new Date(dateString);
    if (isNaN(d)) return "Date TBA";
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatBookingDate = (dateString) => {
    if (!dateString) return "Date TBA";
    const d = new Date(dateString);
    if (isNaN(d)) return "Date TBA";
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleDownloadTicket = async (ticket) => {
    if (!ticket?.id) return;
    try {
      await downloadFile(`/api/booking/${encodeURIComponent(ticket.bookingId)}/tickets/${encodeURIComponent(ticket.id)}/download`, `ticket-${ticket.id}.pdf`);
      toast.success("Ticket downloaded!");
    } catch (err) {
      toast.error(err?.message || "Failed to download ticket");
    }
  };

  const handleDownloadInvoice = useCallback(async (booking) => {
    if (!booking?.id) return;

    if (!canDownloadInvoice(booking)) {
      toast.error("Invoice is available after payment confirmation.");
      return;
    }

    setDownloadingInvoiceId(booking.id);
    try {
      await downloadFile(
        `/api/booking/${booking.id}/invoice`,
        `invoice-${booking.publicId || booking.id}.pdf`
      );
      toast.success("Invoice download started");
    } catch (err) {
      console.error("Failed to download invoice", err);
      toast.error(err?.message || "Failed to download invoice");
    } finally {
      setDownloadingInvoiceId(null);
    }
  }, [canDownloadInvoice]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (booking.eventTitle || "").toLowerCase().includes(query) ||
        (booking.publicId || "").toLowerCase().includes(query) ||
        (booking.paymentTransactionId || "").toLowerCase().includes(query);
      const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [bookings, searchQuery, filterStatus]);

  const isEventPast = (booking) => {
    const endDate = booking?.eventEndDate || booking?.eventDate;
    if (!endDate) return false;
    const end = new Date(endDate);
    if (isNaN(end)) return false;
    return end < new Date();
  };

  const fetchUserReview = useCallback(async (eventId) => {
    try {
      const response = await apiFetch(`/api/event/${eventId}/reviews/me`, { method: "GET" });
      if (response?.success && response?.data) return response.data;
      return null;
    } catch (err) {
      if (err?.status === 404) return null;
      console.error("Failed to fetch review", err);
      return null;
    }
  }, []);

  const handleOpenReview = async (booking) => {
    if (!booking?.eventId) { toast.error("Event details missing."); return; }
    setReviewRating(0); setReviewComment(""); setSelectedBookingForReview(booking); setReviewDialogOpen(true);
  };

  const handleCloseReview = () => { setReviewDialogOpen(false); setSelectedBookingForReview(null); setReviewRating(0); setReviewComment(""); };

  const handleReviewDialogChange = (open) => {
    if (!open) handleCloseReview();
    else { setReviewRating(0); setReviewComment(""); setReviewDialogOpen(true); }
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview?.eventId) { toast.error("Event details missing."); return; }
    if (reviewRating === 0) { toast.error("Please select a rating"); return; }
    setIsSubmittingReview(true);
    try {
      const payload = { rating: reviewRating, comment: reviewComment.trim() };
      const response = await apiFetch(`/api/event/${selectedBookingForReview.eventId}/reviews`, { method: "POST", body: JSON.stringify(payload) });
      if (response?.success || response?.code === 201) {
        toast.success("Thanks for your feedback!");
        const reviewData = await fetchUserReview(selectedBookingForReview.eventId);
        setBookings((prev) => prev.map((b) => b.id === selectedBookingForReview.id ? { ...b, review: reviewData || payload } : b));
        handleCloseReview();
      } else throw new Error(response?.message || "Failed to submit review");
    } catch (err) {
      console.error("Failed to submit review", err);
      toast.error(err?.message || "Could not submit review");
    } finally { setIsSubmittingReview(false); }
  };

  const hasBookings = bookings.length > 0;
  const hasFilteredBookings = filteredBookings.length > 0;
  const showEmptyState = !loading && !error && !hasBookings;
  const upcomingBookings = useMemo(() => {
    if (!showSummarySections) {
      return [];
    }

    return getUpcomingBookings(bookings);
  }, [bookings, showSummarySections]);

  const renderUpcomingBooking = (booking) => (
    <button key={booking.id} type="button" onClick={() => fetchBookingTickets(booking)}
      className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryCTA">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
        {booking.image ? <img src={booking.image} alt="" className="h-full w-full object-cover" /> : <Calendar aria-hidden="true" className="m-5 h-6 w-6 text-white/30" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="line-clamp-2 break-words text-sm font-semibold">{booking.eventTitle}</h3>
        <p className="text-xs text-white/60">{formatDate(booking.eventDate)} · {booking.eventTime}</p>
        <p className="truncate text-xs text-white/50">{booking.location || "Venue TBA"}</p>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400">View tickets <ChevronRight aria-hidden="true" className="h-3 w-3" /></span>
      </div>
    </button>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-white space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showSummarySections && (
          <dl className="flex min-w-0 w-full sm:w-auto sm:flex-1 flex-wrap items-center gap-x-5 gap-y-3">
            {[
              { label: "Total bookings", value: bookingAnalyticsLoaded ? bookingAnalytics.totalBookings : "—", icon: Receipt, color: "text-rose-400" },
              { label: "Upcoming", value: loading || error ? "—" : upcomingBookings.length, icon: Calendar, color: "text-blue-400" },
              { label: "Total spent", value: bookingAnalyticsLoaded ? formatIndianRupee(bookingAnalytics.totalSpent) : "—", icon: CreditCard, color: "text-emerald-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex min-w-0 items-center gap-2 py-1">
                <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${color}`} />
                <div className="min-w-0">
                  <dt className="text-[10px] sm:text-xs text-white/50">{label}</dt>
                  <dd className="text-sm font-semibold text-white break-words">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
        <Button asChild variant="outline" className="h-11 shrink-0 border-white/10 text-xs">
          <Link to="/dashboard/support?sourceSurface=ATTENDEE_BOOKINGS&category=BOOKING_PAYMENT">
            <LifeBuoy aria-hidden="true" /> Contact support
          </Link>
        </Button>
      </div>
      {(error || analyticsError) && (
        <p role="alert" className="text-sm text-red-300">{[error, analyticsError].filter(Boolean).join(" ")} Reload the page to try again.</p>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            type="search"
            placeholder="Search by event name or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-10 bg-white/[0.05] border-white/[0.08] text-white text-sm placeholder:text-white/30 rounded-lg focus:ring-1 focus:ring-[#D60024]/50"
          />
        </div>
        <div className="flex gap-2">
          {["all", "confirmed"].map((status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs h-10 px-4 ${
                filterStatus === status
                  ? "bg-[#D60024] text-white hover:bg-[#b8001f]"
                  : "bg-white/[0.05] text-white/60 hover:bg-white/[0.08] border border-white/[0.06]"
              }`}
            >
              {status === "all" ? "All" : "Confirmed"}
            </Button>
          ))}
        </div>
      </div>

      {showSummarySections && !loading && !error && (
        <section className="space-y-3" aria-label="Upcoming events">
          {upcomingBookings.length > 0 ? (
            <>
              <Button variant="outline" className="h-11 w-full justify-between border-white/10 sm:hidden"
                onClick={(event) => { upcomingTrigger.current = event.currentTarget; setUpcomingModalOpen(true); }}>
                <span className="flex items-center gap-2"><Calendar aria-hidden="true" /> Upcoming events ({upcomingBookings.length})</span>
                <ChevronRight aria-hidden="true" />
              </Button>
              <div className="hidden sm:block space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold">Upcoming Events</h2>
                  <Button variant="ghost" className="h-11 text-xs"
                    onClick={(event) => { upcomingTrigger.current = event.currentTarget; setUpcomingModalOpen(true); }}>
                    View all ({upcomingBookings.length}) <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {upcomingBookings.slice(0, 2).map(renderUpcomingBooking)}
                </div>
              </div>
            </>
          ) : (
            <p className="flex items-center gap-2 text-xs text-white/50"><Calendar className="h-4 w-4" aria-hidden="true" /> No upcoming events yet.</p>
          )}
        </section>
      )}

      <Dialog open={upcomingModalOpen} onOpenChange={setUpcomingModalOpen}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-2xl max-h-[85dvh] flex flex-col overflow-hidden bg-[#0e0e18] text-white border-white/10 rounded-xl p-4 sm:p-5 motion-reduce:!animate-none"
          onCloseAutoFocus={(event) => { event.preventDefault(); if (!ticketsModalOpen) upcomingTrigger.current?.focus(); }}
        >
          <DialogHeader className="pr-6 text-left">
            <DialogTitle>Upcoming Events</DialogTitle>
            <DialogDescription>Your confirmed upcoming bookings, nearest first.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto space-y-3">
            {upcomingBookings.map(renderUpcomingBooking)}
          </div>
        </DialogContent>
      </Dialog>

      {/* All Bookings */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white">All Bookings</h2>

        {loading && !hasBookings ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-white/20 mb-3" />
            <p className="text-sm text-white/40">Loading bookings...</p>
          </div>
        ) : error && !hasBookings ? null : showEmptyState ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-12 text-center">
            <Ticket className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No bookings yet</h3>
            <p className="text-xs text-white/40 mb-4">Start exploring and book your first event.</p>
            <Link to={browseEventsPath}>
              <Button className="text-sm h-9 px-4">
                Browse Events <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ) : !hasFilteredBookings ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-12 text-center">
            <Search className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No matching bookings</h3>
            <p className="text-xs text-white/40">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all overflow-hidden">
                {/* Header bar */}
                <div className="px-4 py-2.5 border-b border-white/[0.04] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0 text-xs text-white/40">
                    <span className="text-white/70 break-all">{getBookingDisplayId(booking)}</span>
                    <span className="text-white/15">|</span>
                    <span>{formatBookingDate(booking.bookingDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] px-2 py-0.5 border ${getBookingStatusMeta(booking.status).className}`}>
                      {getBookingStatusMeta(booking.status).label}
                    </Badge>
                    <Badge className={`text-[10px] px-2 py-0.5 border ${getPaymentStatusMeta(booking.paymentStatus).className}`}>
                      {getPaymentStatusMeta(booking.paymentStatus).label}
                    </Badge>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Event info */}
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/[0.06]">
                        {booking.image ? (
                          <img src={booking.image} alt={booking.eventTitle} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#1b1b2d] via-[#141422] to-[#0e0e18] flex items-center justify-center px-2 text-center text-[10px] font-semibold text-white/60">
                            {booking.eventTitle}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {booking.category && (
                          <Badge className="bg-white/[0.06] text-white/50 border-0 text-[10px] mb-1.5">{booking.category}</Badge>
                        )}
                        <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1.5">{booking.eventTitle}</h3>
                        <div className="space-y-1 text-xs text-white/40">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>{formatDate(booking.eventDate)}</span>
                            <span className="text-white/15">|</span>
                            <span>{booking.eventTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="line-clamp-1">{booking.location || "Venue TBA"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Amount summary */}
                    <div className="px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.04] flex-shrink-0 min-w-[110px]">
                      <p className="text-[10px] text-white/30 mb-0.5 uppercase tracking-wide">Total</p>
                      <p className="text-sm font-bold text-[#D60024] break-all">{formatIndianRupee(booking.totalPrice || 0)}</p>
                      {booking.payment?.paymentMethod && (
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">{booking.payment.paymentMethod}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-2 lg:w-36 shrink-0">
                      <Button size="sm" className="col-span-full w-full min-h-11 h-auto gap-2 text-xs font-medium px-3 py-2" onClick={() => fetchBookingTickets(booking)}>
                        <Eye className="h-3 w-3" /> View Tickets
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full min-h-11 h-auto gap-2 py-2 border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06] text-xs px-3 disabled:opacity-50"
                        onClick={() => handleDownloadInvoice(booking)}
                        disabled={downloadingInvoiceId === booking.id || !canDownloadInvoice(booking)}
                      >
                        {downloadingInvoiceId === booking.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Receipt className="h-3 w-3" />
                        )}
                        Invoice
                      </Button>
                      {isEventPast(booking) && (
                        <Button size="sm" variant="ghost" className="w-full min-h-11 h-auto gap-2 py-2 text-white/40 hover:text-white hover:bg-white/[0.06] text-xs px-3 border border-dashed border-white/[0.08]" onClick={() => handleOpenReview(booking)}>
                          <Star className="h-3 w-3" />
                          {booking.review ? "Edit Feedback" : "Feedback"}
                        </Button>
                      )}
                      <Link
                        to={`/dashboard/support?sourceSurface=ATTENDEE_BOOKINGS&category=BOOKING_PAYMENT&bookingId=${encodeURIComponent(booking.id)}&eventId=${encodeURIComponent(booking.eventId || "")}&subject=${encodeURIComponent(`Support for ${booking.eventTitle}`)}`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full min-h-11 h-auto gap-2 py-2 border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06] text-xs px-3"
                        >
                          <LifeBuoy className="h-3 w-3" />
                          Support
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tickets Modal */}
      <Dialog open={ticketsModalOpen} onOpenChange={closeTicketsModal}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-3xl max-h-[85vh] overflow-hidden bg-[#0e0e18] text-white border border-white/[0.08] rounded-2xl p-0"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = ticketTrigger.current?.isConnected ? ticketTrigger.current : upcomingTrigger.current;
            target?.focus();
          }}>
          <DialogHeader className="p-5 pb-4 border-b border-white/[0.06]">
            <DialogTitle className="flex items-center gap-3 text-base">
              <div className="h-8 w-8 rounded-lg bg-[#D60024]/10 flex items-center justify-center">
                <Ticket className="h-4 w-4 text-[#D60024]" />
              </div>
              <div>
                <span className="text-white">Your Tickets</span>
                {selectedBookingForTickets && (
                  <p className="text-xs font-normal text-white/40 mt-0.5">{selectedBookingForTickets.eventTitle}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
            {ticketsLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white/20 mb-3" />
                <p className="text-sm text-white/40">Loading tickets...</p>
              </div>
            ) : selectedBookingTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Ticket className="w-10 h-10 text-white/15 mb-3" />
                <p className="text-sm text-white/40">No tickets found.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {selectedBookingTickets.map((ticket, index) => (
                  <div key={ticket.id}>
                    <VintageTicket ticket={ticket} index={index} onClick={() => {}} />
                    <div className="flex justify-end mt-3">
                      <Button size="sm" variant="outline" className="border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06] text-xs" onClick={() => handleDownloadTicket(ticket)}>
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={handleReviewDialogChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-[#0e0e18] text-white border border-white/[0.08] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base text-white">
              {selectedBookingForReview?.review ? "Edit your feedback" : "Share your experience"}
            </DialogTitle>
            <p className="text-xs text-white/40 mt-1">Rate the event and help others discover great experiences.</p>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Rating *</Label>
              <StarRating rating={reviewRating} onRatingChange={setReviewRating} readonly={false} size="lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-comment" className="text-white/60 text-xs">Feedback (optional)</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {feedbackSuggestions.map((tip) => (
                  <button key={tip} type="button" onClick={() => setReviewComment(tip.slice(0, 1000))}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.03] text-white/50 hover:text-white hover:border-white/[0.15] transition-colors"
                  >{tip}</button>
                ))}
              </div>
              <Textarea id="review-comment" placeholder="Share your thoughts..." value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value.slice(0, 1000))} rows={4}
                className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 text-sm" />
              <div className="flex justify-between text-[10px] text-white/30">
                <span>Minimally 1-2 lines</span>
                <span>{reviewComment.length}/1000</span>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" className="border-white/[0.08] text-white/60 hover:bg-white/[0.05] text-xs" onClick={handleCloseReview} disabled={isSubmittingReview}>Cancel</Button>
            <Button className="text-xs" onClick={handleSubmitReview} disabled={isSubmittingReview || reviewRating === 0}>
              {isSubmittingReview ? "Submitting..." : selectedBookingForReview?.review ? "Update" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;
