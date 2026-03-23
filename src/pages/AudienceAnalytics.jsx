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

const gradientCard =
  "relative rounded-2xl p-4 bg-white/5 border border-white/10 backdrop-blur overflow-hidden shadow-lg shadow-black/30";

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

const sumValues = (items = []) => items.reduce((acc, item) => acc + Number(item.value || 0), 0);

const normalizeTrend = (arr = []) =>
  Array.isArray(arr)
    ? arr.map((item, idx) => ({
        label: item.label || item.date || item.day || `Point ${idx + 1}`,
        value: item.amount ?? item.revenue ?? item.count ?? item.bookings ?? item.value ?? 0,
      }))
    : [];

const normalizeBreakdown = (raw) => {
  const source = unwrap(raw);
  const breakdown = source?.breakdown || source?.data || source || {};
  if (Array.isArray(breakdown)) return breakdown;
  return Object.entries(breakdown || {}).map(([label, val]) => ({
    label: toTitleCase(label),
    value: typeof val === "object" ? val.value ?? val.count ?? val.ticketsSold ?? 0 : val ?? 0,
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
    const periodForAnalytics = mainPeriod === "custom" ? "custom" : mainPeriod === "all" ? "year" : mainPeriod; // analytics endpoint only allows day/week/month/year/custom
    const periodForOthers = mainPeriod === "custom" ? "month" : mainPeriod; // backend for trends/top/breakdowns needs day|week|month|year|all
    const trendPeriod = periodForOthers === "all" ? "year" : periodForOthers; // trends validator disallows "all"
    const statsPeriod = mainPeriod === "all" ? "year" : periodForAnalytics; // stats validator disallows "all"
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

      const normalizedTopEvents =
        analyticsData?.topEvents || topEventsData?.items || topEventsData?.events || topEventsData?.topEvents || topEventsData || [];
      setTopEvents(normalizedTopEvents);
      setEventOptions(normalizedTopEvents);
      if (!selectedEvent && normalizedTopEvents.length) {
        setSelectedEvent(
          normalizedTopEvents[0]?.eventId || normalizedTopEvents[0]?.id || normalizedTopEvents[0]?.event?.id || ""
        );
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
  }, [timePeriod, startDate, endDate, includeDraft, includeCancelled, selectedEvent]);

  const loadEventAnalytics = useCallback(
    async (eventId) => {
      if (!eventId) return;
      setEventLoading(true);
      setEventError("");
      const mainPeriod = computedPeriod;
      const periodForOthers = mainPeriod === "custom" ? "month" : mainPeriod;
      const safePeriod = periodForOthers === "all" ? "year" : periodForOthers; // validators disallow "all" for these endpoints
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
        const totalRevenue = totals.revenue ?? tickets.reduce((s, t) => s + (t.revenue || 0), 0);
        const totalSold = totals.ticketsSold ?? tickets.reduce((s, t) => s + (t.soldQuantity || 0), 0);
        const totalRefunds = totals.refunds ?? 0;
        setEventOverview({
          revenue: totalRevenue,
          ticketsSold: totalSold,
          bookings: timeline.length,
          payoutSummary: totalRevenue > 0
            ? {
                organizerPayout: totalRevenue - totalRefunds,
                platformFees: tickets.reduce((s, t) => s + (t.platformFee || 0), 0),
                gstCollected: tickets.reduce((s, t) => s + (t.gst || 0), 0),
                refundsProcessed: totalRefunds,
                netPayout: totalRevenue - totalRefunds,
              }
            : null,
        });
      } catch (err) {
        console.error("Failed to load event analytics", err);
        setEventError(err?.message || "Unable to load event analytics");
      } finally {
        setEventLoading(false);
      }
    },
    [timePeriod, startDate, endDate]
  );

  useEffect(() => {
    loadOrganizerAnalytics();
  }, [loadOrganizerAnalytics]);

  useEffect(() => {
    if (selectedEvent) {
      loadEventAnalytics(selectedEvent);
    }
  }, [selectedEvent, loadEventAnalytics]);

  const summaryCards = useMemo(() => {
    const stats = statistics || {};
    const sections = [
      {
        key: "events",
        title: "Events",
        icon: <Sparkles className="w-8 h-8 text-white" />,
        tone: "from-blue-500/70 via-blue-400/70 to-sky-400/70",
      },
      {
        key: "attendees",
        title: "Attendees",
        icon: <Users className="w-8 h-8 text-white" />,
        tone: "from-blue-500/70 via-blue-400/70 to-sky-400/70",
      },
      {
        key: "revenue",
        title: "Revenue",
        icon: <Coins className="w-8 h-8 text-white" />,
        tone: "from-blue-500/70 via-blue-400/70 to-sky-400/70",
      },
      {
        key: "ticketSales",
        title: "Tickets Sold",
        icon: <Ticket className="w-8 h-8 text-white" />,
        tone: "from-blue-500/70 via-blue-400/70 to-sky-400/70",
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
    const total = (female || 0) + (male || 0);
    const femalePct = total ? Math.round((female / total) * 100) : null;
    return { female: femalePct, male: total ? 100 - femalePct : null };
  }, [analytics, statistics]);

  const renderBarList = (
    items,
    colorClass = "bg-gradient-to-r from-red-500 via-blue-500 to-cyan-400",
    { showValues = true } = {}
  ) => {
    const total = sumValues(items);
    return (
      <div className="space-y-3">
        {items.map((item) => {
          const share = total ? Math.max(4, Math.min(100, (Number(item.value || 0) / total) * 100)) : 0;
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">{item.label}</span>
                <span className="font-semibold text-white">
                  {showValues ? formatNumber(item.value) : formatPercent(item.value)}
                </span>
              </div>
              <AnalyticsProgressBar
                value={share || 0}
                trackStyle={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                fillClassName={colorClass}
                minVisiblePercent={4}
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
    const maxValue = Math.max(
      ...data.map((d) => Math.max(Number(d.revenue || 0), Number(d.bookings || 0))),
      0
    );
    return { data, maxValue: maxValue || 1 };
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
    <div className="min-h-screen bg-gradient-to-b from-[#04060d] via-[#0a1020] to-[#04060d] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0b1224] via-[#0d1630] to-[#0b0f1d] p-5 shadow-lg shadow-black/40">
          <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_20%_20%,rgba(76,161,255,0.3),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,107,241,0.25),transparent_30%)]" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              
              <h2 className="text-3xl font-extrabold">Audience Analytics</h2>
              <p className="text-sm text-white/70">Understand who’s engaging with your events.</p>
              <p className="text-xs text-white/50">Period: {periodLabel}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {[{ value: "day", label: "24h" }, { value: "week", label: "7d" }, { value: "month", label: "30d" }, { value: "year", label: "1y" }, { value: "all", label: "All" }].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setTimePeriod(period.value)}
                  className={`px-3 py-2 rounded-2xl text-sm border transition shadow-sm ${
                    timePeriod === period.value
                      ? "bg-[#3b82f6] text-white border-transparent shadow-lg shadow-blue-500/20"
                      : "bg-white/5 border-white/10 text-white/75 hover:bg-white/10"
                  }`}
                >
                  {period.label}
                </button>
              ))}
              <div className="flex items-center gap-2 text-xs text-white/80 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="accent-[#3b82f6]"
                    checked={includeDraft}
                    onChange={(e) => setIncludeDraft(e.target.checked)}
                  />
                  Draft
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="accent-[#3b82f6]"
                    checked={includeCancelled}
                    onChange={(e) => setIncludeCancelled(e.target.checked)}
                  />
                  Cancelled
                </label>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/80 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent focus:outline-none"
                />
                <span className="text-white/50">→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent focus:outline-none"
                />
              </div>
              <button
                onClick={loadOrganizerAnalytics}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#3b82f6] text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-amber-200 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <div key={index} className={gradientCard}>
              <div className={`absolute inset-0 bg-gradient-to-br ${card.tone} opacity-20`} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/60">{card.title}</p>
                  <p className="text-2xl font-bold mt-2">{card.value}</p>
                  <p
                    className={`text-[12px] mt-2 inline-flex items-center gap-1 ${
                      card.isNegative ? "text-amber-200" : "text-emerald-200"
                    }`}
                  >
                    {card.isNegative ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {card.change || "vs prev"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/10 border border-white/10">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline + Top events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30 lg:h-[360px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sky-300" />
                  Engagement trends
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-white/60">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                    <span className="w-3 h-2 rounded-full bg-emerald-400" /> Revenue
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                    <span className="w-3 h-2 rounded-full bg-sky-400" /> Bookings
                  </span>
                </div>
              </div>
              {loading && <Loader2 className="w-5 h-5 animate-spin text-white/60" />}
            </div>
            <p className="text-xs text-white/60 mb-3">Revenue / bookings trend over time</p>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {timelinePoints.data.length === 0 && (
                <p className="text-sm text-white/60">No trend data for the selected period.</p>
              )}
              {timelinePoints.data.map((point, idx) => {
                const revenueVal = point.revenue ?? point.value ?? 0;
                const bookingVal = point.bookings ?? 0;
                const revPct = Math.max(4, Math.min(100, (revenueVal / timelinePoints.maxValue) * 100));
                const bookPct = Math.max(4, Math.min(100, (bookingVal / timelinePoints.maxValue) * 100));
                const title = `Revenue: ₹${formatNumber(revenueVal, "0")}, Bookings: ${formatNumber(bookingVal, "0")}`;
                return (
                  <div key={idx} className="space-y-2" title={title}>
                    <div className="flex justify-between text-xs text-white/60">
                      <span>{point.label || point.date || `Point ${idx + 1}`}</span>
                      <span className="text-white font-semibold flex gap-2">
                        <span className="text-emerald-200">₹{formatNumber(revenueVal, "0")}</span>
                        <span className="text-blue-200">{formatNumber(bookingVal, "0")} bookings</span>
                      </span>
                    </div>
                    <div className="space-y-1">
                      <AnalyticsProgressBar
                        value={revPct}
                        trackStyle={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        fillStyle={{ backgroundColor: "#34d399" }}
                        minVisiblePercent={4}
                      />
                      <AnalyticsProgressBar
                        value={bookPct}
                        trackStyle={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        fillStyle={{ backgroundColor: "#38bdf8" }}
                        minVisiblePercent={4}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30 lg:h-[360px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Top events</h3>
              <span className="text-xs text-white/60">{topEvents.length} items</span>
            </div>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {topEvents.length === 0 && <p className="text-sm text-white/60">No events in this window.</p>}
              {topEvents.map((evt, idx) => {
                const eventNode = evt.event || evt;
                const eventId = evt.eventId || evt.id || eventNode?.id || idx;
                return (
                  <div
                    key={eventId}
                    className="flex items-start justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2"
                  >
                    <div className="pr-3">
                      <p className="font-semibold leading-snug">{eventNode?.title || eventNode?.name || "Event"}</p>
                      <p className="text-xs text-white/60 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {eventNode?.city || evt.city || evt.location || "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {formatNumber(evt.revenue ?? evt.net ?? evt.total ?? evt.amount ?? 0, "—")}
                      </p>
                      <p className="text-xs text-white/60">{formatNumber(evt.ticketsSold ?? evt.sold ?? 0, "0")} tickets</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Breakdown + Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-sky-300" />
                Breakdown
              </h3>
              <span className="text-xs text-white/60">{periodLabel}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                <p className="text-sm text-white/70 flex items-center gap-2">
                  <BadgePercent className="w-4 h-4" /> Status
                </p>
                {safeBreakdowns.status.length === 0 ? (
                  <p className="text-xs text-white/50">No status data.</p>
                ) : (
                  renderBarList(
                    safeBreakdowns.status.map((b) => ({
                      label: b.label || b.status || b.name,
                      value: b.value ?? b.percentage ?? 0,
                    })),
                    "bg-gradient-to-r from-blue-400 via-blue-500 to-sky-400",
                    { showValues: true }
                  )
                )}
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                <p className="text-sm text-white/70 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Category
                </p>
                {safeBreakdowns.category.length === 0 ? (
                  <p className="text-xs text-white/50">No category data.</p>
                ) : (
                  renderBarList(
                    safeBreakdowns.category.map((b) => ({
                      label: b.label || b.category || b.name,
                      value: b.value ?? b.percentage ?? 0,
                    })),
                    "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400",
                    { showValues: true }
                  )
                )}
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                <p className="text-sm text-white/70 flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> Ticket Types
                </p>
                {safeBreakdowns.ticketType.length === 0 ? (
                  <p className="text-xs text-white/50">No ticket type data.</p>
                ) : (
                  renderBarList(
                    safeBreakdowns.ticketType.map((b) => ({
                      label: b.label || b.name,
                      value: b.ticketsSold ?? b.count ?? b.value ?? 0,
                    })),
                    "bg-gradient-to-r from-amber-400 via-orange-400 to-red-400",
                    { showValues: true }
                  )
                )}
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                <p className="text-sm text-white/70 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Booking Status
                </p>
                {safeBreakdowns.bookingStatus.length === 0 ? (
                  <p className="text-xs text-white/50">No booking status data.</p>
                ) : (
                  renderBarList(
                    safeBreakdowns.bookingStatus.map((b) => ({
                      label: b.label || b.status || b.name,
                      value: b.value ?? b.count ?? 0,
                    })),
                    "bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500",
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
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Audience Demographics</h3>
                  <span className="text-xs text-white/60 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-300" />
                    by age group
                  </span>
                </div>
                {renderBarList(ageGroups)}
              </div>
            )}

            {gender.female !== null && gender.male !== null && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Gender Distribution</h3>
                  <span className="text-xs text-white/60">{periodLabel}</span>
                </div>
                <div className="h-48 flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 rounded-full border-8 border-white/10"></div>
                    <div className="absolute inset-1 rounded-full border-6 border-[#3b82f6]"></div>
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#0b1224] via-[#0a0f1d] to-[#060910] flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-bold">{gender.female}%</span>
                      <span className="text-xs text-white/60">Female</span>
                      <span className="text-xs text-white/50">{gender.male}% Male</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event drilldown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Event drill-down</h3>
              <p className="text-xs text-white/60">Ticket performance & sales timeline</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white min-w-[260px] focus:outline-none focus:border-[#3b82f6]"
              >
                {!selectedEvent && (
                  <option value="" className="bg-[#0b0f1d] text-white/70">
                    Select event
                  </option>
                )}
                {eventOptions.map((evt, idx) => {
                  const eventNode = evt.event || evt;
                  const eventId = evt.eventId || evt.id || eventNode?.id || idx;
                  return (
                    <option key={eventId} value={eventId} className="bg-[#0b0f1d] text-white">
                      {eventNode?.title || eventNode?.name || "Event"}
                    </option>
                  );
                })}
              </select>
              {eventLoading && <Loader2 className="w-4 h-4 animate-spin text-white/60" />}
            </div>
          </div>
          {eventError && (
            <div className="flex items-center gap-2 text-amber-200 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-3">
              <AlertTriangle className="w-4 h-4" />
              {eventError}
            </div>
          )}
          {!selectedEvent ? (
            <p className="text-sm text-white/60">Select a top event to view its analytics.</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-3 rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">Sales timeline</p>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">Revenue & bookings</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {eventTimeline.length === 0 && (
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-xs text-white/60 text-center">
                        No timeline data for this period.
                      </div>
                    )}
                    {eventTimeline.map((row, idx) => {
                      const revenueVal = row.revenue ?? row.amount ?? row.sales ?? 0;
                      const tickets = row.ticketsSold ?? row.count ?? 0;
                      const maxRevenue = eventTimeline.reduce((m, r) => Math.max(m, r.revenue ?? r.amount ?? r.sales ?? 0), 1);
                      const width = Math.max(6, Math.min(100, (revenueVal / maxRevenue) * 100));
                      return (
                        <div key={idx} className="space-y-2" title={`₹${formatNumber(revenueVal, "0")}, ${formatNumber(tickets, "0")} tickets`}>
                          <div className="flex justify-between text-xs text-white/60">
                            <span>{row.label || row.date || `Day ${idx + 1}`}</span>
                            <span className="text-white font-semibold flex gap-2">
                              <span className="text-emerald-200">₹{formatNumber(revenueVal, "0")}</span>
                              <span className="text-blue-200">{formatNumber(tickets, "0")} tickets</span>
                            </span>
                          </div>
                          <AnalyticsProgressBar
                            value={width}
                            trackStyle={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                            fillStyle={{ background: "linear-gradient(90deg, #34d399 0%, #3b82f6 55%, #22d3ee 100%)" }}
                            minVisiblePercent={6}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-2 rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">Ticket performance</p>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">Top 5</span>
                  </div>
                  {eventTickets.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/60 text-center">No ticket data.</div>
                  )}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {eventTickets.slice(0, 5).map((ticket, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold leading-tight">{ticket.ticketName || ticket.name || "Ticket"}</p>
                          <p className="text-[11px] text-white/60">
                            {formatNumber(ticket.soldQuantity ?? ticket.sold ?? ticket.quantity ?? ticket.count ?? 0, "0")} sold
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatNumber(ticket.revenue ?? ticket.total ?? ticket.amount ?? 0, "—")}
                          </p>
                          <p className="text-[11px] text-white/60">Avg ₹{formatNumber((ticket.revenue ?? ticket.total ?? ticket.amount ?? 0) / Math.max(ticket.soldQuantity ?? ticket.sold ?? ticket.quantity ?? ticket.count ?? 1, 1), "0")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {eventOverview && (
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-white/70">Event overview</p>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">Quick stats</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center justify-between text-white/70"><span>Revenue</span><span className="font-semibold text-white">{formatNumber(eventOverview.overview?.revenue ?? eventOverview.revenue ?? eventOverview.total)}</span></div>
                      <div className="flex items-center justify-between text-white/70"><span>Bookings</span><span className="font-semibold text-white">{formatNumber(eventOverview.overview?.bookings ?? eventOverview.bookings ?? 0, "0")}</span></div>
                      <div className="flex items-center justify-between text-white/70"><span>Tickets</span><span className="font-semibold text-white">{formatNumber(eventOverview.overview?.ticketsSold ?? eventOverview.ticketsSold ?? eventOverview.sold ?? 0, "0")}</span></div>
                      <div className="flex items-center justify-between text-white/70"><span>Avg booking</span><span className="font-semibold text-white">₹{formatNumber((eventOverview.overview?.revenue ?? eventOverview.revenue ?? eventOverview.total ?? 0) / Math.max(eventOverview.overview?.bookings ?? eventOverview.bookings ?? 1, 1), "0")}</span></div>
                    </div>
                    {eventOverview.payoutSummary && (
                      <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-white/70">
                        <div className="flex justify-between"><span>Organizer payout</span><span className="text-emerald-200 font-semibold">₹{formatNumber(eventOverview.payoutSummary.organizerPayout, "—")}</span></div>
                        <div className="flex justify-between"><span>Platform fees</span><span className="text-white">₹{formatNumber(eventOverview.payoutSummary.platformFees, "—")}</span></div>
                        <div className="flex justify-between"><span>GST collected</span><span className="text-white">₹{formatNumber(eventOverview.payoutSummary.gstCollected, "—")}</span></div>
                        <div className="flex justify-between"><span>Refunds</span><span className="text-white">₹{formatNumber(eventOverview.payoutSummary.refundsProcessed, "—")}</span></div>
                        <div className="flex justify-between font-semibold text-white pt-1"><span>Net payout</span><span>₹{formatNumber(eventOverview.payoutSummary.netPayout, "—")}</span></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <span className="text-xs text-white/60">Live stream · updated now</span>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div
                  key={activity.id || idx}
                  className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
                    {(activity.actor || "").charAt(0) || "•"}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{activity.title || activity.action || "Activity"}</p>
                    {activity.description && <p className="text-xs text-white/70">{activity.description}</p>}
                    <p className="text-[11px] text-white/50">{activity.time || activity.createdAt || "Just now"}</p>
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
