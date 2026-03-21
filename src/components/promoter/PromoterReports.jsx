import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  FileText,
  Loader,
  RefreshCw,
  Search,
  Shield,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminRefunds } from "@/hooks/useAdminRefunds";
import { useAdminAuditLogs } from "@/hooks/useAdminAuditLogs";
import { updateAdminRefundStatus } from "@/services/adminService";

const refundStatuses = ["ALL", "REQUESTED", "APPROVED", "DECLINED", "PROCESSED", "FAILED"];
const auditTypes = ["ALL", "users", "event_organizer", "events", "payouts", "refunds", "bank_details"];

const PromoterReports = () => {
  const {
    items: refunds,
    statistics: refundStats,
    filters: refundFilters,
    loading: refundsLoading,
    isFetching: refundsFetching,
    error: refundsError,
    updateFilters: updateRefundFilters,
    refresh: refreshRefunds,
  } = useAdminRefunds();
  const {
    items: auditLogs,
    filters: auditFilters,
    loading: auditLoading,
    isFetching: auditFetching,
    error: auditError,
    updateFilters: updateAuditFilters,
    refresh: refreshAudit,
  } = useAdminAuditLogs();
  const [refundDrafts, setRefundDrafts] = useState({});
  const [updatingRefundId, setUpdatingRefundId] = useState(null);

  const refundSummary = useMemo(() => {
    const base = { count: 0, amount: 0, failedCount: 0 };
    refundStats.forEach((item) => {
      base.count += Number(item?._count?.id || 0);
      base.amount += Number(item?._sum?.amountCents || 0);
      if (item.status === "FAILED") {
        base.failedCount = Number(item?._count?.id || 0);
      }
    });
    return base;
  }, [refundStats]);

  const handleRefundUpdate = async (refundId) => {
    const draft = refundDrafts[refundId];
    if (!draft?.status) {
      toast.error("Choose a refund status first.");
      return;
    }

    setUpdatingRefundId(refundId);
    try {
      await updateAdminRefundStatus(refundId, {
        status: draft.status,
        reason: draft.reason || "",
      });
      toast.success("Refund updated.");
      refreshRefunds();
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update refund.");
    } finally {
      setUpdatingRefundId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Reports & Audit</h2>
          <p className="text-muted-foreground">Refund operations and promoter audit history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshRefunds} disabled={refundsFetching}>
            <RefreshCw className={`h-4 w-4 ${refundsFetching ? "animate-spin" : ""}`} />
            Refunds
          </Button>
          <Button variant="outline" size="sm" onClick={refreshAudit} disabled={auditFetching}>
            <RefreshCw className={`h-4 w-4 ${auditFetching ? "animate-spin" : ""}`} />
            Audit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/70 border-border/60"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Refund queue</p><p className="mt-1 text-2xl font-semibold">{refundSummary.count}</p></CardContent></Card>
        <Card className="bg-card/70 border-border/60"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Refund volume</p><p className="mt-1 text-2xl font-semibold">{(refundSummary.amount / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</p></CardContent></Card>
        <Card className="bg-card/70 border-border/60"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Failed refunds</p><p className="mt-1 text-2xl font-semibold text-destructive">{refundSummary.failedCount}</p></CardContent></Card>
      </div>

      <Card className="bg-card/70 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Undo2 className="h-4 w-4" />
            Refund operations
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Review refund requests and resolve failures from one queue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search refund, booking, event, user..."
                value={refundFilters.search}
                onChange={(event) => updateRefundFilters({ search: event.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {refundStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateRefundFilters({ status })}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    refundFilters.status === status
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-card/70 text-muted-foreground hover:bg-card"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {refundsError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {refundsError}
            </div>
          )}

          {refundsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : refunds.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card/80 p-12 text-center text-muted-foreground">
              No refunds found.
            </div>
          ) : (
            refunds.map((refund) => (
              <div key={refund.id} className="rounded-xl border border-border/60 bg-card/80 p-4 space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold">{refund.publicId || refund.id}</p>
                      <Badge variant={refund.status === "PROCESSED" ? "success" : refund.status === "FAILED" ? "destructive" : "outline"}>
                        {refund.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {refund.payment?.booking?.event?.title || "Unknown event"} · {refund.payment?.booking?.user?.name || "Unknown user"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Booking {refund.payment?.booking?.publicId || "N/A"} · Payment {refund.payment?.publicId || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-accent">
                      {(Number(refund.amountCents || 0) / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {refund.processedAt ? new Date(refund.processedAt).toLocaleString("en-IN") : "Not processed"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={refundDrafts[refund.id]?.status || refund.status}
                    onChange={(event) =>
                      setRefundDrafts((current) => ({
                        ...current,
                        [refund.id]: { ...current[refund.id], status: event.target.value },
                      }))
                    }
                  >
                    {["APPROVED", "DECLINED", "PROCESSED", "FAILED"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <Textarea
                    placeholder="Refund notes or reason"
                    value={refundDrafts[refund.id]?.reason ?? refund.reason ?? ""}
                    onChange={(event) =>
                      setRefundDrafts((current) => ({
                        ...current,
                        [refund.id]: { ...current[refund.id], reason: event.target.value },
                      }))
                    }
                  />
                  <Button onClick={() => handleRefundUpdate(refund.id)} disabled={updatingRefundId === refund.id}>
                    {updatingRefundId === refund.id ? "Saving..." : "Update"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/70 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Audit logs
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Recent promoter/admin actions across users, organizers, events, payouts, refunds, and bank reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search action, actor, resource..."
                value={auditFilters.search}
                onChange={(event) => updateAuditFilters({ search: event.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {auditTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateAuditFilters({ type })}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    auditFilters.type === type
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-card/70 text-muted-foreground hover:bg-card"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {auditError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {auditError}
            </div>
          )}

          {auditLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card/80 p-12 text-center text-muted-foreground">
              No audit logs found.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-border/60 bg-card/80 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{log.action}</p>
                      <Badge variant="outline">{log.resourceType || "unknown"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Actor: {log.actor?.name || "System"} · {log.actor?.email || log.actorType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Resource: {log.resourceId || "N/A"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Before</p>
                    <pre className="overflow-auto text-xs text-muted-foreground">{JSON.stringify(log.before, null, 2)}</pre>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">After</p>
                    <pre className="overflow-auto text-xs text-muted-foreground">{JSON.stringify(log.after, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoterReports;
