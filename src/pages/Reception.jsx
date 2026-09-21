import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Sparkles, Clock, MapPin, Radio, Users, Ticket, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { apiFetch } from "@/config/api";

// Date formatter utility
const formatDateTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

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
      ticketTypes,
    };
  });

const ReceptionLanding = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchLiveEvents = useCallback(async (isManualRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!hasFetchedRef.current || isManualRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await apiFetch("event/my-events/live?status=ongoing");
      if (!isMountedRef.current) return;
      const data = response.data || response;
      const events = data.events || [];
      setLiveEvents(transformEvents(events));
      hasFetchedRef.current = true;
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Error fetching live events:", err);
      setError(err.message || "Failed to load live events");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLiveEvents();
    const interval = setInterval(() => {
      fetchLiveEvents(false);
    }, 30000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchLiveEvents]);

  const handleManualRefresh = useCallback(() => {
    fetchLiveEvents(true);
  }, [fetchLiveEvents]);

  const noEventsToday = !liveEvents || liveEvents.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface via-background to-surface text-foreground">
      <div className="px-4 lg:px-6 py-5 border-b border-border bg-muted backdrop-blur">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" /> Reception
            </p>
            <h1 className="text-2xl font-extrabold">Live event check-ins</h1>
            <p className="text-sm text-muted-foreground">Select a live event to open the reception desk.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live window • Today
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
        {loading && liveEvents.length === 0 ? (
          <div className="rounded-2xl border border-border bg-muted p-8 text-center shadow-lg shadow-black/5 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-success animate-spin" />
            <p className="text-sm text-muted-foreground">Loading live events...</p>
          </div>
        ) : error && liveEvents.length === 0 ? (
          <div className="rounded-2xl border border-border bg-muted p-8 text-center shadow-lg shadow-black/5 space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-lg font-semibold">Failed to load live events</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="mx-auto px-4 py-2 rounded-lg bg-muted border border-border hover:bg-muted transition text-sm inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : noEventsToday ? (
          <div className="rounded-2xl border border-border bg-muted p-8 text-center shadow-lg shadow-black/5">
            <p className="text-lg font-semibold">No live events today</p>
            <p className="text-sm text-muted-foreground mt-2">Once an event is live, it will appear here for check-ins.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-muted border border-border p-4 shadow-lg shadow-black/5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-success" /> Live events
                </p>
                <p className="text-3xl font-bold mt-2">{liveEvents.length}</p>
                <p className="text-sm text-muted-foreground">Active today</p>
              </div>
              <div className="rounded-2xl bg-muted border border-border p-4 shadow-lg shadow-black/5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-warning" /> Ticket types
                </p>
                <p className="text-3xl font-bold mt-2">
                  {liveEvents.reduce((acc, e) => acc + (e.ticketTypes?.length || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Across live events</p>
              </div>
              <div className="rounded-2xl bg-muted border border-border p-4 shadow-lg shadow-black/5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-info" /> Ready for check-in
                </p>
                <p className="text-3xl font-bold mt-2">Reception</p>
                <p className="text-sm text-muted-foreground">Click an event to start</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted p-5 shadow-lg shadow-black/5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-success" /> Live today ({liveEvents.length})
                </h3>
                <span className="text-xs text-muted-foreground">Click a card to open reception</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {liveEvents.map((event) => {
                  const ticketTotals = event.ticketTypes?.reduce(
                    (acc, t) => {
                      acc.total += t.totalQty || 0;
                      acc.sold += t.soldQty || 0;
                      acc.checkedIn += t.checkedIn || 0;
                      return acc;
                    },
                    { total: 0, sold: 0, checkedIn: 0 }
                  );
                  const occupancy = ticketTotals.total
                    ? Math.round((ticketTotals.sold / ticketTotals.total) * 100)
                    : 0;
                  return (
                    <button
                      key={event.id}
                      onClick={() => navigate(`/organizer/reception/${event.id}`)}
                      className="w-full text-left rounded-2xl p-4 border border-border bg-gradient-to-r from-white/5 to-white/0 hover:border-emerald-300/40 hover:bg-muted transition shadow-lg shadow-black/5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
                            <Radio className="w-4 h-4 text-success" />
                            Live • {event.category}
                          </p>
                          <h3 className="text-xl font-bold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDateTime(event.startDate)}
                            <span className="h-1 w-1 rounded-full bg-muted" />
                            <MapPin className="w-4 h-4" />
                            {event.venue}, {event.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Occupancy</p>
                          <p className="text-2xl font-bold">{occupancy}%</p>
                          <p className="text-xs text-muted-foreground">
                            {ticketTotals.sold} / {ticketTotals.total} sold
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReceptionLanding;
