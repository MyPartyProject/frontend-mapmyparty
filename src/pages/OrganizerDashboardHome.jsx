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
import ThemeToggle from "@/components/ThemeToggle";

const OrganizerDashboardHome = ({ user, handleLogout, setActiveTab, activeTab }) => {
  const { statistics } = useOrganizerEvents();
  const { analytics, loading: analyticsLoading, error: analyticsError } = useOrganizerAnalytics("month");
  const { bookings: recentBookings, loading: bookingsLoading } = useRecentBookings(5);

  const analyticsTotals = useMemo(() => {
    const byStatus = analytics?.breakdown?.byStatus || {};
    const byTicketType = analytics?.breakdown?.byTicketType || {};
    const byBookingStatus = analytics?.breakdown?.byBookingStatus || {};
    const ticketsSold = Object.values(byTicketType).reduce(
      (sum, item) => sum + (Number(item?.ticketsSold) || 0),
      0
    );

    const bookingsCount = Object.values(byBookingStatus).reduce(
      (sum, count) => sum + (Number(count) || 0),
      0
    );

    return {
      liveEvents:
        (Number(byStatus.PUBLISHED) || 0) +
        (Number(byStatus.ACTIVE) || 0) +
        (Number(byStatus.LIVE) || 0),
      draftEvents: Number(byStatus.DRAFT) || 0,
      attendees: ticketsSold || bookingsCount || 0,
      ticketsSold,
      revenue: analytics?.sales?.netTicketSales ?? null,
    };
  }, [analytics]);

  const totals = useMemo(
    () => ({
      totalAttendees: analyticsTotals.attendees || statistics.totalAttendees || 0,
      totalRevenue: analyticsTotals.revenue,
      totalTickets: analyticsTotals.ticketsSold || statistics.totalTicketsSold || 0,
      published: analyticsTotals.liveEvents || statistics.publishedEvents || 0,
      drafts: analyticsTotals.draftEvents || statistics.draftEvents || 0,
    }),
    [analyticsTotals, statistics]
  );

  const formatNumber = (n) => new Intl.NumberFormat("en-IN").format(n || 0);
  const formatCurrency = (n) => n == null ? "Unavailable" : `INR ${new Intl.NumberFormat("en-IN").format(n || 0)}`;

  const kpis = [
    { label: "Live Events", value: formatNumber(totals.published), hint: `${totals.drafts} drafts`, icon: Sparkles },
    { label: "Attendees", value: formatNumber(totals.totalAttendees), hint: "Total attendees", icon: Users },
    { label: "Tickets Sold", value: formatNumber(totals.totalTickets), hint: "All time", icon: Ticket },
    { label: "Net ticket sales", value: formatCurrency(totals.totalRevenue), hint: "This month · India time · after ticket refunds", icon: IndianRupee },
    { label: "Gross ticket sales", value: formatCurrency(analytics?.sales?.grossTicketSales), hint: "This month, before refunds", icon: IndianRupee },
    { label: "Ticket refunds", value: formatCurrency(analytics?.sales?.processedTicketRefunds), hint: "Refunds of this month’s sales", icon: IndianRupee },
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
    <div className="organizer-overview text-foreground">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Organizer Portal</p>
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight mt-1">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-1">Essential control center for events, revenue, and ops.</p>
          </div>
          <div className="organizer-header-actions flex items-center gap-2.5 flex-wrap">
            <ThemeToggle className="h-10 rounded-full px-3 text-xs" />
            <Link
              to="/organizer/select-event-type"
              className="inline-flex min-h-10 items-center px-4 py-2 rounded-full cta-primary bg-primaryCTA text-primary-foreground text-xs font-semibold hover:bg-primaryCTA-hover active:bg-primaryCTA-active transition"
            >
              + Create Event
            </Link>
            <button
              onClick={() => setActiveTab?.("myevents")}
              className="min-h-10 px-4 py-2 rounded-full bg-card border border-border text-xs font-medium hover:bg-muted transition text-foreground"
            >
              Manage Events
            </button>
          </div>
        </header>

        <section aria-label="Key performance metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {kpis.map((item) => (
            <div
              key={item.label}
              className="organizer-metric min-w-0 bg-card border border-border rounded-[14px] p-4 flex flex-col gap-2 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {item.label}
                </p>
                <div className="organizer-metric-icon shrink-0 p-1.5 rounded-full bg-primary/15 border border-primary/20">
                  <item.icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="min-w-0 flex items-center">
                <p
                  className="max-w-full break-words [overflow-wrap:anywhere] text-2xl leading-tight font-bold tracking-tight tabular-nums"
                  title={item.value}
                >
                  {item.value}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[11.5px] leading-relaxed text-muted-foreground" title={item.hint}>
                  {item.hint}
                </p>
              </div>
            </div>
          ))}
        </section>

        <OrganizerAnalyticsSnapshot
          analytics={analytics}
          loading={analyticsLoading}
          error={analyticsError}
        />

        <section aria-label="Recent bookings" className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-border">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent bookings</p>
              <h2 className="text-base font-semibold mt-1">Latest ticket actions</h2>
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
            <div className="overflow-x-auto" role="region" aria-label="Recent bookings table" tabIndex={0}>
              <table className="w-full min-w-[680px]">
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
                          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-semibold text-accent light:text-accent-foreground">
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
        </section>
      </div>
    </div>
  );
};

export default OrganizerDashboardHome;
