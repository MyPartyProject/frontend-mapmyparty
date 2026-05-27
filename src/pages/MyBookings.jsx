import { useState, useEffect, useMemo, useCallback } from "react";
import { Ticket, Calendar, MapPin, Loader2, AlertCircle, Receipt, CreditCard, User, Download, Hash, Clock, CheckCircle2, XCircle, Search, Filter, ChevronRight, Star, TrendingUp, Mail, Eye, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import VintageTicket from "@/components/VintageTicket";
import { apiFetch, buildUrl } from "@/config/api";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import StarRating from "@/components/StarRating";
import { buildCanonicalQrPayload } from "@/utils/qrPayload";
import { resolveEventBannerImage } from "@/utils/eventBannerImage";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
    upcomingBookings: 0,
    totalSpent: 0,
  });
  const [bookingAnalyticsLoaded, setBookingAnalyticsLoaded] = useState(false);

  const getBookingDisplayId = useCallback((booking) => {
    return booking?.publicId || booking?.id || "N/A";
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/user/bookings", { method: "GET" });
      if (response?.success && Array.isArray(response?.data?.items)) {
        const normalized = response.data.items.map((item) => {
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
      } else { setBookings([]); }
    } catch (err) {
      console.error("Failed to load bookings", err);
      setError(err?.message || "Failed to load your bookings.");
      setBookings([]);
    } finally { setLoading(false); }
  }, []);

  const fetchBookingsAnalytics = useCallback(async () => {
    try {
      const response = await apiFetch("/api/user/bookings/analytics", { method: "GET" });
      if (response?.success && response?.data) {
        setBookingAnalytics({
          totalBookings: Number(response.data.totalBookings) || 0,
          upcomingBookings: Number(response.data.upcomingBookings) || 0,
          totalSpent: Number(response.data.totalSpent) || 0,
        });
        setBookingAnalyticsLoaded(true);
      }
    } catch (err) {
      console.error("Failed to load booking analytics", err);
      setBookingAnalyticsLoaded(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    if (showSummarySections) {
      fetchBookingsAnalytics();
    }
  }, [fetchBookings, fetchBookingsAnalytics, showSummarySections]);

  const fetchBookingTickets = useCallback(async (booking) => {
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
    if (!ticket) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFillColor(119, 34, 86);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setTextColor(201, 151, 116);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT TICKET', pageWidth / 2, 28, { align: 'center' });
      doc.setTextColor(72, 40, 93);
      doc.setFontSize(18);
      doc.text(ticket.eventTitle || 'Event', 20, 65);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(119, 34, 86);
      doc.text(`Ticket Type: ${ticket.ticketName}`, 20, 80);
      doc.text(`Quantity: ${ticket.quantity || 1}`, 20, 90);
      doc.text(`Date: ${ticket.eventStartDate ? new Date(ticket.eventStartDate).toLocaleDateString() : 'TBA'}`, 20, 100);
      const venue = [ticket.venueName, ticket.venueCity].filter(Boolean).join(', ') || 'TBA';
      doc.text(`Venue: ${venue}`, 20, 110);
      if (ticket.ticketPrice) doc.text(`Price: â‚¹${ticket.ticketPrice.toLocaleString()}`, 20, 120);
      if (ticket.qrCode) {
        const qrData = buildCanonicalQrPayload(ticket.qrCode);
        if (qrData) {
          const qrUrl = await QRCode.toDataURL(qrData, { width: 120 });
          doc.addImage(qrUrl, 'PNG', pageWidth - 60, 60, 45, 45);
        }
      }
      if (ticket.manualCheckInCode) doc.text(`Check-in Code: ${ticket.manualCheckInCode.toUpperCase()}`, 20, 135);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('Present this ticket at the venue entrance', pageWidth / 2, 280, { align: 'center' });
      doc.setDrawColor(201, 151, 116);
      doc.setLineWidth(0.5);
      doc.line(20, 270, pageWidth - 20, 270);
      const fileName = `ticket-${ticket.eventTitle?.replace(/\s+/g, '-') || 'event'}-${ticket.id}.pdf`;
      doc.save(fileName);
      toast.success('Ticket downloaded!');
    } catch (err) {
      console.error('Failed to download ticket:', err);
      toast.error('Failed to download ticket');
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
      const url = buildUrl(`/api/booking/${booking.id}/invoice`);
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        let message = "Failed to download invoice";
        try {
          const errorData = await response.json();
          message = errorData?.errorMessage || errorData?.message || message;
        } catch (_error) {
          // Ignore parse failures and use the fallback message.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition") || "";
      const fileNameMatch = /filename="?([^"]+)"?/i.exec(contentDisposition);
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = fileNameMatch?.[1] || `invoice-${booking.publicId || booking.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Invoice download started");
    } catch (err) {
      console.error("Failed to download invoice", err);
      toast.error(err?.message || "Failed to download invoice");
    } finally {
      setDownloadingInvoiceId(null);
    }
  }, [canDownloadInvoice]);

  const handleResendTicket = (booking) => {
    toast.success(`Ticket for ${booking.eventTitle} has been sent to your email!`);
  };

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

  const stats = useMemo(() => {
    if (!bookingAnalyticsLoaded) {
      const total = bookings.length;
      const totalSpent = bookings.reduce((sum, b) => sum + (b?.totalPrice || 0), 0);
      const upcoming = bookings.filter((b) => b?.eventDate && new Date(b.eventDate) > new Date()).length;
      return { total, totalSpent, upcoming };
    }

    return {
      total: bookingAnalytics.totalBookings,
      totalSpent: bookingAnalytics.totalSpent,
      upcoming: bookingAnalytics.upcomingBookings,
    };
  }, [bookingAnalytics, bookingAnalyticsLoaded, bookings]);

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
  const showEmptyState = !loading && !hasBookings;
  const upcomingBookings = useMemo(() => {
    if (!showSummarySections) {
      return [];
    }

    return filteredBookings.filter((booking) => booking?.eventDate && new Date(booking.eventDate) > new Date());
  }, [filteredBookings, showSummarySections]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-white space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Bookings</h1>
        <p className="text-sm text-white/40 mt-1">View and manage all your event bookings</p>
      </div>

      {/* Stats */}
      {showSummarySections && <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Bookings", value: stats.total, icon: Receipt, color: "#D60024" },
          { label: "Upcoming", value: stats.upcoming, icon: Calendar, color: "#60a5fa" },
          { label: "Total Spent", value: `â‚¹${stats.totalSpent.toLocaleString()}`, icon: CreditCard, color: "#22c55e" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}12` }}>
                  <Icon className="h-4 w-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>}

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

      {/* Upcoming Events Section */}
      {showSummarySections && upcomingBookings.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Upcoming Events</h2>
            <span className="text-xs text-white/30">{upcomingBookings.length} events</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBookings.slice(0, 3).map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 cursor-pointer"
                onClick={() => fetchBookingTickets(booking)}
              >
                <div className="relative h-36 overflow-hidden">
                  {booking.image ? (
                    <img src={booking.image} alt={booking.eventTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1b1b2d] via-[#141422] to-[#0e0e18] flex items-center justify-center px-4 text-center text-sm font-semibold text-white/60">
                      {booking.eventTitle}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {booking.category && (
                    <Badge className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] border-0">{booking.category}</Badge>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-semibold text-sm line-clamp-1">{booking.eventTitle}</h3>
                  </div>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="space-y-1.5 text-xs text-white/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{formatDate(booking.eventDate)}</span>
                      <span className="text-white/20">|</span>
                      <span>{booking.eventTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">{booking.location || "Venue TBA"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
                    <span className="text-xs font-mono text-white/40">{getBookingDisplayId(booking)}</span>
                    <span className="text-sm font-bold text-[#D60024]">â‚¹{booking.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Bookings */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white">All Bookings</h2>

        {loading ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-white/20 mb-3" />
            <p className="text-sm text-white/40">Loading bookings...</p>
          </div>
        ) : showEmptyState ? (
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
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span className="font-mono text-white/70">{getBookingDisplayId(booking)}</span>
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
                          <div className="flex items-center gap-2">
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
                      <p className="text-sm font-bold text-[#D60024]">Rs {booking.totalPrice.toLocaleString()}</p>
                      {booking.payment?.paymentMethod && (
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">{booking.payment.paymentMethod}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2 flex-shrink-0">
                      <Button size="sm" className="flex-1 lg:flex-none h-8 text-xs font-medium px-3" onClick={() => fetchBookingTickets(booking)}>
                        <Eye className="h-3 w-3 mr-1.5" /> View Tickets
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 lg:flex-none h-8 border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06] text-xs px-3 disabled:opacity-50"
                        onClick={() => handleDownloadInvoice(booking)}
                        disabled={downloadingInvoiceId === booking.id || !canDownloadInvoice(booking)}
                      >
                        {downloadingInvoiceId === booking.id ? (
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        ) : (
                          <Receipt className="h-3 w-3 mr-1.5" />
                        )}
                        Invoice
                      </Button>
                      {isEventPast(booking) && (
                        <Button size="sm" variant="ghost" className="flex-1 lg:flex-none h-8 text-white/40 hover:text-white hover:bg-white/[0.06] text-xs px-3 border border-dashed border-white/[0.08]" onClick={() => handleOpenReview(booking)}>
                          <Star className="h-3 w-3 mr-1.5" />
                          {booking.review ? "Edit Feedback" : "Feedback"}
                        </Button>
                      )}
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-[#0e0e18] text-white border border-white/[0.08] rounded-2xl p-0">
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

