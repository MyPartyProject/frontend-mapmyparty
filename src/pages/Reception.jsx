import { useEventMetadataRefresh } from '@/hooks/useEventMetadataRefresh';
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

  const requestRef = useRef(0);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchLiveEvents = useCallback(async (isManualRefresh = false) => {
    const request = ++requestRef.current;

    if (!hasFetchedRef.current || isManualRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await apiFetch("event/my-events/live?status=ongoing");
      if (!isMountedRef.current || request !== requestRef.current) return;
      const data = response.data || response;
      const events = data.events || [];
      setLiveEvents(transformEvents(events));
      hasFetchedRef.current = true;
    } catch (err) {
      if (!isMountedRef.current || request !== requestRef.current) return;
      console.error("Error fetching live events:", err);
      setError(err.message || "Failed to load live events");
    } finally {
      if (isMountedRef.current && request === requestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  useEventMetadataRefresh(() => fetchLiveEvents(false), null,
    liveEvents.flatMap(event => [event.startDate, event.endDate]));

  const handleManualRefresh = useCallback(() => {
    fetchLiveEvents(true);
  }, [fetchLiveEvents]);

  const noEventsToday = !liveEvents || liveEvents.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05060c] via-[#0a0f1c] to-[#05060c] text-white light:from-surface light:via-background light:to-surface light:text-foreground">
      <div className="px-4 lg:px-6 py-5 border-b border-white/10 bg-white/5 backdrop-blur light:border-border light:bg-muted">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/50 flex items-center gap-2 light:text-muted-foreground">
              <Shield className="w-4 h-4 text-emerald-300 light:text-success" /> Reception
            </p>
            <h1 className="text-2xl font-extrabold">Live event check-ins</h1>
            <p className="text-sm text-white/60 light:text-muted-foreground">Select a live event to open the reception desk.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60 light:text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live window • Today
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
        {loading && liveEvents.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-lg shadow-black/25 flex flex-col items-center gap-3 light:border-border light:bg-muted light:shadow-black/5">
            <Loader2 className="w-8 h-8 text-emerald-300 animate-spin light:text-success" />
            <p className="text-sm text-white/70 light:text-muted-foreground">Loading live events...</p>
          </div>
        ) : error && liveEvents.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-lg shadow-black/25 space-y-3 light:border-border light:bg-muted light:shadow-black/5">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto light:text-destructive" />
            <p className="text-lg font-semibold">Failed to load live events</p>
            <p className="text-sm text-white/60 light:text-muted-foreground">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="mx-auto px-4 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm inline-flex items-center gap-2 light:bg-muted light:border-border light:hover:bg-muted"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : noEventsToday ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-lg shadow-black/25 light:border-border light:bg-muted light:shadow-black/5">
            <p className="text-lg font-semibold">No live events today</p>
            <p className="text-sm text-white/60 mt-2 light:text-muted-foreground">Once an event is live, it will appear here for check-ins.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg shadow-black/25 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Users className="w-4 h-4 text-emerald-300 light:text-success" /> Live events
                </p>
                <p className="text-3xl font-bold mt-2">{liveEvents.length}</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">Active today</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg shadow-black/25 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Ticket className="w-4 h-4 text-amber-300 light:text-warning" /> Ticket types
                </p>
                <p className="text-3xl font-bold mt-2">
                  {liveEvents.reduce((acc, e) => acc + (e.ticketTypes?.length || 0), 0)}
                </p>
                <p className="text-sm text-white/60 light:text-muted-foreground">Across live events</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg shadow-black/25 light:bg-muted light:border-border light:shadow-black/5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-2 light:text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-cyan-300 light:text-info" /> Ready for check-in
                </p>
                <p className="text-3xl font-bold mt-2">Reception</p>
                <p className="text-sm text-white/60 light:text-muted-foreground">Click an event to start</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 light:border-border light:bg-muted light:shadow-black/5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-300 light:text-success" /> Live today ({liveEvents.length})
                </h3>
                <span className="text-xs text-white/60 light:text-muted-foreground">Click a card to open reception</span>
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
                      className="w-full text-left rounded-2xl p-4 border border-border bg-card text-foreground hover:border-success/40 hover:bg-muted transition shadow-lg shadow-black/20 light:shadow-black/5"
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
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
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
