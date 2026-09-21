import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  MapPin,
  Radio,
  Ticket,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { apiFetch } from "@/config/api";
import {
  connectTicketAnalytics,
  disconnectTicketAnalytics,
  getTicketAnalyticsSocket,
  fetchSocketToken,
} from "@/services/socketService";

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

// Transform events to include computed ticket data
const transformEvents = (events) =>
  (events || []).map((event) => {
    const ticketTypes = (event.tickets || []).map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      price: t.price,
      totalQty: t.totalQty || 0,
      soldQty: t.soldQty || 0,
      checkedIn: 0,
    }));

    return {
      id: event.id,
      title: event.title,
      category: event.category,
      subCategory: event.subCategory,
      venue: event.venues?.[0]?.name || "Venue TBD",
      city: event.venues?.[0]?.city || "",
      state: event.venues?.[0]?.state || "",
      startDate: event.startDate,
      endDate: event.endDate,
      eventStatus: event.eventStatus,
      publishStatus: event.publishStatus,
      tags: [event.category, event.subCategory].filter(Boolean),
      ticketTypes,
      organizer: event.organizer,
      bookingsCount: event._count?.bookings || 0,
      checkIns: { total: 0, last15m: 0 },
    };
  });

const LiveEvents = () => {
  const navigate = useNavigate();
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Refs to prevent duplicate calls and track mounted state
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);
  const joinedRoomsRef = useRef(new Set());

  const fetchEvents = useCallback(async (isManualRefresh = false) => {
    // Prevent duplicate simultaneous calls
    if (isFetchingRef.current) {
      console.log("[LiveEvents] Fetch already in progress, skipping...");
      return;
    }

    isFetchingRef.current = true;

    // Only show loading spinner on initial load or manual refresh
    if (!hasFetchedRef.current || isManualRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch both ONGOING and UPCOMING events in parallel (organizer's own events only)
      const [liveResponse, upcomingResponse] = await Promise.all([
        apiFetch("event/my-events/live?status=ongoing"),
        apiFetch("event/my-events/live?status=upcoming"),
      ]);

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      const liveData = liveResponse.data || liveResponse;
      const upcomingData = upcomingResponse.data || upcomingResponse;

      setLiveEvents(transformEvents(liveData.events));

      // Filter upcoming events to show only next 7 days
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const filteredUpcoming = (upcomingData.events || []).filter((event) => {
        const startDate = new Date(event.startDate);
        return startDate >= now && startDate <= sevenDaysFromNow;
      });

      setUpcomingEvents(transformEvents(filteredUpcoming));
      hasFetchedRef.current = true;
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Error fetching events:", err);
      setError(err.message || "Failed to load events");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchEvents();

    // Refresh every 30 seconds (background refresh, no loading spinner)
    const interval = setInterval(() => {
      fetchEvents(false);
    }, 30000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchEvents]);

  // Socket connection and real-time updates
  useEffect(() => {
    let isCancelled = false;
    let cleanupFn = null;

    const initSocket = async () => {
      // Fetch socket token from server
      console.log("[LiveEvents] Fetching socket token...");
      const token = await fetchSocketToken();

      if (isCancelled) return;

      if (!token) {
        console.error("[LiveEvents] No token available for socket auth");
        return;
      }

      // Connect to socket with the token
      const socket = connectTicketAnalytics(token);

      const handleConnect = () => {
        if (isCancelled) return;
        console.log("[LiveEvents] Socket connected");
        setSocketConnected(true);

        // Join rooms for all live events
        liveEvents.forEach((event) => {
          if (!joinedRoomsRef.current.has(event.id)) {
            socket.emit("join_event", { eventId: event.id }, (response) => {
              if (response?.success) {
                console.log(`[LiveEvents] Joined room for event ${event.id}`);
                joinedRoomsRef.current.add(event.id);
              }
            });
          }
        });
      };

      const handleDisconnect = () => {
        console.log("[LiveEvents] Socket disconnected");
        setSocketConnected(false);
        joinedRoomsRef.current.clear();
      };

      const handleTicketUpdate = (data) => {
        console.log("[LiveEvents] Received ticket_update:", data);
        if (!data?.eventId || !data?.tickets) return;

        // Update the matching event's ticket data
        setLiveEvents((prev) =>
          prev.map((event) => {
            if (event.id === data.eventId) {
              const updatedTickets = event.ticketTypes.map((t) => {
                const updated = data.tickets.find((u) => u.ticketId === t.id);
                if (updated) {
                  return { ...t, soldQty: updated.soldQty, totalQty: updated.totalQty };
                }
                return t;
              });
              return { ...event, ticketTypes: updatedTickets };
            }
            return event;
          })
        );

        // Also update upcoming events if applicable
        setUpcomingEvents((prev) =>
          prev.map((event) => {
            if (event.id === data.eventId) {
              const updatedTickets = event.ticketTypes.map((t) => {
                const updated = data.tickets.find((u) => u.ticketId === t.id);
                if (updated) {
                  return { ...t, soldQty: updated.soldQty, totalQty: updated.totalQty };
                }
                return t;
              });
              return { ...event, ticketTypes: updatedTickets };
            }
            return event;
          })
        );
      };

      const handleCheckinUpdate = (data) => {
        console.log("[LiveEvents] Received checkin_update:", data);
        if (!data?.eventId || !data?.checkIns) return;

        setLiveEvents((prev) =>
          prev.map((event) => {
            if (event.id === data.eventId) {
              return { ...event, checkIns: data.checkIns };
            }
            return event;
          })
        );
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("ticket_update", handleTicketUpdate);
      socket.on("ticket_stats", handleTicketUpdate);
      socket.on("checkin_update", handleCheckinUpdate);
      socket.on("checkin_stats", handleCheckinUpdate);

      // If already connected, trigger connect handler
      if (socket.connected) {
        handleConnect();
      }

      // Store cleanup function
      cleanupFn = () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("ticket_update", handleTicketUpdate);
        socket.off("ticket_stats", handleTicketUpdate);
        socket.off("checkin_update", handleCheckinUpdate);
        socket.off("checkin_stats", handleCheckinUpdate);

        joinedRoomsRef.current.forEach((eventId) => {
          socket.emit("leave_event", { eventId });
        });
        joinedRoomsRef.current.clear();
      };
    };

    initSocket();

    return () => {
      isCancelled = true;
      if (cleanupFn) cleanupFn();
    };
  }, [liveEvents.length]);

  // Join rooms for newly loaded live events
  useEffect(() => {
    const socket = getTicketAnalyticsSocket();
    if (!socket?.connected) return;

    liveEvents.forEach((event) => {
      if (!joinedRoomsRef.current.has(event.id)) {
        socket.emit("join_event", { eventId: event.id }, (response) => {
          if (response?.success) {
            console.log(`[LiveEvents] Joined room for event ${event.id}`);
            joinedRoomsRef.current.add(event.id);
          }
        });
      }
    });
  }, [liveEvents]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      disconnectTicketAnalytics();
    };
  }, []);

  const handleManualRefresh = useCallback(() => {
    fetchEvents(true);
  }, [fetchEvents]);

  const aggregateLive = useMemo(() => {
    const totals = liveEvents.reduce(
      (acc, event) => {
        const ticketTotals = event.ticketTypes.reduce(
          (tAcc, t) => {
            tAcc.total += t.totalQty;
            tAcc.sold += t.soldQty;
            tAcc.checkedIn += t.checkedIn;
            return tAcc;
          },
          { total: 0, sold: 0, checkedIn: 0 }
        );
        return {
          liveCount: acc.liveCount + 1,
          totalCapacity: acc.totalCapacity + ticketTotals.total,
          sold: acc.sold + ticketTotals.sold,
          checkedIn: acc.checkedIn + ticketTotals.checkedIn,
        };
      },
      { liveCount: 0, totalCapacity: 0, sold: 0, checkedIn: 0 }
    );
    const occupancy =
      totals.totalCapacity > 0
        ? Math.round((totals.sold / totals.totalCapacity) * 100)
        : 0;
    const checkInRate =
      totals.sold > 0 ? Math.round((totals.checkedIn / totals.sold) * 100) : 0;
    return { ...totals, occupancy, checkInRate };
  }, [liveEvents]);

  const getEventTicketTotals = useCallback((event) => {
    if (!event) return { total: 0, sold: 0, checkedIn: 0, remaining: 0 };
    const totals = event.ticketTypes.reduce(
      (acc, t) => {
        acc.total += t.totalQty;
        acc.sold += t.soldQty;
        acc.checkedIn += t.checkedIn;
        return acc;
      },
      { total: 0, sold: 0, checkedIn: 0 }
    );
    return { ...totals, remaining: Math.max(totals.total - totals.sold, 0) };
  }, []);

  if (loading && liveEvents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface via-background to-surface text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
          <p className="text-muted-foreground">Loading live events...</p>
        </div>
      </div>
    );
  }

  if (error && liveEvents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface via-background to-surface text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-foreground text-lg">Failed to load events</p>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 rounded-xl bg-muted border border-border hover:bg-muted transition text-foreground flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface via-background to-surface text-foreground">
      <div className="px-6 py-5 border-b border-border bg-muted backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground flex items-center gap-2">
              <Radio className="w-4 h-4 text-destructive" /> Live Control
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold">Live Events</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500/30 to-blue-500/30 border border-border text-muted-foreground">
                Organizer View
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor events happening today, guide check-ins, and prep for the coming week.
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-muted border border-border hover:bg-muted transition text-sm flex items-center gap-2 text-muted-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Live Pulse */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-red-600/25 via-purple-500/10 to-blue-600/20 border border-border rounded-2xl p-5 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-warning" /> Live Now
              </p>
              <span className="px-3 py-1 rounded-full text-[11px] bg-muted border border-border">
                {aggregateLive.occupancy}% fill
              </span>
            </div>
            <div className="mt-3 flex items-end gap-4">
              <p className="text-4xl font-extrabold">{aggregateLive.liveCount}</p>
              <p className="text-sm text-muted-foreground mb-1">events are in progress today</p>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tickets Sold</span>
                  <span>{aggregateLive.sold} / {aggregateLive.totalCapacity}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden border border-border">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-blue-500"
                    style={{ width: `${aggregateLive.occupancy}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Checked-in</span>
                  <span>{aggregateLive.checkInRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden border border-border">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500"
                    style={{ width: `${aggregateLive.checkInRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted border border-border rounded-2xl p-5 shadow-lg shadow-black/5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-info" /> On-site Attendees
            </p>
            <p className="text-3xl font-bold mt-2 text-cyan-100">{aggregateLive.checkedIn}</p>
            <p className="text-sm text-muted-foreground mt-1">{aggregateLive.sold} booked today</p>
          </div>

          <div className="bg-muted border border-border rounded-2xl p-5 shadow-lg shadow-black/5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Ticket className="w-4 h-4 text-warning" /> Open Capacity
            </p>
            <p className="text-3xl font-bold mt-2 text-amber-100">
              {Math.max(aggregateLive.totalCapacity - aggregateLive.sold, 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">seats left to sell</p>
          </div>
        </div>

        {/* Live Events List */}
        <div className="bg-muted border border-border rounded-2xl backdrop-blur shadow-lg shadow-black/5">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-destructive" /> Live today
              </h2>
              <p className="text-sm text-muted-foreground">Select a card to open the live board.</p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
              {socketConnected ? (
                <span className="flex items-center gap-1 text-success">
                  <Wifi className="w-4 h-4" /> Real-time updates active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-warning">
                  <WifiOff className="w-4 h-4" /> Connecting...
                </span>
              )}
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-success" /> Auto-syncing every 30s
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            {liveEvents.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No live events today. Upcoming events are listed below.
              </div>
            )}
            {liveEvents.map((event) => {
              const totals = getEventTicketTotals(event);
              const occupancy =
                totals.total > 0 ? Math.round((totals.sold / totals.total) * 100) : 0;
              const checkInRate =
                totals.sold > 0 ? Math.round((totals.checkedIn / totals.sold) * 100) : 0;
              return (
                <button
                  key={event.id}
                  onClick={() => navigate(`/organizer/live/${event.id}`)}
                  className="text-left rounded-2xl border border-border bg-muted hover:border-border transition-all duration-200 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-500/20 text-red-100 border border-red-400/30">
                        Live
                      </span>
                      <p className="text-xs text-muted-foreground">{event.category}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-4 h-4" /> {formatDateTime(event.startDate)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {event.venue} • {event.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs rounded-full bg-muted border border-border text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Occupancy</span>
                      <span>
                        {totals.sold} / {totals.total}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden border border-border">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-blue-500"
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Checked-in</span>
                      <span>{checkInRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden border border-border">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500"
                        style={{ width: `${checkInRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-info" /> {event.checkIns.total} checked-in
                    </div>
                    <div className="text-sm text-destructive flex items-center gap-1">
                      View live board <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-muted border border-border rounded-2xl backdrop-blur shadow-lg shadow-black/5">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-info" /> Upcoming (next 7 days)
            </h2>
            <span className="text-xs text-muted-foreground">From events API (UPCOMING)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {upcomingEvents.length === 0 && (
              <div className="col-span-full text-center py-6 text-muted-foreground">
                No upcoming events in the next week.
              </div>
            )}
            {upcomingEvents.map((event) => {
              const totals = getEventTicketTotals(event);
              const occupancy =
                totals.total > 0 ? Math.round((totals.sold / totals.total) * 100) : 0;
              return (
                <div
                  key={event.id}
                  className="rounded-2xl border border-border bg-muted p-4 flex flex-col gap-3 shadow-md shadow-black/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-blue-500/15 text-blue-100 border border-blue-400/30">
                        Upcoming
                      </span>
                      <p className="text-xs text-muted-foreground">{event.category}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {formatDate(event.startDate)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {event.venue} • {event.city}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Capacity {totals.total} • Booked {totals.sold}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-muted border border-border">
                      {occupancy}% sold
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden border border-border">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-blue-500"
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {event.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-muted border border-border">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveEvents;
