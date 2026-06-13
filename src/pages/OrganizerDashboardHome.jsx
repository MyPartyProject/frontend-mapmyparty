import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Ticket,
  IndianRupee,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import { useOrganizerAnalytics } from "@/hooks/useOrganizerAnalytics";
import { useRecentBookings } from "@/hooks/useRecentBookings";
import OrganizerAnalyticsSnapshot from "@/components/organizer/OrganizerAnalyticsSnapshot";

const OrganizerDashboardHome = ({ user, handleLogout, setActiveTab, activeTab }) => {
  const { statistics } = useOrganizerEvents();
  const { analytics, loading: analyticsLoading, error: analyticsError } = useOrganizerAnalytics("month");
  const { bookings: recentBookings, loading: bookingsLoading } = useRecentBookings(5);

  const analyticsTotals = useMemo(() => {
    const byStatus = analytics?.breakdown?.byStatus || {};
    const byTicketType = analytics?.breakdown?.byTicketType || {};
    const byBookingStatus = analytics?.breakdown?.byBookingStatus || {};
    const revenueTrend = analytics?.trends?.revenue || [];
    const topEvents = analytics?.topEvents || [];
    const tours = analytics?.tours || {};

    const ticketsSold = Object.values(byTicketType).reduce(
      (sum, item) => sum + (Number(item?.ticketsSold) || 0),
      0
    );

    const bookingsCount = Object.values(byBookingStatus).reduce(
      (sum, count) => sum + (Number(count) || 0),
      0
    );

    const revenueFromTrend = revenueTrend.reduce(
      (sum, item) => sum + (Number(item?.amount) || 0),
      0
    );

    const revenueFromTopEvents = topEvents.reduce(
      (sum, item) => sum + (Number(item?.revenue) || 0),
      0
    );

    const revenueFromTours =
      (Number(tours?.tourVsStandalone?.tourRevenue) || Number(tours?.revenue) || 0) +
      (Number(tours?.tourVsStandalone?.standaloneRevenue) || Number(tours?.standaloneRevenue) || 0);

    return {
      liveEvents:
        (Number(byStatus.PUBLISHED) || 0) +
        (Number(byStatus.ACTIVE) || 0) +
        (Number(byStatus.LIVE) || 0),
      draftEvents: Number(byStatus.DRAFT) || 0,
      attendees: ticketsSold || bookingsCount || 0,
      ticketsSold,
      revenue: revenueFromTrend || revenueFromTopEvents || revenueFromTours || 0,
    };
  }, [analytics]);

  const totals = useMemo(
    () => ({
      totalAttendees: analyticsTotals.attendees || statistics.totalAttendees || 0,
      totalRevenue: analyticsTotals.revenue || statistics.totalRevenue || 0,
      totalTickets: analyticsTotals.ticketsSold || statistics.totalTicketsSold || 0,
      published: analyticsTotals.liveEvents || statistics.publishedEvents || 0,
      drafts: analyticsTotals.draftEvents || statistics.draftEvents || 0,
    }),
    [analyticsTotals, statistics]
  );

  const formatNumber = (n) => new Intl.NumberFormat("en-IN").format(n || 0);
  const formatCurrency = (n) => `INR ${new Intl.NumberFormat("en-IN").format(n || 0)}`;

  const kpis = [
    { label: "Live Events", value: formatNumber(totals.published), hint: `${totals.drafts} drafts`, icon: Sparkles },
    { label: "Attendees", value: formatNumber(totals.totalAttendees), hint: "Total attendees", icon: Users },
    { label: "Revenue", value: formatCurrency(totals.totalRevenue), hint: "Total revenue", icon: IndianRupee },
    { label: "Tickets Sold", value: formatNumber(totals.totalTickets), hint: "All time", icon: Ticket },
  ];

  const formatDate = (iso) => {
    if (!iso) return "TBA";
    try {
      const parsed = new Date(iso);
      if (Number.isNaN(parsed.getTime())) return "TBA";
      return parsed.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "TBA";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Organizer Portal</p>
            <h2 className="text-3xl font-bold mt-1">Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">Essential control center for events, revenue, and ops.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/organizer/select-event-type"
              className="px-4 py-2 rounded-lg bg-primaryCTA text-primary-foreground text-sm font-semibold hover:bg-primaryCTA-hover active:bg-primaryCTA-active transition"
            >
              + Create Event
            </Link>
            <button
              onClick={() => setActiveTab?.("myevents")}
              className="px-3 py-2 rounded-lg bg-card border border-border text-sm hover:bg-muted transition text-foreground"
            >
              Manage Events
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((item) => (
            <div
              key={item.label}
              className="min-h-[8.75rem] bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)] flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-xs uppercase tracking-wide text-muted-foreground truncate">
                  {item.label}
                </p>
                <div className="shrink-0 p-2 rounded-lg bg-primary/15 border border-primary/20">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
              </div>

              <div className="min-h-[2.75rem] min-w-0 flex items-center">
                <p
                  className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.5rem,2vw,2.2rem)] leading-none font-semibold tabular-nums"
                  title={item.value}
                >
                  {item.value}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground truncate" title={item.hint}>
                  {item.hint}
                </p>
              </div>
            </div>
          ))}
        </div>

        <OrganizerAnalyticsSnapshot
          analytics={analytics}
          loading={analyticsLoading}
          error={analyticsError}
        />

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recent bookings</p>
              <h3 className="text-lg font-semibold">Latest ticket actions</h3>
            </div>
            <button
              onClick={() => setActiveTab?.("myevents")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              View all
            </button>
          </div>
          {bookingsLoading ? (
            <div className="px-5 py-12 text-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading bookings...</p>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground">
              <Ticket className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No recent bookings</p>
              <p className="text-xs mt-1">Bookings will appear here when customers purchase tickets</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Booking #</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-background transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-semibold text-accent">
                            {(booking.user?.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{booking.user?.name || "Guest"}</p>
                            <p className="text-xs text-muted-foreground">{booking.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium">{booking.event?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.event?.startDate ? formatDate(booking.event.startDate) : "TBA"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-muted-foreground">#{booking.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">{formatCurrency(booking.totalAmount || booking.payment?.amount || 0)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-muted-foreground">{formatDate(booking.createdAt)}</p>
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
  );
};

export default OrganizerDashboardHome;
