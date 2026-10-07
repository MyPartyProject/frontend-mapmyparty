import { useState } from "react";
import { dashboardMonths } from "@/hooks/usePromoterDashboard";
import { Link, useOutletContext } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarClock,
  CreditCard,
  LifeBuoy,
  RefreshCw,
  ShieldAlert,
  Users,
  Wallet2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminTaskSummary } from "@/hooks/useAdminTaskSummary";

const PromoterOverview = () => {
  const { data, dashboardLoading, dashboardError, refreshDashboard, filter, applyFilter, dashboard } = useOutletContext();
  const months = dashboardMonths();
  const [startDate, setStartDate] = useState(filter.startDate || "");
  const [endDate, setEndDate] = useState(filter.endDate || "");
  const [dateError, setDateError] = useState("");
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  const applyCustom = event => {
    event.preventDefault();
    if (!startDate || !endDate || startDate > endDate || endDate > today) {
      setDateError("Choose both dates, with start on or before end and end no later than today.");
      return;
    }
    setDateError("");
    applyFilter({ startDate, endDate });
  };
  const displayDate = value => new Date(value + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const { summary, loading: summaryLoading, error: summaryError, refresh } = useAdminTaskSummary();

  const tasks = [
    {
      title: "Pending event reviews",
      value: summary?.moderation?.pendingEvents || 0,
      description: "Events waiting for promoter approval.",
      to: "/promoter/events",
      icon: CalendarClock,
    },
    {
      title: "Refund requests",
      value: summary?.refunds?.requested || 0,
      description: "Refunds needing a decision or processing.",
      to: "/promoter/reports",
      icon: CreditCard,
    },
    {
      title: "Failed payouts",
      value: summary?.payouts?.failed || 0,
      description: "Settlement failures that need intervention.",
      to: "/promoter/payouts",
      icon: Wallet2,
    },
    {
      title: "Unverified organizers",
      value: summary?.compliance?.unverifiedOrganizers || 0,
      description: "Organizer accounts still pending trust review.",
      to: "/promoter/organizers",
      icon: Building2,
    },
    {
      title: "Suspended users",
      value: summary?.compliance?.suspendedUsers || 0,
      description: "Accounts currently blocked by admin action.",
      to: "/promoter/users",
      icon: Users,
    },
    {
      title: "Bank reviews pending",
      value: summary?.compliance?.pendingBankReview || 0,
      description: "Bank records blocking payout readiness.",
      to: "/promoter/billing",
      icon: ShieldAlert,
    },
    {
      title: "Unassigned support tickets",
      value: summary?.support?.unassigned || 0,
      description: "New support work waiting for staff assignment.",
      to: "/promoter/support",
      icon: LifeBuoy,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-card/70 border-border/60">
        <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <CardTitle className="text-xl">Dashboard Overview</CardTitle>
            <CardDescription className="text-muted-foreground">
              Platform health, operational queues, and promoter actions that need attention.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => { refreshDashboard(); refresh(); }} disabled={summaryLoading || dashboardLoading}>
            <RefreshCw className={`h-4 w-4 ${summaryLoading || dashboardLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-end gap-x-4 gap-y-3">
            <label className="flex flex-col gap-1 text-xs font-medium">
              Month
              <select value={filter.month || ""} onChange={event => {
                const value = event.target.value;
                setDateError("");
                applyFilter({ month: value });
              }} className="h-8 w-52 max-w-full rounded-md border border-input bg-background px-2 text-xs text-foreground">
                {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                {!filter.month && <option value="" disabled>Select a month</option>}
              </select>
            </label>
          <form onSubmit={applyCustom} className="min-w-0">
            <fieldset>
              <legend className="mb-1 text-xs font-medium">Custom date range</legend>
              <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs font-medium">
                <span className="sr-only">Start date</span>
                <input aria-label="Start date" type="date" required value={startDate} max={endDate || today} onChange={event => setStartDate(event.target.value)} className="h-8 w-32 min-w-0 rounded-md border border-input bg-background px-2 text-xs text-foreground [color-scheme:dark] light:[color-scheme:light]" />
              </label>
              <span aria-hidden="true" className="self-center text-xs text-muted-foreground">–</span>
              <label className="flex flex-col gap-1 text-xs font-medium">
                <span className="sr-only">End date</span>
                <input aria-label="End date" type="date" required value={endDate} min={startDate || undefined} max={today} onChange={event => setEndDate(event.target.value)} className="h-8 w-32 min-w-0 rounded-md border border-input bg-background px-2 text-xs text-foreground [color-scheme:dark] light:[color-scheme:light]" />
              </label>
              <Button type="submit" size="sm" className="h-8 px-2 text-xs">Apply</Button>
            </div>
            </fieldset>
          </form>
          </div>
          {dateError && <p role="alert" className="mb-3 text-sm text-destructive">{dateError}</p>}
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Applied: {dashboard?.period
              ? `${displayDate(dashboard.period.startDate)} – ${displayDate(dashboard.period.endDate)}`
              : filter.month ? months.find(month => month.value === filter.month)?.label || filter.month
                : `${displayDate(filter.startDate)} – ${displayDate(filter.endDate)}`} · Asia/Kolkata
          </p>
          {dashboardError ? <p role="alert" className="py-6 text-destructive">{dashboardError}</p> : dashboardLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
              Loading dashboard data...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.stats.map((item) => (
                <Card key={item.title} className="bg-background/70 border-border/60">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <p className="mt-1 break-words text-lg font-semibold tabular-nums">{item.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.delta}</p>
                    </div>
                    <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                      <item.icon className="h-[18px] w-[18px] text-foreground/80" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {summaryError && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Task summary unavailable</p>
              <p className="text-sm text-destructive/80">{summaryError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="text-lg font-semibold">Operational queues <span className="text-sm font-normal text-muted-foreground">Current · All dates</span></h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {tasks.map((task) => (
          <Card key={task.title} className="bg-card/70 border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <task.icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{task.title}</CardTitle>
                </div>
                <Badge variant="outline" className="border-border/60">
                  {summaryLoading ? "..." : task.value}
                </Badge>
              </div>
              <CardDescription className="text-muted-foreground">{task.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to={task.to}
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accent/80 light:text-accent-foreground light:hover:text-accent-foreground/80"
              >
                Open queue <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PromoterOverview;
