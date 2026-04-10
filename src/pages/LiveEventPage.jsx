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
  const [checkIns, setCheckIns] = useState({ total: 0, last15m: 0 });
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

  // Refs to prevent duplicate API calls
  const isFetchingRef = useRef(false);
  const lastFetchedIdRef = useRef(null);
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

  // Fetch event data from API - CALLED ONLY ONCE per event ID
  const fetchEventData = useCallback(async () => {
    // Skip if no id, already fetching, or already fetched this specific id
    if (!id || isFetchingRef.current || lastFetchedIdRef.current === id) {
      return;
    }

    isFetchingRef.current = true;
    lastFetchedIdRef.current = id;
    setLoading(true);
    setError(null);

    try {
      // Fetch event details, bookings, and check-ins in parallel
      const [eventResponse, bookingsResponse, checkInsResponse] = await Promise.allSettled([
        apiFetch(`event/${id}`),
        apiFetch(`booking/event/${id}`),
        apiFetch(`booking/event/${id}/check-ins`),
      ]);

      if (!isMountedRef.current) return;

      // Handle event data
      if (eventResponse.status === "fulfilled") {
        const eventData = eventResponse.value.data || eventResponse.value;
        setEvent(eventData);
      } else {
        throw new Error(eventResponse.reason?.message || "Failed to load event");
      }

      // Handle bookings data
      if (bookingsResponse.status === "fulfilled") {
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
      if (checkInsResponse.status === "fulfilled") {
        const checkInsData = checkInsResponse.value.data?.items || checkInsResponse.value.items || [];
        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

        const checkedInItems = checkInsData.filter((item) => item.checkedIn);
        const recentCheckIns = checkedInItems.filter(
          (item) => item.checkedInAt && new Date(item.checkedInAt) >= fifteenMinutesAgo
        );

        setCheckIns({
          total: checkedInItems.length,
          last15m: recentCheckIns.length,
        });
      }
    } catch (err) {
      // Reset lastFetchedIdRef on error so retry can work
      lastFetchedIdRef.current = null;
      if (!isMountedRef.current) return;
      console.error("Error fetching event:", err);
      setError(err.message || "Failed to load event data");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [id]);

  // Fetch data on mount - ONCE only per event ID
  useEffect(() => {
    isMountedRef.current = true;

    fetchEventData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchEventData]);

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
        acc.total += t.totalQty || 0;
        acc.sold += t.soldQty || 0;
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
      return {
        total: realtimeCheckIns.total,
        last15m: realtimeCheckIns.last15m,
      };
    }
    // Fallback to static API data
    return checkIns;
  }, [realtimeCheckIns, checkIns]);

  const checkInRate =
    ticketTotals.sold > 0 ? Math.round((checkInData.total / ticketTotals.sold) * 100) : 0;
  const occupancy =
    ticketTotals.total > 0 ? Math.round((ticketTotals.sold / ticketTotals.total) * 100) : 0;
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
      <div className={`${embedded ? "flex-1" : "min-h-screen"} flex items-center justify-center ${embedded ? "" : "bg-gradient-to-br from-[#0b1220] via-[#0b0f1a] to-[#0a0b10]"}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
          <p className="text-white/70">Loading event data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${embedded ? "flex-1" : "min-h-screen"} flex items-center justify-center ${embedded ? "" : "bg-gradient-to-br from-[#0b1220] via-[#0b0f1a] to-[#0a0b10]"}`}>
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-white text-lg">Failed to load event</p>
          <p className="text-white/60">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition text-white"
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
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-300" /> Off-Platform Tickets
          </h3>
          <p className="text-sm text-white/55 mt-1">
            Track manual and offline ticket entries for this live event.
          </p>
        </div>
        <button
          onClick={openOffPlatformModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-100 hover:bg-amber-500/25 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Off Platform Ticket
        </button>
      </div>

      {offPlatformError ? (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {offPlatformError}
        </div>
      ) : null}

      {offPlatformRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Records</p>
            <p className="text-2xl font-bold mt-1 text-white">{offPlatformTotals.count}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Members</p>
            <p className="text-2xl font-bold mt-1 text-cyan-100">{number(offPlatformTotals.members)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Revenue</p>
            <p className="text-2xl font-bold mt-1 text-amber-100">{currency(offPlatformTotals.revenue)}</p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f1628]/80">
        {offPlatformLoading ? (
          <div className="px-4 py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        ) : offPlatformRecords.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-white/70 text-sm">No off-platform tickets recorded yet.</p>
            <p className="text-white/45 text-xs mt-1">Use the button above to add the first record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/60 text-xs uppercase">
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-left">Recipient</th>
                  <th className="py-3 px-4 text-left">Ticket</th>
                  <th className="py-3 px-4 text-left">Members</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4 text-left">Check-in</th>
                  <th className="py-3 px-4 text-left">Notes</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {offPlatformRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4 font-semibold text-white">{record.recipientName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-xs text-amber-100">
                        {record.ticketLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/75">{number(record.members)}</td>
                    <td className="py-3 px-4 text-emerald-300">{currency(record.price)}</td>
                    <td className="py-3 px-4">
                      {record.checkinTime ? (
                        <span className="text-cyan-200 text-xs">
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
                          className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100 hover:bg-cyan-500/20 transition"
                        >
                          Mark Checked In
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white/55 max-w-[220px] truncate">{record.notes || "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditOffPlatformModal(record)}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOffPlatformRecord(record)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/70 hover:text-red-300 transition"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-[22rem] sm:max-w-[24rem] max-h-[min(88vh,42rem)] overflow-hidden rounded-xl border border-white/10 bg-[#0f1628] shadow-2xl shadow-black/50 flex flex-col">
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/10 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white">
              {editingOffPlatformRecord ? "Edit Off-Platform Ticket" : "Add Off-Platform Ticket"}
            </h3>
            <p className="text-[11px] text-white/50 mt-1">Fill the required details to save this record.</p>
          </div>
          <button
            onClick={closeOffPlatformModal}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            <div className="min-w-0">
            <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5">Recipient Name *</label>
            <input
              type="text"
              value={offPlatformForm.recipientName}
              onChange={(e) => setOffPlatformForm((current) => ({ ...current, recipientName: e.target.value }))}
              placeholder="e.g. John Doe"
              className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            </div>

            <div className="min-w-0">
            <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5">Ticket Label *</label>
            <input
              type="text"
              value={offPlatformForm.ticketLabel}
              onChange={(e) => setOffPlatformForm((current) => ({ ...current, ticketLabel: e.target.value }))}
              placeholder="e.g. VIP / Backstage"
              className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
              <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5">Members *</label>
              <input
                type="number"
                min={1}
                value={offPlatformForm.members}
                onChange={(e) => setOffPlatformForm((current) => ({ ...current, members: e.target.value }))}
                className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
              </div>
              <div className="min-w-0">
              <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5">Price *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={offPlatformForm.price}
                onChange={(e) => setOffPlatformForm((current) => ({ ...current, price: e.target.value }))}
                className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
              </div>
            </div>

            <div className="min-w-0">
            <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5">Check-in Time</label>
            <input
              type="datetime-local"
              value={offPlatformForm.checkinTime}
              onChange={(e) => setOffPlatformForm((current) => ({ ...current, checkinTime: e.target.value }))}
              className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            </div>

            <div className="min-w-0">
            <label className="block text-[11px] uppercase tracking-wide text-white/60 mb-1.5">Notes</label>
            <textarea
              rows={2}
              value={offPlatformForm.notes}
              onChange={(e) => setOffPlatformForm((current) => ({ ...current, notes: e.target.value }))}
              placeholder="Any optional notes"
              className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
            />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10 shrink-0">
          <button
            onClick={closeOffPlatformModal}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveOffPlatformRecord}
            disabled={!offPlatformFormValid || offPlatformSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-100 hover:bg-amber-500/25 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="flex-1 flex flex-col overflow-hidden text-white">
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6 space-y-6">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-red-600/25 via-purple-500/15 to-blue-600/25 shadow-lg shadow-black/40">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.15),transparent_30%)]" />
              <div className="relative p-5 lg:p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Real-time connection indicator */}
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                        socketConnected
                          ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-100"
                          : "bg-amber-500/20 border-amber-400/30 text-amber-100"
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
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-100 hover:bg-amber-500/25 transition text-sm"
                    >
                      <Plus className="w-4 h-4" /> Off Platform Ticket
                    </button>
                    <button
                      onClick={() => navigate("/organizer/reception")}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/25 transition text-sm"
                    >
                      <Shield className="w-4 h-4" /> Reception
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs text-white/70 uppercase tracking-[0.22em]">
                  <Sparkles className="w-4 h-4 text-red-300" />
                  Live Event Detail
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px]">
                    {event.eventStatus}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px]">
                    {event.publishStatus}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px]">
                    {event.category} {event.subCategory ? `• ${event.subCategory}` : ""}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <h1 className="text-3xl lg:text-4xl font-extrabold">{event.title}</h1>
                    <p className="text-sm text-white/75 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(event.startDate)} — {formatDateTime(event.endDate)}
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      <MapPin className="w-4 h-4" />
                      {venue.name || "Venue"}, {venue.city || ""}, {venue.state || ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-amber-300" /> Tickets
                </p>
                <p className="text-3xl font-bold mt-2">{ticketTotals.total}</p>
                <p className="text-sm text-white/60">
                  {ticketTotals.types} types • {occupancy}% booked
                </p>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-blue-500"
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-300" /> Booked Users
                </p>
                <p className="text-3xl font-bold mt-2 text-cyan-100">{ticketTotals.sold}</p>
                <p className="text-sm text-white/60">{bookingTotals.totalBookings} bookings</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-300" /> Checked-in
                </p>
                <p className="text-3xl font-bold mt-2 text-emerald-100">{checkInData.total}</p>
                <p className="text-sm text-white/60">{checkInRate}% of booked</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-300" /> Bookings Status
                </p>
                <p className="text-lg font-semibold mt-2 text-white">{bookingTotals.confirmed} confirmed</p>
                <p className="text-sm text-white/60">
                  {bookingTotals.pending} pending • {bookingTotals.cancelled} cancelled
                </p>
              </div>
            </div>

            {/* Quick health strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-200" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50">Check-in rate</p>
                  <p className="text-lg font-semibold text-white">{checkInRate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-blue-200" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50">Avg ticket</p>
                  <p className="text-lg font-semibold text-white">₹{number(avgTicketPrice)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-amber-100" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50">Open capacity</p>
                  <p className="text-lg font-semibold text-white">{openCapacity} seats</p>
                </div>
              </div>
            </div>

            {/* Ticket breakdown + check-in funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-amber-300" /> Ticket types
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-2">
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
                    <thead className="text-white/60 text-xs uppercase">
                      <tr className="border-b border-white/10">
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
                        const bookedPct = t.totalQty ? Math.round((t.soldQty / t.totalQty) * 100) : 0;
                        return (
                          <tr key={t.id} className="hover:bg-white/5 transition">
                            <td className="py-3 pr-4 font-semibold text-white">{t.name}</td>
                            <td className="py-3 pr-4 text-white/70">{t.type}</td>
                            <td className="py-3 pr-4 text-white/70">₹{number(t.price)}</td>
                            <td className="py-3 pr-4 text-white/70">{t.totalQty}</td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="text-white/80">{t.soldQty}</span>
                                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden w-24">
                                  <div
                                    className="h-full bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-500"
                                    style={{ width: `${bookedPct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-white/60">{bookedPct}%</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`${t.availableQty === 0 ? "text-red-400" : "text-emerald-400"}`}>
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

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg shadow-black/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-300" /> Check-in funnel
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-2">
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
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Booked</span>
                      <span>{ticketTotals.sold}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-500"
                        style={{
                          width: ticketTotals.total
                            ? `${Math.round((ticketTotals.sold / ticketTotals.total) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Checked-in</span>
                      <span>{checkInData.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-500"
                        style={{
                          width: ticketTotals.sold
                            ? `${Math.round((checkInData.total / ticketTotals.sold) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-white/60">
                    Last 15 min check-ins: <span className="text-white">{checkInData.last15m}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue & schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-300" /> Venue
                </h3>
                <p className="text-sm text-white/80">{venue.name || "Venue"}</p>
                <p className="text-sm text-white/60">{venueInfo.address}</p>
                <div className="text-xs text-white/60 space-y-1">
                  {venueInfo.contact && <p>Contact: {venueInfo.contact}</p>}
                  {venueInfo.email && <p>Email: {venueInfo.email}</p>}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-300" /> Schedule
                </h3>
                <p className="text-sm text-white/80">Start: {formatDateTime(event.startDate)}</p>
                <p className="text-sm text-white/80">End: {formatDateTime(event.endDate)}</p>
                <div className="text-xs text-white/60">Day label: {formatDate(event.startDate)}</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CupSoda className="w-5 h-5 text-orange-300" /> Food & Beverages
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-1">
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
                        <span className="text-white/80 truncate flex-1">{item.name}</span>
                        <div className="flex items-center gap-3 ml-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-white/60">
                              <span className="text-emerald-300 font-medium">{item.receivedQty}</span>
                              <span className="text-white/40"> / </span>
                              <span className="text-white/70">{item.totalQty}</span>
                            </span>
                            <span className={`font-medium ${
                              item.remainingQty <= 0 ? "text-red-300" :
                              item.consumptionRate >= 80 ? "text-amber-300" : "text-white/50"
                            }`}>
                              ({item.remainingQty} left)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {realtimeAddOns.length > 4 && (
                      <p className="text-xs text-white/50">+{realtimeAddOns.length - 4} more items</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/50">No items tracked yet</p>
                )}
              </div>
            </div>

            {/* Bookings summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-300" /> Bookings health
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Confirmed</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-100">{bookingTotals.confirmed}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Pending</p>
                  <p className="text-2xl font-bold mt-1 text-amber-100">{bookingTotals.pending}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Cancelled</p>
                  <p className="text-2xl font-bold mt-1 text-red-200">{bookingTotals.cancelled}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Total bookings</p>
                  <p className="text-2xl font-bold mt-1 text-white">{bookingTotals.totalBookings}</p>
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
      <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-gradient-to-br from-[#0b1220] via-[#0b0f1a] to-[#0a0b10] text-white">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-24"} flex-shrink-0 h-full lg:h-screen lg:sticky lg:top-0 bg-[#0f1628] border-r border-white/10 flex flex-col transition-all duration-300`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h1 className={`text-2xl font-extrabold tracking-tight ${sidebarOpen ? "block" : "hidden"}`}>
            <span className="text-red-500">Map</span>
            <span className="text-white">MyParty</span>
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/80"
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
                    ? "text-white bg-white/10 border border-white/10 shadow-lg shadow-black/20"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                <span className="mr-3 text-white/80">{item.icon}</span>
                {sidebarOpen && item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-white/10">
          <div className="relative bg-gradient-to-br from-white/5 via-white/0 to-blue-500/5 border border-white/10 rounded-xl p-3 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 w-full text-left hover:bg-white/5 transition rounded-lg px-2 py-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/30 via-blue-500/30 to-red-500/30 flex items-center justify-center text-red-100 font-semibold border border-white/10">
                O
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">Organizer</p>
                  <p className="text-xs text-white/60">Live control</p>
                </div>
              )}
              {sidebarOpen && <ChevronDown className="w-4 h-4 text-white/70" />}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden lg:h-screen">
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-6">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-red-600/25 via-purple-500/15 to-blue-600/25 shadow-lg shadow-black/40">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.15),transparent_30%)]" />
              <div className="relative p-5 lg:p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                        socketConnected
                          ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-100"
                          : "bg-amber-500/20 border-amber-400/30 text-amber-100"
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
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-100 hover:bg-amber-500/25 transition text-sm"
                    >
                      <Plus className="w-4 h-4" /> Off Platform Ticket
                    </button>
                    <button
                      onClick={() => navigate("/organizer/reception")}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/25 transition text-sm"
                    >
                      <Shield className="w-4 h-4" /> Reception
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs text-white/70 uppercase tracking-[0.22em]">
                  <Sparkles className="w-4 h-4 text-red-300" />
                  Live Event Detail
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px]">
                    {event.eventStatus}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px]">
                    {event.publishStatus}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15 text-[11px]">
                    {event.category} {event.subCategory ? `• ${event.subCategory}` : ""}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <h1 className="text-3xl lg:text-4xl font-extrabold">{event.title}</h1>
                    <p className="text-sm text-white/75 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(event.startDate)} — {formatDateTime(event.endDate)}
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      <MapPin className="w-4 h-4" />
                      {venue.name || "Venue"}, {venue.city || ""}, {venue.state || ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-amber-300" /> Tickets
                </p>
                <p className="text-3xl font-bold mt-2">{ticketTotals.total}</p>
                <p className="text-sm text-white/60">
                  {ticketTotals.types} types • {occupancy}% booked
                </p>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-blue-500"
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-300" /> Booked Users
                </p>
                <p className="text-3xl font-bold mt-2 text-cyan-100">{ticketTotals.sold}</p>
                <p className="text-sm text-white/60">{bookingTotals.totalBookings} bookings</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-300" /> Checked-in
                </p>
                <p className="text-3xl font-bold mt-2 text-emerald-100">{checkInData.total}</p>
                <p className="text-sm text-white/60">{checkInRate}% of booked</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
                <p className="text-xs uppercase tracking-wide text-white/60 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-300" /> Bookings Status
                </p>
                <p className="text-lg font-semibold mt-2 text-white">{bookingTotals.confirmed} confirmed</p>
                <p className="text-sm text-white/60">
                  {bookingTotals.pending} pending • {bookingTotals.cancelled} cancelled
                </p>
              </div>
            </div>

            {/* Quick health strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-200" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50">Check-in rate</p>
                  <p className="text-lg font-semibold text-white">{checkInRate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-blue-200" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50">Avg ticket</p>
                  <p className="text-lg font-semibold text-white">₹{number(avgTicketPrice)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-amber-100" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50">Open capacity</p>
                  <p className="text-lg font-semibold text-white">{openCapacity} seats</p>
                </div>
              </div>
            </div>

            {/* Ticket breakdown + check-in funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-amber-300" /> Ticket types
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-2">
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
                    <thead className="text-white/60 text-xs uppercase">
                      <tr className="border-b border-white/10">
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
                        const bookedPct = t.totalQty ? Math.round((t.soldQty / t.totalQty) * 100) : 0;
                        return (
                          <tr key={t.id} className="hover:bg-white/5 transition">
                            <td className="py-3 pr-4 font-semibold text-white">{t.name}</td>
                            <td className="py-3 pr-4 text-white/70">{t.type}</td>
                            <td className="py-3 pr-4 text-white/70">₹{number(t.price)}</td>
                            <td className="py-3 pr-4 text-white/70">{t.totalQty}</td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="text-white/80">{t.soldQty}</span>
                                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden w-24">
                                  <div
                                    className="h-full bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-500"
                                    style={{ width: `${bookedPct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-white/60">{bookedPct}%</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`${t.availableQty === 0 ? "text-red-400" : "text-emerald-400"}`}>
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

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg shadow-black/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-300" /> Check-in funnel
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-2">
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
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Booked</span>
                      <span>{ticketTotals.sold}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-500"
                        style={{
                          width: ticketTotals.total
                            ? `${Math.round((ticketTotals.sold / ticketTotals.total) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Checked-in</span>
                      <span>{checkInData.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-500"
                        style={{
                          width: ticketTotals.sold
                            ? `${Math.round((checkInData.total / ticketTotals.sold) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-white/60">
                    Last 15 min check-ins: <span className="text-white">{checkInData.last15m}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue & schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-300" /> Venue
                </h3>
                <p className="text-sm text-white/80">{venue.name || "Venue"}</p>
                <p className="text-sm text-white/60">{venueInfo.address}</p>
                <div className="text-xs text-white/60 space-y-1">
                  {venueInfo.contact && <p>Contact: {venueInfo.contact}</p>}
                  {venueInfo.email && <p>Email: {venueInfo.email}</p>}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-300" /> Schedule
                </h3>
                <p className="text-sm text-white/80">Start: {formatDateTime(event.startDate)}</p>
                <p className="text-sm text-white/80">End: {formatDateTime(event.endDate)}</p>
                <div className="text-xs text-white/60">Day label: {formatDate(event.startDate)}</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CupSoda className="w-5 h-5 text-orange-300" /> Food & Beverages
                  </h3>
                  <span className="text-xs text-white/60 flex items-center gap-1">
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
                        <span className="text-white/80 truncate flex-1">{item.name}</span>
                        <div className="flex items-center gap-3 ml-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-white/60">
                              <span className="text-emerald-300 font-medium">{item.receivedQty}</span>
                              <span className="text-white/40"> / </span>
                              <span className="text-white/70">{item.totalQty}</span>
                            </span>
                            <span className={`font-medium ${
                              item.remainingQty <= 0 ? "text-red-300" :
                              item.consumptionRate >= 80 ? "text-amber-300" : "text-white/50"
                            }`}>
                              ({item.remainingQty} left)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {realtimeAddOns.length > 4 && (
                      <p className="text-xs text-white/50">+{realtimeAddOns.length - 4} more items</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/50">No items tracked yet</p>
                )}
              </div>
            </div>

            {/* Bookings summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-300" /> Bookings health
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Confirmed</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-100">{bookingTotals.confirmed}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Pending</p>
                  <p className="text-2xl font-bold mt-1 text-amber-100">{bookingTotals.pending}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Cancelled</p>
                  <p className="text-2xl font-bold mt-1 text-red-200">{bookingTotals.cancelled}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Total bookings</p>
                  <p className="text-2xl font-bold mt-1 text-white">{bookingTotals.totalBookings}</p>
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
