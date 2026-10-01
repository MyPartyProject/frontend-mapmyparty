import AnalyticsProgressBar from "@/components/analytics/AnalyticsProgressBar";
import { nonNegativeNumber, progressPercent } from "@/lib/progress";
import { useEventMetadataRefresh } from '@/hooks/useEventMetadataRefresh';
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronLeft,
  Clock,
  Home,
  Layers,
  MapPin,
  Menu,
  CupSoda,
  QrCode,
  Radio,
  Sparkles,
  Ticket,
  Shield,
  Download,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
// import Footer from "@/components/Footer";
import { apiFetch } from "@/config/api";
import { useTicketAnalytics } from "@/hooks/useTicketAnalytics";
import {
  createOffPlatformTicket,
  deleteOffPlatformTicket,
  fetchOffPlatformTickets,
  updateOffPlatformTicket,
} from "@/services/offPlatformService";

const number = (v) => new Intl.NumberFormat("en-IN").format(v || 0);
const currency = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v || 0);

const formatDateTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

const LiveEventPage = ({ embedded = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState({ confirmed: 0, pending: 0, cancelled: 0 });
  const [checkIns, setCheckIns] = useState({ total: null, last15m: null });
  const [offPlatformRecords, setOffPlatformRecords] = useState([]);
  const [offPlatformLoading, setOffPlatformLoading] = useState(false);
  const [offPlatformError, setOffPlatformError] = useState("");
  const [offPlatformModalOpen, setOffPlatformModalOpen] = useState(false);
  const [offPlatformSaving, setOffPlatformSaving] = useState(false);
  const [editingOffPlatformRecord, setEditingOffPlatformRecord] = useState(null);
  const [offPlatformForm, setOffPlatformForm] = useState({
    recipientName: "",
    ticketLabel: "",
    members: 1,
    price: 0,
    checkinTime: "",
    notes: "",
  });

  // Ignore outdated responses after another refresh or a route change.
  const requestRef = useRef(0);
  const statsLoadedRef = useRef(false);
  const currentIdRef = useRef(id);
  currentIdRef.current = id;
  const isMountedRef = useRef(true);

  // Real-time ticket, check-in, and food/beverage analytics via Socket.IO
  // This hook handles socket connection and receives real-time updates when bookings/check-ins/add-ons change
  const {
    tickets: realtimeTickets,
    checkIns: realtimeCheckIns,
    addOns: realtimeAddOns,
    connected: socketConnected,
    error: socketError,
  } = useTicketAnalytics(id);

  // Fetch metadata in the background; load booking totals on entry only.
  const fetchEventData = useCallback(async (background = false) => {
    if (!id) return;
    const request = ++requestRef.current;
    if (!background) setLoading(true);
    setError(null);

    try {
      // Fetch event details, bookings, and check-ins in parallel
      const [eventResponse, bookingsResponse, checkInsResponse] = await Promise.allSettled([
        apiFetch(`event/manage/${id}`, { cache: "no-store" }),
        ...(!background || !statsLoadedRef.current ? [apiFetch(`booking/event/${id}`),
          apiFetch(`booking/event/${id}/check-ins`)] : []),
      ]);

      if (!isMountedRef.current || currentIdRef.current !== id || request !== requestRef.current) return;

      // Handle event data
      if (eventResponse.status === "fulfilled") {
        const eventData = eventResponse.value.data || eventResponse.value;
        // Preserve public visibility while allowing a stale stored lifecycle status.
        if (eventData.publishStatus !== 'PUBLISHED' || eventData.eventStatus === 'CANCELLED' ||
          !eventData.startDate || !eventData.endDate || new Date(eventData.endDate).getTime() <= Date.now()) {
          setEvent(null);
    setCheckIns({ total: null, last15m: null });
          throw new Error('This event is no longer available in Live Events or Reception.');
        }
        eventData.eventStatus = new Date(eventData.startDate).getTime() > Date.now() ? 'UPCOMING' : 'ONGOING';
        setEvent(eventData);
      } else {
        throw new Error(eventResponse.reason?.message || "Failed to load event");
      }

      // Handle bookings data
      if (bookingsResponse?.status === "fulfilled") {
        const bookingsData = bookingsResponse.value.data || bookingsResponse.value.bookings || [];
        // Ensure bookingsData is an array before calling reduce
        const safeBookingsData = Array.isArray(bookingsData) ? bookingsData : [];
        const stats = safeBookingsData.reduce(
          (acc, booking) => {
            if (booking.status === "CONFIRMED") acc.confirmed++;
            else if (booking.status === "PENDING") acc.pending++;
            else if (booking.status === "CANCELLED") acc.cancelled++;
            return acc;
          },
          { confirmed: 0, pending: 0, cancelled: 0 }
        );
        setBookings(stats);
      }

      // Handle check-ins data
      if (checkInsResponse?.status === "fulfilled") {
        const summary = checkInsResponse.value.data?.summary || checkInsResponse.value.summary;
        if (summary) {
          setCheckIns(summary);
          statsLoadedRef.current = true;
        }
      }
    } catch (err) {
      if (!isMountedRef.current || currentIdRef.current !== id || request !== requestRef.current) return;
      console.error("Error fetching event:", err);
      setError(err.message || "Failed to load event data");
    } finally {
      if (isMountedRef.current && currentIdRef.current === id && request === requestRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  // Track mount state without remounting the scanner on refresh.
  useEffect(() => {
    isMountedRef.current = true;
    statsLoadedRef.current = false;
    setEvent(null);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchEventData]);
  useEventMetadataRefresh(initial => fetchEventData(!initial), id, [event?.startDate, event?.endDate]);

  // Ticket types - Uses REAL-TIME socket data when available, fallback to event.tickets
  const ticketTypes = useMemo(() => {
    // Prefer real-time socket data (updates automatically when someone books)
    if (realtimeTickets && realtimeTickets.length > 0) {
      return realtimeTickets.map((ticket) => ({
        id: ticket.ticketId,
        name: ticket.name,
        type: ticket.type,
        price: ticket.price,
        totalQty: ticket.totalQty,
        soldQty: ticket.soldQty,
        availableQty: ticket.availableQty,
      }));
    }

    // Fallback to event tickets from initial API (static until socket connects)
    if (event?.tickets) {
      return event.tickets.map((ticket) => ({
        id: ticket.id,
        name: ticket.name,
        type: ticket.type,
        price: ticket.price,
        totalQty: ticket.totalQty,
        soldQty: ticket.soldQty || 0,
        availableQty: Math.max(0, ticket.totalQty - (ticket.soldQty || 0)),
      }));
    }

    return [];
  }, [realtimeTickets, event?.tickets]);

  const ticketTotals = useMemo(() => {
    if (!ticketTypes || ticketTypes.length === 0) {
      return { total: 0, sold: 0, types: 0 };
    }
    return ticketTypes.reduce(
      (acc, t) => {
        acc.total += nonNegativeNumber(t.totalQty);
        acc.sold += nonNegativeNumber(t.soldQty);
        acc.types += 1;
        return acc;
      },
      { total: 0, sold: 0, types: 0 }
    );
  }, [ticketTypes]);

  const bookingTotals = useMemo(() => {
    const { confirmed = 0, pending = 0, cancelled = 0 } = bookings;
    return {
      confirmed,
      pending,
      cancelled,
      totalBookings: confirmed + pending + cancelled,
    };
  }, [bookings]);

  // Check-in data - Uses REAL-TIME socket data when available, fallback to API data
  const checkInData = useMemo(() => {
    // Prefer real-time socket data (updates automatically when someone checks in)
    if (realtimeCheckIns && realtimeCheckIns.total !== undefined) {
      return realtimeCheckIns;
    }
    // Fallback to static API data
    return checkIns;
  }, [realtimeCheckIns, checkIns]);

  const checkInRate =
    checkInData.bookedQuantity == null ? null : progressPercent(checkInData.checkedInQuantity, checkInData.bookedQuantity);
  const occupancy =
    ticketTotals.total > 0 ? progressPercent(ticketTotals.sold, ticketTotals.total) : 0;
  const openCapacity = Math.max(ticketTotals.total - ticketTotals.sold, 0);
  const avgTicketPrice =
    ticketTotals.types > 0
      ? Math.round(ticketTypes.reduce((sum, t) => sum + (t.price || 0), 0) / ticketTotals.types)
      : 0;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home className="w-6 h-6 mr-3" />, to: "/organizer/dashboard" },
    { id: "myevents", label: "My Events", icon: <Calendar className="w-6 h-6 mr-3" />, to: "/organizer/myevents" },
    { id: "analytics", label: "Audience Analytics", icon: <Users className="w-6 h-6 mr-3" />, to: "/organizer/analytics" },
    { id: "live", label: "Live Events", icon: <Radio className="w-6 h-6 mr-3" />, to: "/organizer/live" },
    { id: "reception", label: "Reception", icon: <Shield className="w-6 h-6 mr-3" />, to: "/organizer/reception" },
    { id: "food-beverages", label: "Food & Beverages", icon: <CupSoda className="w-6 h-6 mr-3" />, to: "/organizer/food-beverages" },
    // { id: "financial", label: "Financial Reporting", icon: <Download className="w-6 h-6 mr-3" />, to: "/organizer/financial" },
  ];

  useEffect(() => {
    const path = location.pathname || "";
    if (path.startsWith("/organizer/myevents")) setActiveTab("myevents");
    else if (path.startsWith("/organizer/analytics")) setActiveTab("analytics");
    else if (path.startsWith("/organizer/live")) setActiveTab("live");
    else if (path.startsWith("/organizer/reception")) setActiveTab("reception");
    else if (path.startsWith("/organizer/food-beverages")) setActiveTab("food-beverages");
    else if (path.startsWith("/organizer/financial")) setActiveTab("financial");
    else setActiveTab("dashboard");
  }, [location.pathname]);

  const handleNav = (navId, to) => {
    setActiveTab(navId);
    navigate(to);
  };

  const organizerId = event?.organizerId || event?.organizer?.id || null;
  const offPlatformFormValid =
    Boolean(organizerId) &&
    offPlatformForm.recipientName.trim() &&
    offPlatformForm.ticketLabel.trim() &&
    Number(offPlatformForm.members) > 0 &&
    Number(offPlatformForm.price) >= 0;

  const loadOffPlatformRecords = useCallback(async () => {
    if (!organizerId || !id) return;
    setOffPlatformLoading(true);
    setOffPlatformError("");
    try {
      const data = await fetchOffPlatformTickets(organizerId, id);
      setOffPlatformRecords(data?.items || data || []);
    } catch (err) {
      console.error("Failed to load off-platform tickets:", err);
      setOffPlatformError(err.message || "Failed to load off-platform tickets.");
    } finally {
      setOffPlatformLoading(false);
    }
  }, [organizerId, id]);

  useEffect(() => {
    if (!organizerId || !id) return undefined;

    let cancelled = false;

    const run = async () => {
      setOffPlatformLoading(true);
      setOffPlatformError("");
      try {
        const data = await fetchOffPlatformTickets(organizerId, id);
        if (cancelled) return;
        setOffPlatformRecords(data?.items || data || []);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load off-platform tickets:", err);
        setOffPlatformError(err.message || "Failed to load off-platform tickets.");
      } finally {
        if (!cancelled) {
          setOffPlatformLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [organizerId, id]);

  const resetOffPlatformForm = useCallback(() => {
    setEditingOffPlatformRecord(null);
    setOffPlatformForm({
      recipientName: "",
      ticketLabel: "",
      members: 1,
      price: 0,
      checkinTime: "",
      notes: "",
    });
  }, []);

  const openOffPlatformModal = useCallback(() => {
    resetOffPlatformForm();
    setOffPlatformModalOpen(true);
  }, [resetOffPlatformForm]);

  const openEditOffPlatformModal = useCallback((record) => {
    setEditingOffPlatformRecord(record);
    setOffPlatformForm({
      recipientName: record.recipientName || "",
      ticketLabel: record.ticketLabel || "",
      members: record.members ?? 1,
      price: record.price ?? 0,
      checkinTime: record.checkinTime ? new Date(record.checkinTime).toISOString().slice(0, 16) : "",
      notes: record.notes || "",
    });
    setOffPlatformModalOpen(true);
  }, []);

  const closeOffPlatformModal = useCallback(() => {
    setOffPlatformModalOpen(false);
    resetOffPlatformForm();
  }, [resetOffPlatformForm]);

  const handleSaveOffPlatformRecord = useCallback(async () => {
    if (!offPlatformFormValid || !organizerId || !id) return;

    setOffPlatformSaving(true);
    setOffPlatformError("");
    try {
      const payload = {
        recipientName: offPlatformForm.recipientName.trim(),
        ticketLabel: offPlatformForm.ticketLabel.trim(),
        members: Number(offPlatformForm.members),
        price: Number(offPlatformForm.price),
        checkinTime: offPlatformForm.checkinTime || null,
        notes: offPlatformForm.notes?.trim() || null,
      };

      if (editingOffPlatformRecord?.id) {
        await updateOffPlatformTicket(organizerId, id, editingOffPlatformRecord.id, payload);
      } else {
        await createOffPlatformTicket(organizerId, id, payload);
      }

      closeOffPlatformModal();
      await loadOffPlatformRecords();
    } catch (err) {
      console.error("Failed to save off-platform ticket:", err);
      setOffPlatformError(err.message || "Failed to save off-platform ticket.");
    } finally {
      setOffPlatformSaving(false);
    }
  }, [
    closeOffPlatformModal,
    editingOffPlatformRecord,
    id,
    loadOffPlatformRecords,
    offPlatformForm,
    offPlatformFormValid,
    organizerId,
  ]);

  const handleDeleteOffPlatformRecord = useCallback(
    async (record) => {
      if (!organizerId || !id) return;
      if (!window.confirm(`Delete off-platform ticket for "${record.recipientName}"?`)) return;

      setOffPlatformError("");
      try {
        await deleteOffPlatformTicket(organizerId, id, record.id);
        await loadOffPlatformRecords();
      } catch (err) {
        console.error("Failed to delete off-platform ticket:", err);
        setOffPlatformError(err.message || "Failed to delete off-platform ticket.");
      }
    },
    [id, loadOffPlatformRecords, organizerId]
  );

  const handleMarkOffPlatformCheckIn = useCallback(
    async (record) => {
      if (!organizerId || !id) return;

      setOffPlatformError("");
      try {
        await updateOffPlatformTicket(organizerId, id, record.id, {
          checkinTime: new Date().toISOString(),
        });
        await loadOffPlatformRecords();
      } catch (err) {
        console.error("Failed to mark off-platform ticket as checked in:", err);
        setOffPlatformError(err.message || "Failed to update check-in time.");
      }
    },
    [id, loadOffPlatformRecords, organizerId]
  );

  // Loading state
  if (loading) {
    return (
      <div className={`${embedded ? "flex-1" : "min-h-screen"} flex items-center justify-center ${embedded ? "" : "bg-gradient-to-br from-[#0b1220] via-[#0b0f1a] to-[#0a0b10] light:from-background light:via-surface light:to-surface"}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
          <p className="text-white/70 light:text-muted-foreground">Loading event data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${embedded ? "flex-1" : "min-h-screen"} flex items-center justify-center ${embedded ? "" : "bg-gradient-to-br from-[#0b1220] via-[#0b0f1a] to-[#0a0b10] light:from-background light:via-surface light:to-surface"}`}>
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-white text-lg light:text-foreground">Failed to load event</p>
          <p className="text-white/60 light:text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition text-white light:bg-muted light:border-border light:hover:bg-muted light:text-foreground"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  // Extract venue info
  const venue = event.venues?.[0] || {};
  const venueInfo = {
    address: venue.address || `${venue.name || ""}, ${venue.city || ""}`,
    contact: venue.contactPhone || venue.contact || "",
    email: venue.contactEmail || venue.email || "",
  };

  const offPlatformTotals = offPlatformRecords.reduce(
    (acc, record) => {
      acc.count += 1;
      acc.members += Number(record.members || 0);
      acc.revenue += Number(record.price || 0);
      return acc;
    },
    { count: 0, members: 0, revenue: 0 }
  );

  const offPlatformSection = (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-4 light:bg-muted light:border-border light:shadow-black/5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-300 light:text-warning" /> Off-Platform Tickets
          </h3>
          <p className="text-sm text-white/55 mt-1 light:text-muted-foreground">
            Track manual and offline ticket entries for this live event.
          </p>
        </div>
        <button
          onClick={openOffPlatformModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-100 hover:bg-amber-500/25 transition text-sm light:text-warning"
        >
          <Plus className="w-4 h-4" />
          Off Platform Ticket
        </button>
      </div>

      {offPlatformError ? (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 light:text-destructive">
          {offPlatformError}
        </div>
      ) : null}

      {offPlatformRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
            <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Records</p>
            <p className="text-2xl font-bold mt-1 text-white light:text-foreground">{offPlatformTotals.count}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
            <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Members</p>
            <p className="text-2xl font-bold mt-1 text-cyan-100 light:text-accent-foreground">{number(offPlatformTotals.members)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
            <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold mt-1 text-amber-100 light:text-warning">{currency(offPlatformTotals.revenue)}</p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f1628]/80 light:border-border light:bg-card/80">
        {offPlatformLoading ? (
          <div className="px-4 py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white/40 light:text-muted-foreground" />
          </div>
        ) : offPlatformRecords.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-white/70 text-sm light:text-muted-foreground">No off-platform tickets recorded yet.</p>
            <p className="text-white/45 text-xs mt-1 light:text-muted-foreground">Use the button above to add the first record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/60 text-xs uppercase light:text-muted-foreground">
                <tr className="border-b border-white/10 light:border-border">
                  <th className="py-3 px-4 text-left">Recipient</th>
                  <th className="py-3 px-4 text-left">Ticket</th>
                  <th className="py-3 px-4 text-left">Members</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4 text-left">Check-in</th>
                  <th className="py-3 px-4 text-left">Notes</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 light:divide-border">
                {offPlatformRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition light:hover:bg-muted">
                    <td className="py-3 px-4 font-semibold text-white light:text-foreground">{record.recipientName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-xs text-amber-100 light:text-warning">
                        {record.ticketLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/75 light:text-muted-foreground">{number(record.members)}</td>
                    <td className="py-3 px-4 text-emerald-300 light:text-success">{currency(record.price)}</td>
                    <td className="py-3 px-4">
                      {record.checkinTime ? (
                        <span className="text-cyan-200 text-xs light:text-info">
                          {new Date(record.checkinTime).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkOffPlatformCheckIn(record)}
                          className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100 hover:bg-cyan-500/20 transition light:text-accent-foreground"
                        >
                          Mark Checked In
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white/55 max-w-[220px] truncate light:text-muted-foreground">{record.notes || "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditOffPlatformModal(record)}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition light:hover:bg-muted light:text-muted-foreground light:hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOffPlatformRecord(record)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/70 hover:text-red-300 transition light:text-muted-foreground light:hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const offPlatformModal = offPlatformModalOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 light:bg-card">
      <div className="w-full max-w-[22rem] sm:max-w-[24rem] max-h-[min(88vh,42rem)] overflow-hidden rounded-xl border border-white/10 bg-[#0f1628] shadow-2xl shadow-black/50 flex flex-col light:border-border light:bg-card light:shadow-black/5">
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/10 shrink-0 light:border-border">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white light:text-foreground">
              {editingOffPlatformRecord ? "Edit Off-Platform Ticket" : "Add Off-Platform Ticket"}
            </h3>
            <p className="text-[11px] text-white/50 mt-1 light:text-muted-foreground">Fill the required details to save this record.</p>
          </div>
          <button
            onClick={closeOffPlatformModal}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition light:hover:bg-muted light:text-muted-foreground light:hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            <div className="min-w-0">
            <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5 light:text-muted-foreground">Recipient Name *</label>
            <input
              type="text"
              value={offPlatformForm.recipientName}
              onChange={(e) => setOffPlatformForm((current) => ({ ...current, recipientName: e.target.value }))}
              placeholder="e.g. John Doe"
              className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/50 light:border-border light:bg-muted light:text-foreground light:placeholder:text-muted-foreground"
            />
            </div>

            <div className="min-w-0">
            <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5 light:text-muted-foreground">Ticket Label *</label>
            <input
              type="text"
              value={offPlatformForm.ticketLabel}
              onChange={(e) => setOffPlatformForm((current) => ({ ...current, ticketLabel: e.target.value }))}
              placeholder="e.g. VIP / Backstage"
              className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/50 light:border-border light:bg-muted light:text-foreground light:placeholder:text-muted-foreground"
            />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
              <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5 light:text-muted-foreground">Members *</label>
              <input
                type="number"
                min={1}
                value={offPlatformForm.members}
                onChange={(e) => setOffPlatformForm((current) => ({ ...current, members: e.target.value }))}
                className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 light:border-border light:bg-muted light:text-foreground"
              />
              </div>
              <div className="min-w-0">
              <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5 light:text-muted-foreground">Price *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={offPlatformForm.price}
                onChange={(e) => setOffPlatformForm((current) => ({ ...current, price: e.target.value }))}
                className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 light:border-border light:bg-muted light:text-foreground"
              />
              </div>
            </div>

            <div className="min-w-0">
            <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5 light:text-muted-foreground">Check-in Time</label>
            <input
              type="datetime-local"
              value={offPlatformForm.checkinTime}
              onChange={(e) => setOffPlatformForm((current) => ({ ...current, checkinTime: e.target.value }))}
              className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 light:border-border light:bg-muted light:text-foreground"
            />
            </div>

            <div className="min-w-0">
            <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5 light:text-muted-foreground">Notes</label>
            <textarea
              rows={2}
              value={offPlatformForm.notes}
              onChange={(e) => setOffPlatformForm((current) => ({ ...current, notes: e.target.value }))}
              placeholder="Any optional notes"
              className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none light:border-border light:bg-muted light:text-foreground light:placeholder:text-muted-foreground"
            />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10 shrink-0 light:border-border">
          <button
            onClick={closeOffPlatformModal}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition text-xs light:border-border light:bg-muted light:text-muted-foreground light:hover:bg-muted light:hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveOffPlatformRecord}
            disabled={!offPlatformFormValid || offPlatformSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-100 hover:bg-amber-500/25 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed light:text-warning"
          >
            {offPlatformSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {editingOffPlatformRecord ? "Save Changes" : "Add Record"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // When embedded in OrganizerDashboard, only render the main content
  if (embedded) {
    return (
      <>
        <div className="flex-1 flex flex-col overflow-hidden text-white light:text-foreground">
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6 space-y-6">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-red-600/25 via-purple-500/15 to-blue-600/25 shadow-lg shadow-black/40 light:border-border light:shadow-black/5">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.15),transparent_30%)]" />
              <div className="relative p-5 lg:p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm light:bg-muted light:border-border light:hover:bg-muted"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Real-time connection indicator */}
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                        socketConnected
                          ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-100 light:text-success"
                          : "bg-amber-500/20 border-amber-400/30 text-amber-100 light:text-warning"
                      }`}
                    >
                      {socketConnected ? (
                        <>
                          <Wifi className="w-3 h-3" />
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Real-time
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3" />
                          Connecting...
                        </>
                      )}
                    </div>
                    <button
                      onClick={openOffPlatformModal}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-100 hover:bg-amber-500/25 transition text-sm light:text-warning"
                    >
                      <Plus className="w-4 h-4" /> Off Platform Ticket
                    </button>
                    <button
                      onClick={() => navigate("/organizer/reception")}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/25 transition text-sm light:text-success"
                    >
                      <Shield className="w-4 h-4" /> Reception
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs text-white/70 uppercase tracking-[0.22em] light:text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-red-300 light:text-destructive" />
                  Live Event Detail
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] light:bg-muted light:border-border">
                    {event.eventStatus}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] light:bg-muted light:border-border">
                    {event.publishStatus}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] light:bg-muted light:border-border">
                    {event.category} {event.subCategory ? `• ${event.subCategory}` : ""}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <h1 className="text-3xl lg:text-4xl font-extrabold">{event.title}</h1>
                    <p className="text-sm text-white/75 flex items-center gap-2 light:text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(event.startDate)} — {formatDateTime(event.endDate)}
                      <span className="h-1 w-1 rounded-full bg-white/30 light:bg-muted" />
                      <MapPin className="w-4 h-4" />
                      {venue.name || "Venue"}, {venue.city || ""}, {venue.state || ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Ticket className="w-4 h-4 text-amber-300 light:text-warning" /> Tickets
                </p>
                <p className="text-3xl font-bold mt-2">{ticketTotals.total}</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">
                  {ticketTotals.types} types • {occupancy}% booked
                </p>
                <AnalyticsProgressBar label="Tickets sold" value={occupancy} heightClassName="h-2" className="mt-3" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Users className="w-4 h-4 text-cyan-300 light:text-accent-foreground" /> Booked Users
                </p>
                <p className="text-3xl font-bold mt-2 text-cyan-100 light:text-accent-foreground">{ticketTotals.sold}</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">{bookingTotals.totalBookings} bookings</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Activity className="w-4 h-4 text-emerald-300 light:text-success" /> Checked-in
                </p>
                <p className="text-3xl font-bold mt-2 text-emerald-100 light:text-success">{checkInData.total ?? "Unavailable"}</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">{checkInRate == null ? "Unavailable" : `${Number(checkInRate.toFixed(1))}%`} of booked</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Clock className="w-4 h-4 text-blue-300 light:text-accent-foreground" /> Bookings Status
                </p>
                <p className="text-lg font-semibold mt-2 text-white light:text-foreground">{bookingTotals.confirmed} confirmed</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">
                  {bookingTotals.pending} pending • {bookingTotals.cancelled} cancelled
                </p>
              </div>
            </div>

            {/* Quick health strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-200 light:text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50 light:text-muted-foreground">Check-in rate</p>
                  <p className="text-lg font-semibold text-white light:text-foreground">{checkInRate == null ? "Unavailable" : `${Number(checkInRate.toFixed(1))}%`}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-blue-200 light:text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50 light:text-muted-foreground">Avg ticket</p>
                  <p className="text-lg font-semibold text-white light:text-foreground">₹{number(avgTicketPrice)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-amber-100 light:text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50 light:text-muted-foreground">Open capacity</p>
                  <p className="text-lg font-semibold text-white light:text-foreground">{openCapacity} seats</p>
                </div>
              </div>
            </div>

            {/* Ticket breakdown + check-in funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-amber-300 light:text-warning" /> Ticket types
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-2 light:text-muted-foreground">
                    {socketConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Real-time updates
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Static (connecting...)
                      </>
                    )}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-white/60 text-xs uppercase light:text-muted-foreground">
                      <tr className="border-b border-white/10 light:border-border">
                        <th className="py-2 pr-4 text-left">Type</th>
                        <th className="py-2 pr-4 text-left">Category</th>
                        <th className="py-2 pr-4 text-left">Price</th>
                        <th className="py-2 pr-4 text-left">Total</th>
                        <th className="py-2 pr-4 text-left">Booked</th>
                        <th className="py-2 pr-4 text-left">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ticketTypes.map((t) => {
                        const bookedPct = t.totalQty ? progressPercent(t.soldQty, t.totalQty) : 0;
                        return (
                          <tr key={t.id} className="hover:bg-white/5 transition light:hover:bg-muted">
                            <td className="py-3 pr-4 font-semibold text-white light:text-foreground">{t.name}</td>
                            <td className="py-3 pr-4 text-white/70 light:text-muted-foreground">{t.type}</td>
                            <td className="py-3 pr-4 text-white/70 light:text-muted-foreground">₹{number(t.price)}</td>
                            <td className="py-3 pr-4 text-white/70 light:text-muted-foreground">{t.totalQty}</td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="text-white/80 light:text-muted-foreground">{t.soldQty}</span>
                                <AnalyticsProgressBar label="Tickets sold" value={bookedPct} heightClassName="h-1.5" className="flex-1 w-24" />
                                <span className="text-xs text-white/60 light:text-muted-foreground">{bookedPct}%</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`${t.availableQty === 0 ? "text-red-400 light:text-destructive" : "text-emerald-400 light:text-success"}`}>
                                {t.availableQty}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-300 light:text-success" /> Check-in funnel
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-2 light:text-muted-foreground">
                    {socketConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Static
                      </>
                    )}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/60 light:text-muted-foreground">
                      <span>Booked</span>
                      <span>{ticketTotals.sold}</span>
                    </div>
                    <AnalyticsProgressBar label="Tickets sold" value={occupancy} heightClassName="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/60 light:text-muted-foreground">
                      <span>Checked-in</span>
                      <span>{checkInData.total ?? "Unavailable"}</span>
                    </div>
                    <AnalyticsProgressBar label="Checked-in" value={checkInRate} heightClassName="h-2" fillStyle={{ backgroundColor: "hsl(var(--success))" }} />
                  </div>
                  <div className="text-xs text-white/60 light:text-muted-foreground">
                    Last 15 min check-ins: <span className="text-white light:text-foreground">{checkInData.last15m ?? "Unavailable"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue & schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3 light:bg-muted light:border-border light:shadow-black/5">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-300 light:text-accent-foreground" /> Venue
                </h3>
                <p className="text-sm text-white/80 light:text-muted-foreground">{venue.name || "Venue"}</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">{venueInfo.address}</p>
                <div className="text-xs text-white/60 space-y-1 light:text-muted-foreground">
                  {venueInfo.contact && <p>Contact: {venueInfo.contact}</p>}
                  {venueInfo.email && <p>Email: {venueInfo.email}</p>}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3 light:bg-muted light:border-border light:shadow-black/5">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-300 light:text-warning" /> Schedule
                </h3>
                <p className="text-sm text-white/80 light:text-muted-foreground">Start: {formatDateTime(event.startDate)}</p>
                <p className="text-sm text-white/80 light:text-muted-foreground">End: {formatDateTime(event.endDate)}</p>
                <div className="text-xs text-white/60 light:text-muted-foreground">Day label: {formatDate(event.startDate)}</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3 light:bg-muted light:border-border light:shadow-black/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CupSoda className="w-5 h-5 text-orange-300 light:text-warning" /> Food & Beverages
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-1 light:text-muted-foreground">
                    {socketConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Static
                      </>
                    )}
                  </span>
                </div>
                {realtimeAddOns && realtimeAddOns.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {realtimeAddOns.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-white/80 truncate flex-1 light:text-muted-foreground">{item.name}</span>
                        <div className="flex items-center gap-3 ml-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-white/60 light:text-muted-foreground">
                              <span className="text-emerald-300 font-medium light:text-success">{item.receivedQty}</span>
                              <span className="text-white/40 light:text-muted-foreground"> / </span>
                              <span className="text-white/70 light:text-muted-foreground">{item.totalQty}</span>
                            </span>
                            <span className={`font-medium ${
                              item.remainingQty <= 0 ? "text-red-300 light:text-destructive" :
                              item.consumptionRate >= 80 ? "text-amber-300 light:text-warning" : "text-white/50 light:text-muted-foreground"
                            }`}>
                              ({item.remainingQty} left)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {realtimeAddOns.length > 4 && (
                      <p className="text-xs text-white/50 light:text-muted-foreground">+{realtimeAddOns.length - 4} more items</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/50 light:text-muted-foreground">No items tracked yet</p>
                )}
              </div>
            </div>

            {/* Bookings summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-300 light:text-accent-foreground" /> Bookings health
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
                  <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-100 light:text-success">{bookingTotals.confirmed}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
                  <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold mt-1 text-amber-100 light:text-warning">{bookingTotals.pending}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
                  <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold mt-1 text-red-200 light:text-destructive">{bookingTotals.cancelled}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
                  <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Total bookings</p>
                  <p className="text-2xl font-bold mt-1 text-white light:text-foreground">{bookingTotals.totalBookings}</p>
                </div>
              </div>
            </div>
            {offPlatformSection}
          </div>
          </main>
        </div>
        {offPlatformModal}
      </>
    );
  }

  // Non-embedded: Full page with sidebar (standalone view)
  return (
    <>
      <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-gradient-to-br from-[#0b1220] via-[#0b0f1a] to-[#0a0b10] text-white light:from-background light:via-surface light:to-surface light:text-foreground">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-24"} flex-shrink-0 h-full lg:h-screen lg:sticky lg:top-0 bg-[#0f1628] border-r border-white/10 flex flex-col transition-all duration-300 light:bg-card light:border-border`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between light:border-border">
          <h1 className={`text-2xl font-extrabold tracking-tight ${sidebarOpen ? "block" : "hidden"}`}>
            <span className="text-red-500">Map</span>
            <span className="text-white light:text-foreground">MyParty</span>
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/80 light:hover:bg-muted light:text-muted-foreground"
          >
            {sidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          <div className="px-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id, item.to)}
                className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition ${
                  activeTab === item.id
                    ? "text-white bg-white/10 border border-white/10 shadow-lg shadow-black/20 light:text-foreground light:bg-muted light:border-border light:shadow-black/5"
                    : "text-white/70 hover:bg-white/5 light:text-muted-foreground light:hover:bg-muted"
                }`}
              >
                <span className="mr-3 text-white/80 light:text-muted-foreground">{item.icon}</span>
                {sidebarOpen && item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-white/10 light:border-border">
          <div className="relative bg-gradient-to-br from-white/5 via-white/0 to-blue-500/5 border border-white/10 rounded-xl p-3 shadow-lg shadow-black/20 light:border-border light:shadow-black/5">
            <div className="flex items-center gap-3 w-full text-left hover:bg-white/5 transition rounded-lg px-2 py-1 light:hover:bg-muted">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/30 via-blue-500/30 to-red-500/30 flex items-center justify-center text-red-100 font-semibold border border-white/10 light:border-border light:text-destructive">
                O
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate light:text-foreground">Organizer</p>
                  <p className="text-xs text-white/60 light:text-muted-foreground">Live control</p>
                </div>
              )}
              {sidebarOpen && <ChevronDown className="w-4 h-4 text-white/70 light:text-muted-foreground" />}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden lg:h-screen">
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-6">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-red-600/25 via-purple-500/15 to-blue-600/25 shadow-lg shadow-black/40 light:border-border light:shadow-black/5">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.15),transparent_30%)]" />
              <div className="relative p-5 lg:p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm light:bg-muted light:border-border light:hover:bg-muted"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                        socketConnected
                          ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-100 light:text-success"
                          : "bg-amber-500/20 border-amber-400/30 text-amber-100 light:text-warning"
                      }`}
                    >
                      {socketConnected ? (
                        <>
                          <Wifi className="w-3 h-3" />
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Real-time
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3" />
                          Connecting...
                        </>
                      )}
                    </div>
                    <button
                      onClick={openOffPlatformModal}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-100 hover:bg-amber-500/25 transition text-sm light:text-warning"
                    >
                      <Plus className="w-4 h-4" /> Off Platform Ticket
                    </button>
                    <button
                      onClick={() => navigate("/organizer/reception")}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/25 transition text-sm light:text-success"
                    >
                      <Shield className="w-4 h-4" /> Reception
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs text-white/70 uppercase tracking-[0.22em] light:text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-red-300 light:text-destructive" />
                  Live Event Detail
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] light:bg-muted light:border-border">
                    {event.eventStatus}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] light:bg-muted light:border-border">
                    {event.publishStatus}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] light:bg-muted light:border-border">
                    {event.category} {event.subCategory ? `• ${event.subCategory}` : ""}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <h1 className="text-3xl lg:text-4xl font-extrabold">{event.title}</h1>
                    <p className="text-sm text-white/75 flex items-center gap-2 light:text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(event.startDate)} — {formatDateTime(event.endDate)}
                      <span className="h-1 w-1 rounded-full bg-white/30 light:bg-muted" />
                      <MapPin className="w-4 h-4" />
                      {venue.name || "Venue"}, {venue.city || ""}, {venue.state || ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Ticket className="w-4 h-4 text-amber-300 light:text-warning" /> Tickets
                </p>
                <p className="text-3xl font-bold mt-2">{ticketTotals.total}</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">
                  {ticketTotals.types} types • {occupancy}% booked
                </p>
                <AnalyticsProgressBar label="Tickets sold" value={occupancy} heightClassName="h-2" className="mt-3" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Users className="w-4 h-4 text-cyan-300 light:text-accent-foreground" /> Booked Users
                </p>
                <p className="text-3xl font-bold mt-2 text-cyan-100 light:text-accent-foreground">{ticketTotals.sold}</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">{bookingTotals.totalBookings} bookings</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Activity className="w-4 h-4 text-emerald-300 light:text-success" /> Checked-in
                </p>
                <p className="text-3xl font-bold mt-2 text-emerald-100 light:text-success">{checkInData.total ?? "Unavailable"}</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">{checkInRate == null ? "Unavailable" : `${Number(checkInRate.toFixed(1))}%`} of booked</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Clock className="w-4 h-4 text-blue-300 light:text-accent-foreground" /> Bookings Status
                </p>
                <p className="text-lg font-semibold mt-2 text-white light:text-foreground">{bookingTotals.confirmed} confirmed</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">
                  {bookingTotals.pending} pending • {bookingTotals.cancelled} cancelled
                </p>
              </div>
            </div>

            {/* Quick health strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-200 light:text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50 light:text-muted-foreground">Check-in rate</p>
                  <p className="text-lg font-semibold text-white light:text-foreground">{checkInRate == null ? "Unavailable" : `${Number(checkInRate.toFixed(1))}%`}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-blue-200 light:text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50 light:text-muted-foreground">Avg ticket</p>
                  <p className="text-lg font-semibold text-white light:text-foreground">₹{number(avgTicketPrice)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-amber-100 light:text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50 light:text-muted-foreground">Open capacity</p>
                  <p className="text-lg font-semibold text-white light:text-foreground">{openCapacity} seats</p>
                </div>
              </div>
            </div>

            {/* Ticket breakdown + check-in funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-amber-300 light:text-warning" /> Ticket types
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-2 light:text-muted-foreground">
                    {socketConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Real-time updates
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Static (connecting...)
                      </>
                    )}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-white/60 text-xs uppercase light:text-muted-foreground">
                      <tr className="border-b border-white/10 light:border-border">
                        <th className="py-2 pr-4 text-left">Type</th>
                        <th className="py-2 pr-4 text-left">Category</th>
                        <th className="py-2 pr-4 text-left">Price</th>
                        <th className="py-2 pr-4 text-left">Total</th>
                        <th className="py-2 pr-4 text-left">Booked</th>
                        <th className="py-2 pr-4 text-left">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ticketTypes.map((t) => {
                        const bookedPct = t.totalQty ? progressPercent(t.soldQty, t.totalQty) : 0;
                        return (
                          <tr key={t.id} className="hover:bg-white/5 transition light:hover:bg-muted">
                            <td className="py-3 pr-4 font-semibold text-white light:text-foreground">{t.name}</td>
                            <td className="py-3 pr-4 text-white/70 light:text-muted-foreground">{t.type}</td>
                            <td className="py-3 pr-4 text-white/70 light:text-muted-foreground">₹{number(t.price)}</td>
                            <td className="py-3 pr-4 text-white/70 light:text-muted-foreground">{t.totalQty}</td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="text-white/80 light:text-muted-foreground">{t.soldQty}</span>
                                <AnalyticsProgressBar label="Tickets sold" value={bookedPct} heightClassName="h-1.5" className="flex-1 w-24" />
                                <span className="text-xs text-white/60 light:text-muted-foreground">{bookedPct}%</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`${t.availableQty === 0 ? "text-red-400 light:text-destructive" : "text-emerald-400 light:text-success"}`}>
                                {t.availableQty}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-300 light:text-success" /> Check-in funnel
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-2 light:text-muted-foreground">
                    {socketConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Static
                      </>
                    )}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/60 light:text-muted-foreground">
                      <span>Booked</span>
                      <span>{ticketTotals.sold}</span>
                    </div>
                    <AnalyticsProgressBar label="Tickets sold" value={occupancy} heightClassName="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/60 light:text-muted-foreground">
                      <span>Checked-in</span>
                      <span>{checkInData.total ?? "Unavailable"}</span>
                    </div>
                    <AnalyticsProgressBar label="Checked-in" value={checkInRate} heightClassName="h-2" fillStyle={{ backgroundColor: "hsl(var(--success))" }} />
                  </div>
                  <div className="text-xs text-white/60 light:text-muted-foreground">
                    Last 15 min check-ins: <span className="text-white light:text-foreground">{checkInData.last15m ?? "Unavailable"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue & schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3 light:bg-muted light:border-border light:shadow-black/5">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-300 light:text-accent-foreground" /> Venue
                </h3>
                <p className="text-sm text-white/80 light:text-muted-foreground">{venue.name || "Venue"}</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">{venueInfo.address}</p>
                <div className="text-xs text-white/60 space-y-1 light:text-muted-foreground">
                  {venueInfo.contact && <p>Contact: {venueInfo.contact}</p>}
                  {venueInfo.email && <p>Email: {venueInfo.email}</p>}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3 light:bg-muted light:border-border light:shadow-black/5">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-300 light:text-warning" /> Schedule
                </h3>
                <p className="text-sm text-white/80 light:text-muted-foreground">Start: {formatDateTime(event.startDate)}</p>
                <p className="text-sm text-white/80 light:text-muted-foreground">End: {formatDateTime(event.endDate)}</p>
                <div className="text-xs text-white/60 light:text-muted-foreground">Day label: {formatDate(event.startDate)}</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3 light:bg-muted light:border-border light:shadow-black/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CupSoda className="w-5 h-5 text-orange-300 light:text-warning" /> Food & Beverages
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-1 light:text-muted-foreground">
                    {socketConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Static
                      </>
                    )}
                  </span>
                </div>
                {realtimeAddOns && realtimeAddOns.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {realtimeAddOns.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-white/80 truncate flex-1 light:text-muted-foreground">{item.name}</span>
                        <div className="flex items-center gap-3 ml-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-white/60 light:text-muted-foreground">
                              <span className="text-emerald-300 font-medium light:text-success">{item.receivedQty}</span>
                              <span className="text-white/40 light:text-muted-foreground"> / </span>
                              <span className="text-white/70 light:text-muted-foreground">{item.totalQty}</span>
                            </span>
                            <span className={`font-medium ${
                              item.remainingQty <= 0 ? "text-red-300 light:text-destructive" :
                              item.consumptionRate >= 80 ? "text-amber-300 light:text-warning" : "text-white/50 light:text-muted-foreground"
                            }`}>
                              ({item.remainingQty} left)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {realtimeAddOns.length > 4 && (
                      <p className="text-xs text-white/50 light:text-muted-foreground">+{realtimeAddOns.length - 4} more items</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/50 light:text-muted-foreground">No items tracked yet</p>
                )}
              </div>
            </div>

            {/* Bookings summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-300 light:text-accent-foreground" /> Bookings health
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
                  <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-100 light:text-success">{bookingTotals.confirmed}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
                  <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold mt-1 text-amber-100 light:text-warning">{bookingTotals.pending}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
                  <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold mt-1 text-red-200 light:text-destructive">{bookingTotals.cancelled}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 light:bg-muted light:border-border">
                  <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Total bookings</p>
                  <p className="text-2xl font-bold mt-1 text-white light:text-foreground">{bookingTotals.totalBookings}</p>
                </div>
              </div>
            </div>
            {offPlatformSection}
          </div>
        </main>
      </div>
      </div>
      {offPlatformModal}
    </>
  );
};

export default LiveEventPage;
