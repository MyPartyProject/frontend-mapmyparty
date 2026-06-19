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
  const { data, dashboardLoading } = useOutletContext();
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
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Dashboard Overview</CardTitle>
            <CardDescription className="text-muted-foreground">
              Platform health, operational queues, and promoter actions that need attention.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={summaryLoading}>
            <RefreshCw className={`h-4 w-4 ${summaryLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {dashboardLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
              Loading dashboard data...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.stats.map((item) => (
                <Card key={item.title} className="bg-background/70 border-border/60">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                      <p className="mt-1 text-xs text-emerald-500">{item.delta}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60">
                      <item.icon className="h-6 w-6 text-foreground/80" />
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
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accent/80"
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
