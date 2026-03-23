import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  Banknote,
  Receipt,
  ShieldCheck,
  Ticket,
  Percent,
  Clock,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Globe2,
  Activity,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/config/api";
import AnalyticsProgressBar from "@/components/analytics/AnalyticsProgressBar";

const formatINR = (value) => `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const formatNumber = (value, fallback = "0") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 });
};
const toTitleCase = (str = "") => str.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
const sumValues = (arr = [], key = "value") => arr.reduce((acc, cur) => acc + (Number(cur?.[key]) || 0), 0);

const glassCard = "bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg shadow-black/20";

const buildQuery = (path, params = {}) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `${path}?${qs}` : path;
};

const unwrap = (res) => res?.data ?? res?.result ?? res;

const palette = ["#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#06b6d4", "#f97316"];

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
    value: val.ticketsSold ?? val.soldQuantity ?? val.value ?? 0,
  }));
};

const normalizeGeography = (raw) => {
  const geo = unwrap(raw)?.geography || unwrap(raw)?.breakdown || unwrap(raw)?.data || unwrap(raw) || {};
  const states = geo.states || {};
  const cities = geo.cities || geo.city || {};
  const stateArr = Object.entries(states).map(([label, value]) => ({ label: toTitleCase(label), value }));
  const cityArr = Object.entries(cities).map(([label, value]) => ({ label: toTitleCase(label), value }));
  return [...stateArr, ...cityArr].sort((a, b) => (b.value || 0) - (a.value || 0));
};

const normalizeTrend = (raw) => {
  const list = unwrap(raw) || [];
  if (Array.isArray(list)) {
    return list.map((row, idx) => ({
      label: row.label || row.date || `Day ${idx + 1}`,
      revenue: row.amount ?? row.revenue ?? row.total ?? 0,
      bookings: row.count ?? row.bookings ?? 0,
    }));
  }
  const revenue = list.revenue || [];
  const bookings = list.bookings || [];
  return revenue.map((row, idx) => ({
    label: row.date || row.label || `Day ${idx + 1}`,
    revenue: row.amount ?? row.revenue ?? row.total ?? 0,
    bookings: bookings[idx]?.count ?? bookings[idx]?.bookings ?? 0,
  }));
};

const SimplePieChart = ({ data, size = 200 }) => {
  if (!data?.length) return null;
  let currentAngle = 0;
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
  const slices = data.map((item, index) => {
    const sliceAngle = ((item.value || 0) / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const radius = size / 2;

    const x1 = radius + radius * Math.cos(startRad);
    const y1 = radius + radius * Math.sin(startRad);
    const x2 = radius + radius * Math.cos(endRad);
    const y2 = radius + radius * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;
    const pathData = [
      `M ${radius} ${radius}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    return <path key={index} d={pathData} fill={item.color} stroke="white" strokeWidth="2" />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
      {slices}
    </svg>
  );
};

const StackedBars = ({ data }) => {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.gross || 0), 1);
  return (
    <div className="flex items-end gap-4 h-56">
      {data.map((item) => {
        const grossH = ((item.gross || 0) / max) * 100;
        const payoutH = ((item.payouts || 0) / max) * 100;
        const refundH = ((item.refunds || 0) / max) * 100;
        return (
          <div key={item.label} className="flex flex-col items-center gap-2">
            <div className="flex gap-1 items-end h-48">
              <div
                className="w-6 rounded-t-lg bg-gradient-to-t from-red-500 to-red-400"
                style={{ height: `${grossH}%` }}
                title={`Gross: ${formatINR(item.gross)}`}
              />
              <div
                className="w-6 rounded-t-lg bg-gradient-to-t from-green-500 to-emerald-400"
                style={{ height: `${payoutH}%` }}
                title={`Payouts: ${formatINR(item.payouts)}`}
              />
              <div
                className="w-6 rounded-t-lg bg-gradient-to-t from-sky-500 to-cyan-400"
                style={{ height: `${refundH}%` }}
                title={`Refunds: ${formatINR(item.refunds)}`}
              />
            </div>
            <span className="text-xs text-white/60">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const StatChip = ({ icon, label, value, accent }) => (
  <div className={`${glassCard} p-4 flex items-center gap-3`}>
    <div className={`p-2 rounded-xl ${accent} bg-opacity-20 text-white`}>{icon}</div>
    <div>
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  </div>
);

const FinancialReporting = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("month"); // day | week | month | year | custom
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [summary, setSummary] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [eventTypeMix, setEventTypeMix] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [breakdowns, setBreakdowns] = useState({ status: [], category: [], ticketType: [], bookingStatus: [], geography: [] });
  const [payouts, setPayouts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [gstSplit, setGstSplit] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [eventTickets, setEventTickets] = useState([]);
  const [eventTimeline, setEventTimeline] = useState([]);
  const [eventOverview, setEventOverview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const computedPeriod = useMemo(() => {
    if (startDate && endDate) return "custom";
    return period;
  }, [period, startDate, endDate]);

  const periodLabel = useMemo(() => {
    if (startDate && endDate) return `${startDate} → ${endDate}`;
    switch (period) {
      case "day":
        return "Today";
      case "week":
        return "This week";
      case "month":
        return "This month";
      case "year":
        return "This year";
      default:
        return "Custom";
    }
  }, [period, startDate, endDate]);

  const loadFinancials = useCallback(async () => {
    setLoading(true);
    setError("");
    const mainPeriod = computedPeriod;
    const periodForAnalytics = mainPeriod === "custom" ? "custom" : mainPeriod === "all" ? "year" : mainPeriod;
    const periodForOthers = mainPeriod === "custom" ? "month" : mainPeriod; // backend for trends/top/breakdown: day|week|month|year|all
    const trendPeriod = periodForOthers === "all" ? "year" : periodForOthers;
    const commonAnalytics = { period: periodForAnalytics, startDate, endDate };
    const commonOthers = { period: periodForOthers, startDate, endDate };
    try {
      const results = await Promise.allSettled([
        apiFetch(buildQuery("organizer/me/statistics", commonAnalytics), { method: "GET" }),
        apiFetch(buildQuery("organizer/me/analytics", commonAnalytics), { method: "GET" }),
        apiFetch(buildQuery("organizer/me/analytics/trends", { ...commonOthers, period: trendPeriod, metric: "revenue" }), {
          method: "GET",
        }),
        apiFetch(buildQuery("organizer/me/analytics/top-events", { ...commonOthers, sortBy: "revenue", limit: 5 }), {
          method: "GET",
        }),
        apiFetch(buildQuery("organizer/me/analytics/breakdown", { ...commonOthers, type: "status" }), { method: "GET" }),
        apiFetch(buildQuery("organizer/me/analytics/breakdown", { ...commonOthers, type: "category" }), { method: "GET" }),
        apiFetch(buildQuery("organizer/me/analytics/breakdown", { ...commonOthers, type: "geography" }), { method: "GET" }),
        apiFetch(buildQuery("organizer/me/analytics/breakdown", { ...commonOthers, type: "ticketType" }), { method: "GET" }),
      ]);

      const pick = (idx) => (results[idx].status === "fulfilled" ? results[idx].value : null);
      const failures = results
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.status === "rejected")
        .map(({ i, r }) => ({ i, msg: r.reason?.message || r.reason?.errorMessage || "Request failed" }));

      const stats = unwrap(pick(0)) || {};
      const analyticsRes = unwrap(pick(1)) || {};
      const trend = unwrap(pick(2)) || {};
      const top = unwrap(pick(3)) || [];
      const statusBreakdownRes = pick(4);
      const categoryBreakdownRes = pick(5);
      const geoBreakdownRes = pick(6);
      const ticketTypeBreakdownRes = pick(7);

      const normalizedTop = top.items || top.events || top.topEvents || top || [];

      const revenue =
        stats?.data?.revenue?.overall ??
        stats.grossSales ??
        stats.totalRevenue ??
        analyticsRes.grossSales ??
        analyticsRes.totalRevenue ??
        analyticsRes.revenue;
      const platformFees =
        stats?.data?.platformFees?.overall ??
        stats.platformFees ??
        analyticsRes.platformFees ??
        analyticsRes.feeTotal ??
        analyticsRes.platformFeeTotal;
      const gstCollected =
        stats?.data?.gstCollected?.overall ?? stats.gstCollected ?? stats.gstTotal ?? analyticsRes.gstCollected ?? analyticsRes.gstTotal;
      const refundsVal = stats?.data?.refunds?.overall ?? stats.refunds ?? analyticsRes.refunds ?? analyticsRes.refundTotal;
      const ticketsSold = stats?.data?.ticketSales?.overall ?? stats.ticketsSold ?? analyticsRes.ticketsSold;
      const avgTicketPrice = analyticsRes.averageTicketPrice ?? analyticsRes.avgTicketPrice ?? stats.avgTicketPrice;
      const successRate = stats.successRate ?? analyticsRes.successRate;

      const payoutsList = analyticsRes.payouts || stats.payouts || [];
      const refundsNumeric = typeof refundsVal === "number" ? refundsVal : Object.values(analyticsRes.refunds || {}).reduce((acc, val) => acc + (val.amountCents ?? val.amount ?? 0), 0) / 100;

      setSummary({
        grossSales: Number(revenue) || 0,
        platformFees: Number(platformFees) || 0,
        gstCollected: Number(gstCollected) || 0,
        refunds: refundsNumeric || 0,
        payoutsCompleted:
          analyticsRes.payoutsCompleted ??
          payoutsList.find?.((p) => (p.status || "").toUpperCase() === "COMPLETED")?.amount ??
          0,
        payoutsPending:
          analyticsRes.payoutsPending ??
          payoutsList.find?.((p) => (p.status || "").toUpperCase() === "PENDING")?.amount ??
          0,
        ticketsSold: Number(ticketsSold) || 0,
        avgTicketPrice: Number(avgTicketPrice) || 0,
        successRate: Number(successRate) || 0,
      });

      setAnalytics(analyticsRes);
      setRevenueTrend(normalizeTrend(trend));

      setTopEvents(
        normalizedTop.map((evt, idx) => ({
          event: evt.event || evt,
          revenue: evt.revenue ?? evt.net ?? evt.total ?? evt.amount ?? 0,
          bookings: evt.bookings ?? evt.count ?? 0,
          ticketsSold: evt.ticketsSold ?? evt.sold ?? 0,
          id: evt.eventId || evt.id || evt.event?.id || idx,
        }))
      );
      setEventOptions(
        normalizedTop.map((evt, idx) => ({
          event: evt.event || evt,
          eventId: evt.eventId || evt.id || evt.event?.id || idx,
        }))
      );
      setPayouts(analyticsRes.payouts || stats.payouts || []);
      setTransactions(analyticsRes.transactions || analyticsRes.activity || []);

      const gstData = stats.gstSplit || analyticsRes.gstSplit || [];
      setGstSplit(Array.isArray(gstData) ? gstData : []);

      setBreakdowns({
        status: normalizeBreakdown(statusBreakdownRes || analyticsRes?.breakdown?.byStatus),
        category: normalizeBreakdown(categoryBreakdownRes || analyticsRes?.breakdown?.byCategory),
        ticketType: normalizeTicketTypes(ticketTypeBreakdownRes || analyticsRes?.breakdown?.byTicketType),
        bookingStatus: normalizeBreakdown(analyticsRes?.breakdown?.byBookingStatus),
        geography: normalizeGeography(geoBreakdownRes || analyticsRes?.geography),
      });

      const categoryMix = normalizeBreakdown(categoryBreakdownRes || analyticsRes?.breakdown?.byCategory);
      setEventTypeMix(
        categoryMix.map((c, idx) => ({
          name: c.label || c.category || c.name || `Type ${idx + 1}`,
          value: c.value ?? c.percentage ?? c.total ?? 0,
          color: palette[idx % palette.length],
        }))
      );

      const refundsRaw = analyticsRes.refunds || {};
      const refundArr = Object.entries(refundsRaw || {}).map(([label, val]) => ({
        label: toTitleCase(label),
        count: val.count ?? val.value ?? 0,
        amount: (val.amountCents ?? val.amount ?? 0) / 100,
      }));
      setRefunds(refundArr);
      if (failures.length) {
        const first = failures[0]?.msg;
        setError(failures.length === results.length ? first || "Failed to load financial reporting" : `Partial load: ${first}`);
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Failed to load financial analytics", err);
      setError(err?.message || "Unable to load financial reporting");
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  const netRevenue = useMemo(
    () => Math.max(0, (summary.grossSales || 0) - (summary.platformFees || 0) - (summary.refunds || 0)),
    [summary]
  );
  const profitMargin = useMemo(
    () => (summary.grossSales ? ((netRevenue / summary.grossSales) * 100).toFixed(1) : "0.0"),
    [netRevenue, summary]
  );

  const chartTrend = useMemo(
    () =>
      (Array.isArray(revenueTrend) ? revenueTrend : []).map((row, idx) => ({
        label: row.label || row.date || `Period ${idx + 1}`,
        gross: row.revenue ?? row.amount ?? row.gross ?? row.total ?? 0,
        payouts: row.payouts ?? row.paid ?? row.settled ?? 0,
        refunds: row.refunds ?? row.refund ?? 0,
        bookings: row.bookings ?? row.count ?? 0,
      })),
    [revenueTrend]
  );

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

  const maxBooking = useMemo(() => Math.max(...chartTrend.map((t) => t.bookings || 0), 1), [chartTrend]);

  return (
    <div className="min-h-screen text-white">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <p className="text-sm text-white/60">{periodLabel}</p>
              <h1 className="text-2xl font-bold">Financial Reporting</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadFinancials}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 transition text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-red-700 transition">
              <Download className="w-4 h-4" />
              Download report
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: "day", label: "Daily" },
            { value: "week", label: "Weekly" },
            { value: "month", label: "Monthly" },
            { value: "year", label: "Yearly" },
            { value: "all", label: "All" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition border ${
                period === opt.value
                  ? "bg-white text-gray-900 border-white/80 shadow-lg"
                  : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1"
            />
            <span>→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-amber-200 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className={`${glassCard} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60">Gross sales (bookings.totalAmount)</p>
                <p className="text-3xl font-extrabold mt-2">{formatINR(summary.grossSales)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-emerald-200/70" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-emerald-300 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>vs previous period</span>
            </div>
          </div>

          <div className={`${glassCard} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60">Net revenue after fees & refunds</p>
                <p className="text-3xl font-extrabold mt-2">{formatINR(netRevenue)}</p>
              </div>
              <Wallet className="w-10 h-10 text-indigo-200/80" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-indigo-200 text-sm">
              <PieChartIcon className="w-4 h-4" />
              <span>{profitMargin}% margin</span>
            </div>
          </div>

          <div className={`${glassCard} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60">GST collected (bookings.gstTotal)</p>
                <p className="text-3xl font-extrabold mt-2">{formatINR(summary.gstCollected)}</p>
              </div>
              <Receipt className="w-10 h-10 text-sky-200/80" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-sky-200 text-sm">
              <Clock className="w-4 h-4" />
              <span>Filed monthly</span>
            </div>
          </div>

          <div className={`${glassCard} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60">Platform fees (booking_items.platformFee)</p>
                <p className="text-3xl font-extrabold mt-2">{formatINR(summary.platformFees)}</p>
              </div>
              <Banknote className="w-10 h-10 text-amber-200/80" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-amber-200 text-sm">
              <TrendingDown className="w-4 h-4" />
              <span>Fees applied</span>
            </div>
          </div>
        </div>

        {/* Mid stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatChip
            icon={<Ticket className="w-5 h-5" />}
            label="Tickets sold"
            value={`${summary.ticketsSold || 0} • avg ₹${(summary.avgTicketPrice || 0).toFixed(0)}`}
            accent="bg-emerald-500/30"
          />
          <StatChip
            icon={<ShieldCheck className="w-5 h-5" />}
            label="Booking success"
            value={`${Math.round((summary.successRate || 0) * 100)}% confirmed`}
            accent="bg-indigo-500/30"
          />
          <StatChip
            icon={<Percent className="w-5 h-5" />}
            label="Refund impact"
            value={`${(((summary.refunds || 0) / (summary.grossSales || 1)) * 100).toFixed(1)}%`}
            accent="bg-rose-500/30"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className={`${glassCard} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-white/60">Cashflow across bookings / payouts / refunds</p>
                <h3 className="text-lg font-semibold">Revenue vs Payouts</h3>
              </div>
              {loading && <Loader2 className="w-6 h-6 text-white/60 animate-spin" />}
            </div>
            <StackedBars data={chartTrend} />
            <div className="flex gap-4 mt-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-red-400" />
                Gross (bookings.totalAmount)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-400" />
                Payouts
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-cyan-400" />
                Refunds
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-white/60">Revenue contribution by event types</p>
                <h3 className="text-lg font-semibold">Event type mix</h3>
              </div>
              <PieChartIcon className="w-6 h-6 text-white/70" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="mx-auto">
                <SimplePieChart data={eventTypeMix} size={200} />
              </div>
              <div className="flex-1 space-y-3">
                {(eventTypeMix || []).map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <p className="text-sm">{item.name}</p>
                    </div>
                    <p className="text-sm text-white/70">
                      {summary.grossSales ? ((item.value / summary.grossSales) * 100).toFixed(1) : "0.0"}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* GST + payout status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${glassCard} p-6`}>
            <h3 className="text-lg font-semibold mb-4">GST & Compliance</h3>
            <div className="space-y-3">
              {(gstSplit || []).map((row, idx) => (
                <div key={row.label || idx}>
                  <div className="flex items-center justify-between text-sm text-white/70 mb-1">
                    <span>{row.label || row.name}</span>
                    <span>{formatINR(row.value)}</span>
                  </div>
                  <AnalyticsProgressBar
                    value={((row.value || 0) / (summary.gstCollected || 1)) * 100}
                    trackStyle={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                    fillStyle={{ backgroundColor: row.color || palette[idx % palette.length] }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-white/60">
              Based on bookings.gstType and gstTotal captured per ticket purchase.
            </div>
          </div>

          <div className={`${glassCard} p-6`}>
            <h3 className="text-lg font-semibold mb-4">Payout status</h3>
            <div className="space-y-3">
              {(payouts || []).map((payout, idx) => (
                <div
                  key={payout.id || idx}
                  className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{payout.id || payout.reference || "PAYOUT"}</p>
                    <p className="text-xs text-white/60">{payout.date || payout.payoutDate || ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatINR(payout.amount)}</p>
                    <p
                      className={`text-xs ${
                        (payout.status || "").toUpperCase() === "COMPLETED"
                          ? "text-emerald-300"
                          : (payout.status || "").toUpperCase() === "PROCESSING"
                          ? "text-amber-300"
                          : "text-rose-300"
                      }`}
                    >
                      {payout.status || "PENDING"}
                    </p>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <StatChip
                  icon={<Wallet className="w-4 h-4" />}
                  label="Completed"
                  value={formatINR(summary.payoutsCompleted)}
                  accent="bg-emerald-500/30"
                />
                <StatChip
                  icon={<Clock className="w-4 h-4" />}
                  label="Pending"
                  value={formatINR(summary.payoutsPending)}
                  accent="bg-amber-500/30"
                />
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-6`}>
            <h3 className="text-lg font-semibold mb-4">Top performing events</h3>
            <div className="space-y-3">
              {(topEvents || []).map((evt, idx) => (
                <div key={evt.id || evt.title || idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{evt.title || evt.name || "Event"}</p>
                    <p className="text-xs text-white/60">
                      {(evt.city || evt.location || "—") + " • " + (evt.type || evt.category || "—")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatINR(evt.net ?? evt.revenue ?? evt.total ?? 0)}</p>
                    <p className="text-xs text-white/60">{evt.sold ?? evt.ticketsSold ?? 0} tickets</p>
                  </div>
                </div>
              ))}
              {topEvents?.length === 0 && <p className="text-sm text-white/60">No events in this period.</p>}
            </div>
          </div>
        </div>

        {/* Transactions table */}
        <div className={`${glassCard} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/60">Bookings, payouts, refunds</p>
              <h3 className="text-lg font-semibold">Recent activity</h3>
            </div>
            <ShieldCheck className="w-5 h-5 text-white/70" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-white/60 border-b border-white/10">
                <tr>
                  <th className="py-3 pr-4">Ref</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Description</th>
                  <th className="py-3 pr-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(transactions || []).map((txn, idx) => (
                  <tr key={txn.id || idx} className="border-b border-white/5">
                    <td className="py-3 pr-4 font-semibold">{txn.id || txn.reference || "TXN"}</td>
                    <td className="py-3 pr-4 text-white/70">{txn.date || txn.createdAt || ""}</td>
                    <td className="py-3 pr-4 text-white/80">{txn.description || txn.note || txn.type || "—"}</td>
                    <td
                      className={`py-3 pr-4 text-right font-semibold ${
                        (txn.type || "").toLowerCase() === "credit" || (txn.amount || 0) >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {`${(txn.amount || 0) < 0 ? "-" : "+"}${formatINR(Math.abs(txn.amount || txn.total || 0))}`}
                    </td>
                  </tr>
                ))}
                {(transactions || []).length === 0 && (
                  <tr>
                    <td className="py-3 text-white/60" colSpan={4}>
                      No recent transactions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReporting;
