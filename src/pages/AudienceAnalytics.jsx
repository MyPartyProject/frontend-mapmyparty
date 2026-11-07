import { Button } from "@/components/ui/button";
import EventSettlementSummary from '@/components/organizer/EventSettlementSummary';
import { nonNegativeNumber, progressPercent } from '@/lib/progress';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Activity,
  Sparkles,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  MapPin,
  PieChart as PieChartIcon,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Coins,
  Ticket,
  Globe2,
  BadgePercent,
} from "lucide-react";
import { apiFetch } from "@/config/api";
import AnalyticsProgressBar from "@/components/analytics/AnalyticsProgressBar";

const summaryCardClass =
  "relative min-w-0 rounded-2xl p-5 bg-card border border-border/50 shadow-sm";

const buildQuery = (path, params = {}) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `${path}?${qs}` : path;
};

const unwrap = (res) => res?.data ?? res?.result ?? res;

const formatNumber = (value, fallback = "—") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Number(value).toLocaleString();
};

const formatPercent = (value, fallback = "—") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
  return `${Number(value).toFixed(1)}%`;
};

const toTitleCase = (text = "") =>
  text
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const sumValues = (items = []) => items.reduce((acc, item) => acc + nonNegativeNumber(item.value), 0);

const normalizeTrend = (arr = []) =>
  Array.isArray(arr)
    ? arr.map((item, idx) => ({
        label: item.label || item.date || item.day || `Point ${idx + 1}`,
        value: 'amount' in item ? item.amount : 'revenue' in item ? item.revenue : item.count ?? item.bookings ?? item.value ?? 0,
      }))
    : [];

const normalizeBreakdown = (raw) => {
  const source = unwrap(raw);
  const breakdown = source?.breakdown || source?.data || source || {};
  if (Array.isArray(breakdown)) return breakdown.map(item => ({ ...item, label: item.label || item.name || item.status, value: item.events ?? item.count ?? item.value ?? item.percentage ?? 0 }));
  return Object.entries(breakdown || {}).map(([label, val]) => ({
    label: toTitleCase(label),
    value: val !== null && typeof val === "object" ? val.value ?? val.percentage ?? val.count ?? val.ticketsSold ?? 0 : val ?? 0,
  }));
};

const normalizeTicketTypes = (raw) => {
  const obj = unwrap(raw) || {};
  const base = obj.breakdown || obj.data || obj || {};
  return Object.entries(base || {}).map(([label, val]) => ({
    label: toTitleCase(label),
    count: val.ticketCount ?? val.count ?? 0,
    ticketsSold: val.ticketsSold ?? 0,
  }));
};

const normalizeGeography = (raw) => {
  const geo = unwrap(raw)?.geography || unwrap(raw)?.breakdown || unwrap(raw)?.data || unwrap(raw) || {};
  const states = geo.states || {};
  const cities = geo.cities || geo.city || {};
  const stateArr = Object.entries(states).map(([label, value]) => ({ label: toTitleCase(label), value }));
  const cityArr = Array.isArray(cities)
    ? cities.map((city) => ({ label: city, value: null }))
    : Object.entries(cities).map(([label, value]) => ({ label: toTitleCase(label), value }));
  return [...stateArr, ...cityArr];
};

const normalizeEventRecord = (raw = {}) => {
  const source = raw?.event || raw || {};
  const id = raw?.eventId || raw?.id || source?.id || "";

  if (!id) return null;

  return {
    id,
    title: source?.title || source?.name || raw?.title || raw?.name || "Untitled event",
    category: source?.category || raw?.category || "",
    city: source?.city || raw?.city || raw?.location || "",
    startDate: source?.startDate || raw?.startDate || "",
    revenue: 'revenue' in raw ? raw.revenue : null,
    ticketsSold: Number(raw?.ticketsSold ?? raw?.sold ?? 0) || 0,
    bookings: Number(raw?.bookings ?? 0) || 0,
    event: source,
  };
};

const normalizeEventCollection = (raw) => {
  const source = unwrap(raw);
  const events = source?.events || source?.items || source?.topEvents || source?.data || source || [];
  return Array.isArray(events) ? events.map(normalizeEventRecord).filter(Boolean) : [];
};

const mergeEventCollections = (...collections) => {
  const merged = new Map();

  collections
    .flat()
    .filter(Boolean)
    .forEach((item) => {
      const existing = merged.get(item.id) || {};
      merged.set(item.id, {
        ...existing,
        ...item,
        event: { ...existing.event, ...item.event, organizer: item.event?.organizer || existing.event?.organizer },
        revenue: item.revenue,
        ticketsSold: item.ticketsSold || existing.ticketsSold || 0,
        bookings: item.bookings || existing.bookings || 0,
      });
    });

  return Array.from(merged.values()).sort((a, b) => {
    const performanceA = Number(a.revenue || 0) + Number(a.ticketsSold || 0) + Number(a.bookings || 0);
    const performanceB = Number(b.revenue || 0) + Number(b.ticketsSold || 0) + Number(b.bookings || 0);

    if (performanceA !== performanceB) {
      return performanceB - performanceA;
    }

    const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return timeB - timeA;
  });
};

const AudienceAnalytics = () => {
  const [timePeriod, setTimePeriod] = useState("month"); // day | week | month | year | all
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includeDraft, setIncludeDraft] = useState(false);
  const [includeCancelled, setIncludeCancelled] = useState(false);

  const [statistics, setStatistics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [trendSeries, setTrendSeries] = useState({ revenue: [], bookings: [] });
  const [topEvents, setTopEvents] = useState([]);
  const [breakdowns, setBreakdowns] = useState({ status: [], category: [], ticketType: [], bookingStatus: [], geography: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [eventTickets, setEventTickets] = useState([]);
  const [eventTimeline, setEventTimeline] = useState([]);
  const [eventOverview, setEventOverview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventError, setEventError] = useState("");

  const computedPeriod = useMemo(() => {
    if (startDate && endDate) return "custom";
    return timePeriod;
  }, [timePeriod, startDate, endDate]);

  const periodLabel = useMemo(() => {
    if (startDate && endDate) return `${startDate} → ${endDate}`;
    switch (timePeriod) {
      case "day":
        return "Last 24h";
      case "week":
        return "Last 7 days";
      case "month":
        return "Last 30 days";
      case "year":
        return "Last 12 months";
      case "all":
        return "All time";
      default:
        return "Custom";
    }
  }, [timePeriod, startDate, endDate]);

  const loadOrganizerAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    const mainPeriod = computedPeriod;
    const periodForAnalytics = mainPeriod === "all" ? "year" : mainPeriod;
    const periodForOthers = mainPeriod;
    const trendPeriod = periodForOthers === "all" ? "year" : periodForOthers;
    const statsPeriod = mainPeriod === "all" ? "year" : periodForAnalytics;
    const commonStats = { period: statsPeriod, startDate, endDate };
    const common = { period: periodForOthers, startDate, endDate };
    const breakdownPeriod = periodForOthers;
    try {
      const results = await Promise.allSettled([
        apiFetch(buildQuery("organizer/me/statistics", { ...commonStats, includeDraft, includeCancelled }), { method: "GET" }),
        apiFetch(buildQuery("organizer/me/analytics", { ...common, period: periodForAnalytics }), { method: "GET" }),
        apiFetch(buildQuery("organizer/me/analytics/trends", { ...common, period: trendPeriod, metric: "revenue" }), {
          method: "GET",
        }),
        apiFetch(buildQuery("organizer/me/analytics/top-events", { ...common, sortBy: "revenue", limit: 5 }), {
          method: "GET",
        }),
        apiFetch(buildQuery("organizer/me/analytics/breakdown", { period: breakdownPeriod, startDate, endDate, type: "status" }), {
          method: "GET",
        }),
        apiFetch(
          buildQuery("organizer/me/analytics/breakdown", {
            period: breakdownPeriod,
            startDate,
            endDate,
            type: "category",
          }),
          { method: "GET" }
        ),
        apiFetch(
          buildQuery("organizer/me/analytics/breakdown", {
            period: breakdownPeriod,
            startDate,
            endDate,
            type: "geography",
          }),
          { method: "GET" }
        ),
        apiFetch(
          buildQuery("organizer/me/analytics/breakdown", {
            period: breakdownPeriod,
            startDate,
            endDate,
            type: "ticketType",
          }),
          { method: "GET" }
        ),
        apiFetch("event/my-events", { method: "GET" }),
      ]);

      const pick = (idx) => (results[idx].status === "fulfilled" ? results[idx].value : null);
      const failures = results
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.status === "rejected")
        .map(({ i, r }) => ({ i, msg: r.reason?.message || r.reason?.errorMessage || "Request failed" }));

      const statisticsRes = pick(0);
      const analyticsRes = pick(1);
      const trendsRes = pick(2);
      const topEventsRes = pick(3);
      const statusBreakdownRes = pick(4);
      const categoryBreakdownRes = pick(5);
      const geoBreakdownRes = pick(6);
      const ticketTypeBreakdownRes = pick(7);
      const organizerEventsRes = pick(8);

      const statsData = unwrap(statisticsRes);
      const analyticsData = unwrap(analyticsRes);
      const trendData = unwrap(trendsRes);
      const topEventsData = unwrap(topEventsRes);

      if (statsData) setStatistics(statsData || {});
      if (analyticsData) setAnalytics(analyticsData || {});

      const revenueTrend = normalizeTrend(
        analyticsData?.trends?.revenue || trendData?.trend || trendData?.timeline || trendData?.data || trendData || []
      );
      const bookingsTrend = normalizeTrend(analyticsData?.trends?.bookings || []);
      setTrendSeries({ revenue: revenueTrend, bookings: bookingsTrend });

      const normalizedTopEvents = normalizeEventCollection(analyticsData?.topEvents || topEventsData || []);
      const normalizedAllEvents = normalizeEventCollection(organizerEventsRes);
      const mergedEventOptions = mergeEventCollections(normalizedAllEvents, normalizedTopEvents);
      setTopEvents(normalizedTopEvents);
      setEventOptions(mergedEventOptions);
      setSelectedEvent((prev) => {
        if (!mergedEventOptions.length) return "";
        return mergedEventOptions.some((item) => item.id === prev) ? prev : mergedEventOptions[0].id;
      });

      if (!mergedEventOptions.length) {
        setEventTickets([]);
        setEventTimeline([]);
        setEventOverview(null);
        setEventError("");
      }

      setBreakdowns({
        status: normalizeBreakdown(statusBreakdownRes || analyticsData?.breakdown?.byStatus),
        category: normalizeBreakdown(categoryBreakdownRes || analyticsData?.breakdown?.byCategory),
        ticketType: normalizeTicketTypes(ticketTypeBreakdownRes || analyticsData?.breakdown?.byTicketType),
        bookingStatus: normalizeBreakdown(analyticsData?.breakdown?.byBookingStatus),
        geography: normalizeGeography(geoBreakdownRes || analyticsData?.geography),
      });

      setRecentActivity(
        analyticsData?.recentActivity ||
          analyticsData?.activity ||
          (Array.isArray(analyticsData) ? analyticsData : []) ||
          []
      );

      if (failures.length) {
        const first = failures[0]?.msg;
        setError(failures.length === results.length ? first || "Failed to load analytics" : `Partial load: ${first}`);
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Failed to load organizer analytics", err);
      setError(err?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [computedPeriod, startDate, endDate, includeDraft, includeCancelled]);

  const loadEventAnalytics = useCallback(
    async (eventId, eventMeta) => {
      if (!eventId) {
        setEventTickets([]);
        setEventTimeline([]);
        setEventOverview(null);
        setEventError("");
        return;
      }
      setEventLoading(true);
      setEventError("");
      const mainPeriod = computedPeriod;
      const safePeriod = mainPeriod;
      const common = { period: safePeriod, startDate, endDate };
      try {
        const [ticketsRes, timelineRes] = await Promise.all([
          apiFetch(buildQuery(`organizer/events/${eventId}/analytics/tickets`, common), { method: "GET" }),
          apiFetch(buildQuery(`organizer/events/${eventId}/analytics/sales-timeline`, common), { method: "GET" }),
        ]);

        const ticketData = unwrap(ticketsRes);
        const tickets = ticketData?.tickets || ticketData?.data || (Array.isArray(ticketData) ? ticketData : []);
        setEventTickets(tickets);

        const timelineData = unwrap(timelineRes);
        const timeline = timelineData?.timeline || timelineData?.trend || timelineData?.data || (Array.isArray(timelineData) ? timelineData : []);
        setEventTimeline(timeline);

        // Derive overview from timeline totals and ticket data (no separate overview endpoint)
        const totals = timelineData?.totals || {};
        const totalRevenue = totals.netTicketSales;
        const totalSold = totals.ticketsSold ?? tickets.reduce((s, t) => s + (t.soldQuantity || 0), 0);
        const totalRefunds = totals.refunds ?? 0;
        const timelineBookings = timeline.reduce(
          (sum, row) => sum + Number(row.bookings ?? row.bookingCount ?? 0),
          0
        );
        const totalBookings = totals.bookings ?? (timelineBookings || eventMeta?.bookings || 0);
        setEventOverview({
          revenue: totalRevenue,
          ticketsSold: totalSold,
          bookings: totalBookings,
          grossTicketSales: totals.grossTicketSales,
          processedTicketRefunds: totalRefunds,
          buyerCollections: totals.buyerCollections,
          unresolvedRefunds: totals.unresolvedRefunds,
        });
      } catch (err) {
        console.error("Failed to load event analytics", err);
        setEventError(err?.message || "Unable to load event analytics");
      } finally {
        setEventLoading(false);
      }
    },
    [computedPeriod, startDate, endDate]
  );

  useEffect(() => {
    loadOrganizerAnalytics();
  }, [loadOrganizerAnalytics]);

  const selectedEventOption = useMemo(
    () => eventOptions.find((event) => event.id === selectedEvent) || null,
    [eventOptions, selectedEvent]
  );

  useEffect(() => {
    if (selectedEvent) {
      loadEventAnalytics(selectedEvent, selectedEventOption);
    } else {
      setEventTickets([]);
      setEventTimeline([]);
      setEventOverview(null);
      setEventError("");
    }
  }, [selectedEvent, selectedEventOption, loadEventAnalytics]);

  const summaryCards = useMemo(() => {
    const stats = statistics || {};
    const sections = [
      {
        key: "events",
        title: "Events",
        icon: <Sparkles className="w-8 h-8 text-foreground" />,
      },
      {
        key: "attendees",
        title: "Attendees",
        icon: <Users className="w-8 h-8 text-foreground" />,
      },
      {
        key: "revenue",
        title: "Revenue",
        icon: <Coins className="w-8 h-8 text-foreground" />,
      },
      {
        key: "ticketSales",
        title: "Tickets Sold",
        icon: <Ticket className="w-8 h-8 text-foreground" />,
      },
    ];

    return sections.map((section) => {
      const node = stats?.[section.key] || {};
      const changeVal = Number(node.change || 0);
      const isNegative = changeVal < 0;
      return {
        ...section,
        value: formatNumber(node.overall ?? node.currentPeriod ?? 0),
        change: `${changeVal > 0 ? "+" : ""}${formatPercent(changeVal)}`,
        current: formatNumber(node.currentPeriod ?? 0),
        previous: formatNumber(node.previousPeriod ?? 0),
        isNegative,
      };
    });
  }, [statistics]);

  const ageGroups = useMemo(() => {
    const demo =
      analytics?.demographics?.age ||
      analytics?.audience?.ageGroups ||
      analytics?.ageGroups ||
      statistics?.ageGroups ||
      [];
    return demo.length
      ? demo.map((item, idx) => ({
          label: item.label || item.range || item.bucket || `Group ${idx + 1}`,
          value: item.value ?? item.percentage ?? 0,
        }))
      : [];
  }, [analytics, statistics]);

  const gender = useMemo(() => {
    const genderData =
      analytics?.demographics?.gender ||
      analytics?.audience?.gender ||
      analytics?.gender ||
      statistics?.genderBreakdown ||
      {};
    const female = genderData.female ?? genderData.FEMALE ?? genderData?.["female"];
    const male = genderData.male ?? genderData.MALE ?? genderData?.["male"];
    const total = nonNegativeNumber(female) + nonNegativeNumber(male);
    const femalePct = total ? Math.round(progressPercent(female, total)) : null;
    return { female: femalePct, male: total ? 100 - femalePct : null };
  }, [analytics, statistics]);

  const renderBarList = (
    items,
    colorClass = "bg-primaryCTA",
    { showValues = true } = {}
  ) => {
    const total = sumValues(items);
    return (
      <div className="space-y-3">
        {items.map((item) => {
          const share = showValues ? progressPercent(item.value, total) : progressPercent(item.value);
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground">
                  {showValues ? formatNumber(item.value) : formatPercent(item.value)}
                </span>
              </div>
              <AnalyticsProgressBar
                value={item.value == null ? null : share}
                trackStyle={{ backgroundColor: "var(--chart-progress-track)" }}
                fillClassName={colorClass}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const timelinePoints = useMemo(() => {
    const revenue = Array.isArray(trendSeries?.revenue) ? trendSeries.revenue : [];
    const bookings = Array.isArray(trendSeries?.bookings) ? trendSeries.bookings : [];
    const map = new Map();
    revenue.forEach((item) => {
      map.set(item.label, { label: item.label, revenue: item.value || 0, bookings: 0 });
    });
    bookings.forEach((item) => {
      const existing = map.get(item.label) || { label: item.label, revenue: 0, bookings: 0 };
      existing.bookings = item.value || 0;
      map.set(item.label, existing);
    });
    const data = Array.from(map.values());
    const maxRevenue = Math.max(0, ...data.map(d => nonNegativeNumber(d.revenue)));
    const maxBookings = Math.max(0, ...data.map(d => nonNegativeNumber(d.bookings)));
    return { data, maxRevenue, maxBookings };
  }, [trendSeries]);

  const safeBreakdowns = useMemo(
    () => ({
      status: Array.isArray(breakdowns?.status) ? breakdowns.status : [],
      category: Array.isArray(breakdowns?.category) ? breakdowns.category : [],
      ticketType: Array.isArray(breakdowns?.ticketType) ? breakdowns.ticketType : [],
      bookingStatus: Array.isArray(breakdowns?.bookingStatus) ? breakdowns.bookingStatus : [],
      geography: Array.isArray(breakdowns?.geography) ? breakdowns.geography : [],
    }),
    [breakdowns]
  );

  return (
    <div className="min-w-0 space-y-6 text-foreground [&_*]:min-w-0 [overflow-wrap:anywhere]">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-elegant)]">
          <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute bottom-0 right-12 h-24 w-24 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative flex flex-col gap-6">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Organizer Portal</p>
              
              <h2 className="text-3xl font-extrabold">Audience Analytics</h2>
              <p className="text-sm text-muted-foreground">Understand who’s engaging with your events.</p>
              <p className="text-xs text-muted-foreground">Period: {periodLabel}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-4">
              {[{ value: "day", label: "24h" }, { value: "week", label: "7d" }, { value: "month", label: "30d" }, { value: "year", label: "1y" }, { value: "all", label: "All" }].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setTimePeriod(period.value)}
                  aria-pressed={timePeriod === period.value}
                  className={`min-h-11 px-4 py-2 rounded-lg text-sm border transition focus-visible:ring-2 focus-visible:ring-ring ${
                    timePeriod === period.value
                      ? "bg-primaryCTA text-primary-foreground border-primary shadow-[var(--shadow-card)]"
                      : "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {period.label}
                </button>
              ))}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border/50 rounded-2xl px-3 py-2">
                <label className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-accent"
                    checked={includeDraft}
                    onChange={(e) => setIncludeDraft(e.target.checked)}
                  />
                  Draft
                </label>
                <label className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-accent"
                    checked={includeCancelled}
                    onChange={(e) => setIncludeCancelled(e.target.checked)}
                  />
                  Cancelled
                </label>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border/50 rounded-2xl px-3 py-2">
                <input
                  type="date"
                  aria-label="Start date" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-h-11 bg-transparent focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-muted-foreground">→</span>
                <input
                  type="date"
                  aria-label="End date" value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-h-11 bg-transparent focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button onClick={loadOrganizerAnalytics} className="min-h-11 gap-2"><RefreshCw className="w-4 h-4" />Refresh</Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 border border-warning/30 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <div key={index} className={summaryCardClass}>
              <div className="relative flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-2">{card.value}</p>
                  <p
                    className={`text-[12px] mt-2 inline-flex items-center gap-1 ${
                      card.isNegative ? "text-warning" : "text-foreground"
                    }`}
                  >
                    {card.isNegative ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {card.change || "vs prev"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline + Top events */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-card border border-border/50 rounded-2xl p-5 shadow-sm xl:max-h-[420px] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Engagement trends
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/40 border border-border/50">
                    <span className="w-3 h-2 rounded-full bg-[var(--organizer-revenue-bar)]" /> Revenue
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/40 border border-border/50">
                    <span className="w-3 h-2 rounded-full bg-[var(--organizer-bookings-bar)]" /> Bookings
                  </span>
                </div>
              </div>
              {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
            </div>
            <p className="text-xs text-muted-foreground mb-3">Revenue / bookings trend over time</p>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {timelinePoints.data.length === 0 && (
                <p className="text-sm text-muted-foreground">No trend data for the selected period.</p>
              )}
              {timelinePoints.data.map((point, idx) => {
                const revenueVal = point.revenue ?? point.value ?? 0;
                const bookingVal = point.bookings ?? 0;
                const revPct = progressPercent(revenueVal, timelinePoints.maxRevenue);
                const bookPct = progressPercent(bookingVal, timelinePoints.maxBookings);
                const title = `Revenue: ₹${formatNumber(revenueVal, "0")}, Bookings: ${formatNumber(bookingVal, "0")}`;
                return (
                  <div key={idx} className="space-y-2" title={title}>
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                      <span>{point.label || point.date || `Point ${idx + 1}`}</span>
                      <span className="text-foreground font-semibold flex flex-wrap gap-2">
                        <span className="text-foreground">₹{formatNumber(revenueVal, "0")}</span>
                        <span className="text-muted-foreground">{formatNumber(bookingVal, "0")} bookings</span>
                      </span>
                    </div>
                    <div className="space-y-1">
                      <AnalyticsProgressBar
                        value={revPct}
                        trackStyle={{ backgroundColor: "var(--chart-progress-track)" }}
                        fillStyle={{ backgroundColor: "var(--organizer-revenue-bar, hsl(var(--success)))" }}
                      />
                      <AnalyticsProgressBar
                        value={bookPct}
                        trackStyle={{ backgroundColor: "var(--chart-progress-track)" }}
                        fillStyle={{ backgroundColor: "var(--organizer-bookings-bar, hsl(var(--info)))" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm xl:max-h-[420px] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-lg font-semibold">Top events</h3>
              <span className="text-xs text-muted-foreground">{topEvents.length} items</span>
            </div>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {topEvents.length === 0 && <p className="text-sm text-muted-foreground">No events in this window.</p>}
              {topEvents.map((evt) => {
                const eventNode = evt.event || evt;
                const isActive = selectedEvent === evt.id;
                return (
                  <button
                    key={evt.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedEvent(evt.id)}
                    className={`w-full flex flex-wrap items-start justify-between gap-3 focus-visible:ring-2 focus-visible:ring-ring rounded-xl bg-muted/40 border px-3 py-2 text-left transition  ${
                      isActive ? "border-primary/60 bg-primary/10" : "border-border/50 hover:bg-muted/70"
                    }`}
                  >
                    <div className="pr-3">
                      <p className="font-semibold leading-snug">{evt.title || "Event"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {eventNode?.city || evt.city || evt.location || "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {formatNumber(evt.revenue ?? evt.net ?? evt.total ?? evt.amount ?? 0, "—")}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatNumber(evt.ticketsSold ?? evt.sold ?? 0, "0")} tickets</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Breakdown + Demographics */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm xl:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-accent" />
                Breakdown
              </h3>
              <span className="text-xs text-muted-foreground">{periodLabel}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <BadgePercent className="w-4 h-4" /> Status
                </p>
                {safeBreakdowns.status.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No status data.</p>
                ) : (
                  renderBarList(
                    safeBreakdowns.status.map((b) => ({
                      label: b.label || b.status || b.name,
                      value: b.value ?? b.percentage ?? 0,
                    })),
                    "bg-primaryCTA",
                    { showValues: true }
                  )
                )}
              </div>

              <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Category
                </p>
                {safeBreakdowns.category.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No category data.</p>
                ) : (
                  renderBarList(
                    safeBreakdowns.category.map((b) => ({
                      label: b.label || b.category || b.name,
                      value: b.value ?? b.percentage ?? 0,
                    })),
                    "bg-primaryCTA",
                    { showValues: true }
                  )
                )}
              </div>

              <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> Ticket Types
                </p>
                {safeBreakdowns.ticketType.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No ticket type data.</p>
                ) : (
                  renderBarList(
                    safeBreakdowns.ticketType.map((b) => ({
                      label: b.label || b.name,
                      value: b.ticketsSold ?? b.count ?? b.value ?? 0,
                    })),
                    "bg-primaryCTA",
                    { showValues: true }
                  )
                )}
              </div>

              <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Booking Status
                </p>
                {safeBreakdowns.bookingStatus.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No booking status data.</p>
                ) : (
                  renderBarList(
                    safeBreakdowns.bookingStatus.map((b) => ({
                      label: b.label || b.status || b.name,
                      value: b.value ?? b.count ?? 0,
                    })),
                    "bg-primaryCTA",
                    { showValues: true }
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Demographics (hide when empty) */}
        {(ageGroups.length > 0 || (gender.female !== null && gender.male !== null)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ageGroups.length > 0 && (
              <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold">Audience Demographics</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <Flame className="w-4 h-4 text-accent-foreground" />
                    by age group
                  </span>
                </div>
                {renderBarList(ageGroups)}
              </div>
            )}

            {gender.female !== null && gender.male !== null && (
              <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h3 className="text-lg font-semibold">Gender Distribution</h3>
                  <span className="text-xs text-muted-foreground">{periodLabel}</span>
                </div>
                <div className="h-48 flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 rounded-full border-8 border-border/50"></div>
                    <div className="absolute inset-1 rounded-full border-[6px] border-primary/60"></div>
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-card via-background to-card flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-bold">{gender.female}%</span>
                      <span className="text-xs text-muted-foreground">Female</span>
                      <span className="text-xs text-muted-foreground">{gender.male}% Male</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event drilldown */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Event drill-down</h3>
              <p className="text-xs text-muted-foreground">
                {selectedEventOption ? `${selectedEventOption.title} performance over the selected period` : "Ticket performance and sales timeline"}
              </p>
            </div>
            <div className="flex w-full md:max-w-sm items-center gap-2">
              <select
                aria-label="Select event for drill-down" value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full min-h-11 bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {!selectedEvent && (
                  <option value="" className="bg-card text-muted-foreground">
                    Select event
                  </option>
                )}
                {eventOptions.map((evt) => {
                  return (
                    <option key={evt.id} value={evt.id} className="bg-card text-foreground">
                      {evt.title || "Event"}
                    </option>
                  );
                })}
              </select>
              {eventLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
          {eventError && (
            <div className="flex items-center gap-2 text-warning text-xs bg-warning/10 border border-warning/30 rounded-xl px-3 py-2 mb-3">
              <AlertTriangle className="w-4 h-4" />
              {eventError}
            </div>
          )}
          {!selectedEvent ? (
            <p className="text-sm text-muted-foreground">Select an event to view its analytics.</p>
          ) : (
            <div className="space-y-5">
              <div className="space-y-3">
                {eventOverview && (
                  <div className="rounded-xl bg-muted/40 border border-border/50 px-4 py-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
                      <p className="text-sm text-muted-foreground">Sales for selected period</p>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-muted/40 border border-border/50 text-muted-foreground">Quick stats</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                      <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background p-4 text-muted-foreground"><span>Net ticket sales</span><span className="text-2xl font-semibold tabular-nums text-foreground">{formatNumber(eventOverview.overview?.revenue ?? eventOverview.revenue ?? eventOverview.total)}</span></div>
                      <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background p-4 text-muted-foreground"><span>Bookings</span><span className="text-2xl font-semibold tabular-nums text-foreground">{formatNumber(eventOverview.overview?.bookings ?? eventOverview.bookings ?? 0, "0")}</span></div>
                      <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background p-4 text-muted-foreground"><span>Tickets</span><span className="text-2xl font-semibold tabular-nums text-foreground">{formatNumber(eventOverview.overview?.ticketsSold ?? eventOverview.ticketsSold ?? eventOverview.sold ?? 0, "0")}</span></div>
                      <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background p-4 text-muted-foreground"><span>Avg booking</span><span className="text-2xl font-semibold tabular-nums text-foreground">₹{formatNumber((eventOverview.overview?.revenue ?? eventOverview.revenue ?? eventOverview.total ?? 0) / Math.max(eventOverview.overview?.bookings ?? eventOverview.bookings ?? 1, 1), "0")}</span></div>
                    </div>
                    <div className="text-sm">Gross ticket sales: ₹{formatNumber(eventOverview.grossTicketSales)} · Ticket refunds: ₹{formatNumber(eventOverview.processedTicketRefunds)}</div>
                    {eventOverview.unresolvedRefunds > 0 && <p role="alert">Net sales unavailable: a refund needs review.</p>}

                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Sales timeline</p>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-muted/40 border border-border/50 text-muted-foreground">Revenue & tickets</span>
                  </div>
                  <div className="space-y-2 xl:max-h-96 overflow-y-auto pr-1">
                    {eventTimeline.length === 0 && (
                      <div className="rounded-xl border border-border/50 bg-muted/40 px-3 py-4 text-xs text-muted-foreground text-center">
                        No timeline data for this period.
                      </div>
                    )}
                    {eventTimeline.map((row, idx) => {
                      const revenueVal = row.revenue ?? row.amount ?? row.sales ?? 0;
                      const tickets = row.ticketsSold ?? row.count ?? 0;
                      const maxRevenue = eventTimeline.reduce((m, r) => Math.max(m, r.revenue ?? r.amount ?? r.sales ?? 0), 1);
                      const width = progressPercent(revenueVal, maxRevenue);
                      return (
                        <div key={idx} className="space-y-2" title={`₹${formatNumber(revenueVal, "0")}, ${formatNumber(tickets, "0")} tickets`}>
                          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                            <span>{row.label || row.date || `Day ${idx + 1}`}</span>
                            <span className="text-foreground font-semibold flex flex-wrap gap-2">
                              <span className="text-foreground">₹{formatNumber(revenueVal, "0")}</span>
                              <span className="text-muted-foreground">{formatNumber(tickets, "0")} tickets</span>
                            </span>
                          </div>
                          <AnalyticsProgressBar
                            value={width}
                            trackStyle={{ backgroundColor: "var(--chart-progress-track)" }}
                            fillStyle={{ background: "hsl(var(--primary-cta))" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Ticket performance</p>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-muted/40 border border-border/50 text-muted-foreground">Top 5</span>
                  </div>
                  {eventTickets.length === 0 && (
                    <div className="rounded-xl border border-border/50 bg-muted/40 px-3 py-3 text-xs text-muted-foreground text-center">No ticket data.</div>
                  )}
                  <div className="space-y-2 xl:max-h-96 overflow-y-auto pr-1">
                    {eventTickets.slice(0, 5).map((ticket, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-muted/40 border border-border/50 px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold leading-tight">{ticket.ticketName || ticket.name || "Ticket"}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatNumber(ticket.soldQuantity ?? ticket.sold ?? ticket.quantity ?? ticket.count ?? 0, "0")} sold
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatNumber(ticket.revenue ?? ticket.total ?? ticket.amount ?? 0, "—")}
                          </p>
                          <p className="text-[11px] text-muted-foreground">Avg ₹{formatNumber((ticket.revenue ?? ticket.total ?? ticket.amount ?? 0) / Math.max(ticket.soldQuantity ?? ticket.sold ?? ticket.quantity ?? ticket.count ?? 1, 1), "0")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


              {eventOverview && (
                    <EventSettlementSummary event={{ id: selectedEvent, organizerId: eventOptions.find(item => item.id === selectedEvent)?.event?.organizer?.id }} />
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <span className="text-xs text-muted-foreground">Live stream · updated now</span>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div
                  key={activity.id || idx}
                  className="flex items-start space-x-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/50 transition-colors"
                >
                  <div className="w-8 h-8 shrink-0 rounded-full bg-muted/40 flex items-center justify-center text-xs font-semibold">
                    {(activity.actor || "").charAt(0) || "•"}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{activity.title || activity.action || "Activity"}</p>
                    {activity.description && <p className="text-xs text-muted-foreground">{activity.description}</p>}
                    <p className="text-[11px] text-muted-foreground">{activity.time || activity.createdAt || "Just now"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudienceAnalytics;
