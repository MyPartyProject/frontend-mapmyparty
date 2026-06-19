import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Loader,
  BarChart2,
  DollarSign,
  Ticket,
  Receipt,
  BadgePercent,
  AlertCircle,
  TrendingUp,
  Users,
  ShoppingCart,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ScanLine,
  Wallet,
  PercentIcon,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import {
  fetchOffPlatformTickets,
  createOffPlatformTicket,
  updateOffPlatformTicket,
  deleteOffPlatformTicket,
} from "@/services/offPlatformService";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { downloadFile } from "@/config/api";
import { useEventAnalytics } from "@/hooks/useEventAnalytics";
import AnalyticsProgressBar from "@/components/analytics/AnalyticsProgressBar";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n || 0);

const PIE_COLORS = [
  "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444",
  "#ec4899", "#6366f1", "#14b8a6",
];

const STATUS_COLORS = {
  CONFIRMED: "text-emerald-400 bg-emerald-500/15",
  PENDING: "text-amber-400 bg-amber-500/15",
  CANCELLED: "text-red-400 bg-red-500/15",
  REFUNDED: "text-sky-400 bg-sky-500/15",
};

// ─── Skeleton Loaders ───────────────────────────────────────────────────────

const CardSkeleton = () => (
  <div className="rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4 flex items-start gap-3 animate-pulse">
    <div className="mt-0.5 p-2 rounded-lg bg-white/[0.06] w-8 h-8" />
    <div className="flex-1">
      <div className="h-3 w-16 bg-white/[0.08] rounded mb-2" />
      <div className="h-6 w-24 bg-white/[0.08] rounded" />
    </div>
  </div>
);

const SectionSkeleton = ({ rows = 3 }) => (
  <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.07] p-4 animate-pulse space-y-3">
    <div className="h-4 w-40 bg-white/[0.08] rounded" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-3 w-full bg-white/[0.05] rounded" />
    ))}
  </div>
);

const ChartSkeleton = () => (
  <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.07] p-4 animate-pulse">
    <div className="h-4 w-40 bg-white/[0.08] rounded mb-4" />
    <div className="h-48 bg-white/[0.04] rounded" />
  </div>
);

const SectionError = ({ message }) => (
  <div className="rounded-xl bg-red-500/10 ring-1 ring-red-500/20 p-4 flex items-start gap-2">
    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
    <p className="text-xs text-red-400/80">{message}</p>
  </div>
);

// ─── Metric Card ────────────────────────────────────────────────────────────

const MetricCard = ({ icon: Icon, label, value, subValue, accent }) => (
  <div className="rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4 flex items-start gap-3">
    <div className={`mt-0.5 p-2 rounded-lg ${accent} flex items-center justify-center`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[11px] uppercase tracking-widest text-white/40 mb-0.5">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
      {subValue && <p className="text-[11px] text-white/30 mt-0.5">{subValue}</p>}
    </div>
  </div>
);

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c1120] ring-1 ring-white/[0.1] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white" style={{ color: p.color }}>
          {p.name}: {p.name === "revenue" ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Progress Bar ───────────────────────────────────────────────────────────

const PROGRESS_FILL_STYLES = {
  cyan: { backgroundColor: "#06b6d4" },
  violet: { backgroundColor: "#8b5cf6" },
  emerald: { backgroundColor: "#10b981" },
  amber: { backgroundColor: "#f59e0b" },
  muted: { backgroundColor: "rgba(255, 255, 255, 0.24)" },
};

const ProgressBar = ({ value, tone = "violet" }) => (
  <AnalyticsProgressBar
    value={value}
    heightClassName="h-1.5"
    trackStyle={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
    fillStyle={PROGRESS_FILL_STYLES[tone] || PROGRESS_FILL_STYLES.violet}
  />
);

// ─── Main Page ──────────────────────────────────────────────────────────────

const EventAnalyticsPage = () => {
  const { organizerSlug, eventSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = location.state || {};
  const organizerId = stateData.organizerId;
  const eventId = stateData.eventId;
  const eventTitleFromState = stateData.eventTitle;

  const [downloading, setDownloading] = useState(false);
  const [showAllBookings, setShowAllBookings] = useState(false);

  // ── Off-Platform Tickets state ──────────────────────────────────────────
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalForm, setModalForm] = useState({
    recipientName: "",
    ticketLabel: "",
    members: 1,
    price: 0,
    checkinTime: "",
    notes: "",
  });

  const loadRecords = useCallback(async () => {
    if (!organizerId || !eventId) return;
    setLoadingRecords(true);
    try {
      const data = await fetchOffPlatformTickets(organizerId, eventId);
      setRecords(data?.items || data || []);
    } catch (err) {
      console.error("Failed to load off-platform tickets:", err);
    } finally {
      setLoadingRecords(false);
    }
  }, [organizerId, eventId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const openAddModal = () => {
    setEditingRecord(null);
    setModalForm({ recipientName: "", ticketLabel: "", members: 1, price: 0, checkinTime: "", notes: "" });
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setModalForm({
      recipientName: record.recipientName,
      ticketLabel: record.ticketLabel,
      members: record.members,
      price: record.price,
      checkinTime: record.checkinTime
        ? new Date(record.checkinTime).toISOString().slice(0, 16)
        : "",
      notes: record.notes || "",
    });
    setShowModal(true);
  };

  const handleModalSave = async () => {
    if (!modalForm.recipientName.trim() || !modalForm.ticketLabel.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...modalForm,
        members: Number(modalForm.members),
        price: Number(modalForm.price),
        checkinTime: modalForm.checkinTime || null,
        notes: modalForm.notes || null,
      };
      if (editingRecord) {
        await updateOffPlatformTicket(organizerId, eventId, editingRecord.id, payload);
      } else {
        await createOffPlatformTicket(organizerId, eventId, payload);
      }
      setShowModal(false);
      await loadRecords();
    } catch (err) {
      console.error("Failed to save off-platform ticket:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete record for "${record.recipientName}"?`)) return;
    try {
      await deleteOffPlatformTicket(organizerId, eventId, record.id);
      await loadRecords();
    } catch (err) {
      console.error("Failed to delete off-platform ticket:", err);
    }
  };

  const handleMarkCheckedIn = async (record) => {
    try {
      await updateOffPlatformTicket(organizerId, eventId, record.id, {
        checkinTime: new Date().toISOString(),
      });
      await loadRecords();
    } catch (err) {
      console.error("Failed to mark checked in:", err);
    }
  };

  const offPlatformTotals = records.reduce(
    (acc, r) => ({
      count: acc.count + 1,
      members: acc.members + (r.members || 0),
      revenue: acc.revenue + (r.price || 0),
    }),
    { count: 0, members: 0, revenue: 0 }
  );

  const {
    summary,
    ticketBreakdown,
    salesTimeline,
    revenueBreakdown,
    bookingStats,
    checkinStats,
    refetch,
  } = useEventAnalytics(organizerId, eventId);

  if (!organizerId || !eventId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Missing event or organizer information.</p>
          <p className="text-xs text-muted-foreground mt-1">Please navigate from My Events.</p>
        </div>
      </div>
    );
  }

  const handleDownloadCSV = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadFile(
        `/api/organizer/${organizerId}/events/${eventId}/analytics/export`,
        `analytics-${eventSlug || eventId}.csv`
      );
    } catch (err) {
      console.error("CSV download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const s = summary.data || {};
  const tickets = ticketBreakdown.data || [];
  const timeline = salesTimeline.data || [];
  const revenue = revenueBreakdown.data || {};
  const bookings = bookingStats.data || {};
  const checkins = checkinStats.data || {};

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-0.5">
                Event Analytics
              </p>
              <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-violet-400" />
                {summary.data?.eventTitle || eventTitleFromState || eventSlug || "Event"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Refresh all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-primaryCTA hover:bg-primaryCTA-hover active:bg-primaryCTA-active text-primary-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Download CSV
            </button>
          </div>
        </div>

        {/* ── Summary Cards (first to load) ────────────────────────────── */}
        {summary.loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : summary.error ? (
          <SectionError message={summary.error} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              icon={Ticket}
              label="Tickets Sold"
              value={s.totalTicketsSold ?? 0}
              subValue={`${s.sellThroughRate ?? 0}% of ${s.totalCapacity ?? 0} capacity`}
              accent="bg-violet-500/15 text-violet-400"
            />
            <MetricCard
              icon={DollarSign}
              label="Total Revenue"
              value={fmt(s.totalRevenue)}
              accent="bg-emerald-500/15 text-emerald-400"
            />
            <MetricCard
              icon={Wallet}
              label="Net Payout"
              value={fmt(s.netPayout)}
              accent="bg-teal-500/15 text-teal-400"
            />
            <MetricCard
              icon={ShoppingCart}
              label="Total Bookings"
              value={s.totalBookings ?? 0}
              subValue={s.averageOrderValue ? `Avg: ${fmt(s.averageOrderValue)}` : undefined}
              accent="bg-indigo-500/15 text-indigo-400"
            />
            <MetricCard
              icon={Receipt}
              label="Platform Fees"
              value={fmt(s.totalPlatformFees)}
              accent="bg-sky-500/15 text-sky-400"
            />
            <MetricCard
              icon={BadgePercent}
              label="GST Collected"
              value={fmt(s.totalGST)}
              accent="bg-amber-500/15 text-amber-400"
            />
            <MetricCard
              icon={PercentIcon}
              label="Sell-through"
              value={`${s.sellThroughRate ?? 0}%`}
              accent="bg-pink-500/15 text-pink-400"
            />
            <MetricCard
              icon={TrendingUp}
              label="Avg Order"
              value={fmt(s.averageOrderValue)}
              accent="bg-orange-500/15 text-orange-400"
            />
          </div>
        )}

        {/* ── Sales Timeline Chart ─────────────────────────────────────── */}
        {salesTimeline.loading ? (
          <ChartSkeleton />
        ) : salesTimeline.error ? (
          <SectionError message={salesTimeline.error} />
        ) : timeline.length > 0 ? (
          <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.07] p-4">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              Sales Timeline
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ticketsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="revenue" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="tickets" orientation="right" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#revenueGrad)" strokeWidth={2} />
                <Area yAxisId="tickets" type="monotone" dataKey="tickets" stroke="#06b6d4" fill="url(#ticketsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {/* ── Revenue Breakdown + Check-in Stats (side by side) ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Pie Chart */}
          {revenueBreakdown.loading ? (
            <ChartSkeleton />
          ) : revenueBreakdown.error ? (
            <SectionError message={revenueBreakdown.error} />
          ) : revenue.byTicketType?.length > 0 ? (
            <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.07] p-4">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Revenue by Ticket Type
              </h2>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={revenue.byTicketType}
                      dataKey="revenue"
                      nameKey="ticketName"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {revenue.byTicketType.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => fmt(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {revenue.byTicketType.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-white/70 truncate max-w-[120px]">{t.ticketName}</span>
                      </div>
                      <span className="text-white/50">{t.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Fee breakdown */}
              {revenue.feeBreakdown && (
                <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-white/30">Gross</p>
                    <p className="text-white font-medium">{fmt(revenue.feeBreakdown.grossRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-white/30">Fees + GST</p>
                    <p className="text-red-400 font-medium">-{fmt(revenue.feeBreakdown.platformFees + revenue.feeBreakdown.gst)}</p>
                  </div>
                  <div>
                    <p className="text-white/30">Net Payout</p>
                    <p className="text-emerald-400 font-medium">{fmt(revenue.feeBreakdown.netPayout)}</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Check-in Stats */}
          {checkinStats.loading ? (
            <SectionSkeleton rows={4} />
          ) : checkinStats.error ? (
            <SectionError message={checkinStats.error} />
          ) : checkins.totalItems > 0 ? (
            <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.07] p-4">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-cyan-400" />
                Check-in Progress
              </h2>
              {/* Overall progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-white/50">
                    {checkins.checkedIn} / {checkins.totalItems} checked in
                  </span>
                  <span className="text-cyan-400 font-medium">{checkins.checkInRate}%</span>
                </div>
                <ProgressBar value={checkins.checkInRate} tone="cyan" />
              </div>
              {/* Per ticket */}
              <div className="space-y-3">
                {checkins.perTicket?.map((t, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/70 truncate max-w-[180px]">{t.ticketName}</span>
                      <span className="text-white/40">{t.checkedIn}/{t.total} ({t.checkInRate}%)</span>
                    </div>
                    <ProgressBar value={t.checkInRate} tone="violet" />
                  </div>
                ))}
              </div>
            </div>
          ) : checkins && !checkinStats.loading ? (
            <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.07] p-4 flex items-center justify-center">
              <p className="text-xs text-white/30">No check-in data yet</p>
            </div>
          ) : null}
        </div>

        {/* ── Ticket Breakdown Table (enriched) ────────────────────────── */}
        {ticketBreakdown.loading ? (
          <SectionSkeleton rows={5} />
        ) : ticketBreakdown.error ? (
          <SectionError message={ticketBreakdown.error} />
        ) : (
          <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.07] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Ticket className="w-4 h-4 text-violet-400" />
                Ticket Performance
              </h2>
            </div>

            {tickets.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-white/40">
                No tickets configured for this event.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Ticket", "Type", "Price", "Sold / Total", "Sell-through", "Revenue", "GST", "Platform Fee", "Net Payout"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium text-white/40 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((row, i) => (
                      <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-white/90">{row.ticketName}</td>
                        <td className="px-4 py-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-white/50">
                            {row.ticketType?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/70">{fmt(row.price)}</td>
                        <td className="px-4 py-3 text-white/70">
                          {row.soldQty} / {row.totalQty}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16">
                              <ProgressBar value={row.sellThroughRate} tone={row.sellThroughRate > 80 ? "emerald" : row.sellThroughRate > 50 ? "amber" : "muted"} />
                            </div>
                            <span className="text-white/50">{row.sellThroughRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-emerald-400">{fmt(row.revenue)}</td>
                        <td className="px-4 py-3 text-amber-400">{fmt(row.gst)}</td>
                        <td className="px-4 py-3 text-sky-400">{fmt(row.platformFee)}</td>
                        <td className="px-4 py-3 font-medium text-white">{fmt(row.netPayout)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {tickets.length > 1 && summary.data && (
                    <tfoot>
                      <tr className="border-t border-white/[0.1] bg-white/[0.02]">
                        <td className="px-4 py-3 font-semibold text-white/60 uppercase tracking-widest text-[10px]" colSpan={3}>Total</td>
                        <td className="px-4 py-3 font-semibold text-white">
                          {s.totalTicketsSold} / {s.totalCapacity}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">{s.sellThroughRate}%</td>
                        <td className="px-4 py-3 font-semibold text-emerald-400">{fmt(s.totalRevenue)}</td>
                        <td className="px-4 py-3 font-semibold text-amber-400">{fmt(s.totalGST)}</td>
                        <td className="px-4 py-3 font-semibold text-sky-400">{fmt(s.totalPlatformFees)}</td>
                        <td className="px-4 py-3 font-semibold text-white">{fmt(s.netPayout)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Booking Stats ────────────────────────────────────────────── */}
        {bookingStats.loading ? (
          <SectionSkeleton rows={4} />
        ) : bookingStats.error ? (
          <SectionError message={bookingStats.error} />
        ) : bookings.totalBookings > 0 ? (
          <div className="space-y-4">
            {/* Booking Status Distribution */}
            <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.07] p-4">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-400" />
                Booking Status
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(bookings.statusBreakdown || {}).map(([status, data]) => {
                  const colorClass = STATUS_COLORS[status] || "text-white/50 bg-white/[0.06]";
                  const icon = status === "CONFIRMED" ? CheckCircle2 : status === "PENDING" ? Clock : status === "CANCELLED" ? XCircle : RefreshCw;
                  const Icon = icon;
                  return (
                    <div key={status} className="rounded-lg bg-white/[0.03] ring-1 ring-white/[0.05] p-3 text-center">
                      <Icon className={`w-4 h-4 mx-auto mb-1 ${colorClass.split(" ")[0]}`} />
                      <p className="text-lg font-semibold text-white">{data.count}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/40">{status}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{fmt(data.revenue)}</p>
                    </div>
                  );
                })}
              </div>
              {bookings.refunds?.count > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-white/40">Refunds processed</span>
                  <span className="text-red-400">{bookings.refunds.count} ({fmt(bookings.refunds.totalAmount)})</span>
                </div>
              )}
            </div>

            {/* Recent Bookings */}
            {bookings.recentBookings?.length > 0 && (
              <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.07] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Recent Bookings
                  </h2>
                  {bookings.recentBookings.length > 5 && (
                    <button
                      onClick={() => setShowAllBookings(!showAllBookings)}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                    >
                      {showAllBookings ? "Show less" : "Show all"}
                      {showAllBookings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["Customer", "Tickets", "Amount", "Status", "Date"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left font-medium text-white/40 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(showAllBookings ? bookings.recentBookings : bookings.recentBookings.slice(0, 5)).map((b) => (
                        <tr key={b.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-white/90 font-medium">{b.customerName}</p>
                            <p className="text-white/30 text-[10px]">{b.customerEmail}</p>
                          </td>
                          <td className="px-4 py-3 text-white/70">
                            {b.tickets.map((t, i) => (
                              <span key={i}>{t.quantity}x {t.name}{i < b.tickets.length - 1 ? ", " : ""}</span>
                            ))}
                          </td>
                          <td className="px-4 py-3 text-emerald-400">{fmt(b.amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_COLORS[b.status] || "bg-white/[0.06] text-white/50"}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/50">
                            {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* ── Off-Platform Tickets ──────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] pt-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-400" />
              Off-Platform Tickets
            </h2>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primaryCTA hover:bg-primaryCTA-hover active:bg-primaryCTA-active text-primary-foreground transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Record
            </button>
          </div>

          {/* Summary strip */}
          {records.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/[0.04] ring-1 ring-white/[0.07] p-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Records</p>
                <p className="text-lg font-semibold text-white">{offPlatformTotals.count}</p>
              </div>
              <div className="rounded-lg bg-white/[0.04] ring-1 ring-white/[0.07] p-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Total Members</p>
                <p className="text-lg font-semibold text-white">{offPlatformTotals.members}</p>
              </div>
              <div className="rounded-lg bg-white/[0.04] ring-1 ring-white/[0.07] p-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Total Revenue</p>
                <p className="text-lg font-semibold text-amber-400">{fmt(offPlatformTotals.revenue)}</p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.07] overflow-hidden">
            {loadingRecords ? (
              <div className="p-6 text-center">
                <Loader className="w-4 h-4 animate-spin text-white/30 mx-auto" />
              </div>
            ) : records.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-white/40">
                No off-platform tickets recorded yet. Click "Add Record" to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Recipient", "Ticket Label", "Members", "Price", "Check-in Time", "Notes", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium text-white/40 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-white/90">{r.recipientName}</td>
                        <td className="px-4 py-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400">
                            {r.ticketLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/70">{r.members}</td>
                        <td className="px-4 py-3 text-emerald-400">{fmt(r.price)}</td>
                        <td className="px-4 py-3">
                          {r.checkinTime ? (
                            <span className="text-cyan-400">
                              {new Date(r.checkinTime).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMarkCheckedIn(r)}
                              className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors whitespace-nowrap"
                            >
                              Mark Checked In
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white/40 max-w-[140px] truncate">{r.notes || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(r)}
                              className="p-1 rounded text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(r)}
                              className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* ── Off-Platform Ticket Modal ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0c1120] ring-1 ring-white/[0.1] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <h3 className="text-sm font-semibold text-white">
                {editingRecord ? "Edit Record" : "Add Off-Platform Ticket"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Recipient Name *</label>
                <input
                  type="text"
                  value={modalForm.recipientName}
                  onChange={(e) => setModalForm((f) => ({ ...f, recipientName: e.target.value }))}
                  className="w-full bg-white/[0.05] ring-1 ring-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-violet-500"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Ticket Label *</label>
                <input
                  type="text"
                  value={modalForm.ticketLabel}
                  onChange={(e) => setModalForm((f) => ({ ...f, ticketLabel: e.target.value }))}
                  className="w-full bg-white/[0.05] ring-1 ring-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-violet-500"
                  placeholder="e.g. VIP, General, Backstage"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Members *</label>
                  <input
                    type="number"
                    min={1}
                    value={modalForm.members}
                    onChange={(e) => setModalForm((f) => ({ ...f, members: e.target.value }))}
                    className="w-full bg-white/[0.05] ring-1 ring-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={modalForm.price}
                    onChange={(e) => setModalForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full bg-white/[0.05] ring-1 ring-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Check-in Time (optional)</label>
                <input
                  type="datetime-local"
                  value={modalForm.checkinTime}
                  onChange={(e) => setModalForm((f) => ({ ...f, checkinTime: e.target.value }))}
                  className="w-full bg-white/[0.05] ring-1 ring-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">Notes (optional)</label>
                <textarea
                  value={modalForm.notes}
                  onChange={(e) => setModalForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-white/[0.05] ring-1 ring-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-violet-500 resize-none"
                  placeholder="Any notes about this ticket..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.07]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-white/50 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={saving || !modalForm.recipientName.trim() || !modalForm.ticketLabel.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primaryCTA hover:bg-primaryCTA-hover active:bg-primaryCTA-active text-primary-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving && <Loader className="w-3.5 h-3.5 animate-spin" />}
                {editingRecord ? "Save Changes" : "Add Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAnalyticsPage;
