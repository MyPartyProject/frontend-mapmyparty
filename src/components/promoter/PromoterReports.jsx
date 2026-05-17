import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Calendar,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader,
  Pencil,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Undo2,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminRefunds } from "@/hooks/useAdminRefunds";
import { useAdminAuditLogs } from "@/hooks/useAdminAuditLogs";
import { updateAdminRefundStatus } from "@/services/adminService";
import { buildAuditChangeSet } from "@/utils/auditLogFormatter";

const refundStatuses = ["ALL", "REQUESTED", "APPROVED", "DECLINED", "PROCESSED", "FAILED"];
const auditTypes = ["ALL", "users", "event_organizer", "events", "payouts", "refunds", "bank_details"];

const auditToneClasses = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-primary/30 bg-primary/10 text-primary",
  neutral: "border-border/60 bg-background/70 text-foreground",
};

const auditIconToneClasses = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-primary/30 bg-primary/10 text-primary",
  neutral: "border-border/60 bg-background/70 text-muted-foreground",
};

const formatResourceType = (resourceType) =>
  String(resourceType || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const truncateId = (value, length = 14) => {
  const text = String(value || "N/A");
  if (text.length <= length) return text;
  return `${text.slice(0, length - 4)}...`;
};

const formatRelativeTime = (dateValue) => {
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) return "Unknown time";

  const seconds = Math.round((Date.now() - timestamp) / 1000);
  const absoluteSeconds = Math.abs(seconds);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, unitSeconds] of units) {
    if (absoluteSeconds >= unitSeconds) {
      return formatter.format(-Math.round(seconds / unitSeconds), unit);
    }
  }

  return "just now";
};

const getAuditCategory = (log) => {
  const resourceType = String(log?.resourceType || "").toLowerCase();
  const action = String(log?.action || "").toLowerCase();

  if (resourceType.includes("bank")) return { label: "Bank Review", icon: Banknote, tone: "success" };
  if (resourceType.includes("refund")) return { label: "Refund Action", icon: Undo2, tone: action.includes("failed") || action.includes("declined") ? "danger" : "info" };
  if (resourceType.includes("payout")) return { label: "Payout Action", icon: Wallet, tone: "success" };
  if (resourceType.includes("user")) return { label: "User Update", icon: User, tone: action.includes("suspend") ? "warning" : "info" };
  if (resourceType.includes("organizer")) return { label: "Organizer Change", icon: Shield, tone: "success" };
  if (resourceType.includes("event")) return { label: "Event Action", icon: Calendar, tone: "info" };
  if (action.includes("delete") || action.includes("remove")) return { label: "Removed", icon: AlertTriangle, tone: "danger" };
  if (action.includes("verify") || action.includes("approve")) return { label: "Verified", icon: CheckCircle2, tone: "success" };
  if (action.includes("payment")) return { label: "Payment Action", icon: CreditCard, tone: "info" };
  if (action.includes("update") || action.includes("edit")) return { label: "Updated", icon: Pencil, tone: "info" };
  return { label: "System Action", icon: Settings, tone: "neutral" };
};

const buildActivitySummary = (log, changeSet) => {
  const actor = log.actor?.name || "System";
  const category = getAuditCategory(log);
  const primaryChange = changeSet.changes[0];

  if (primaryChange) {
    return `${actor} changed ${primaryChange.label} to ${primaryChange.afterLabel}`;
  }

  return `${actor} performed ${changeSet.title.toLowerCase()} on ${category.label.toLowerCase()}`;
};

const AuditValue = ({ value, tone }) => (
  <span className={`inline-flex min-h-8 max-w-full items-center rounded-md border px-2.5 py-1 text-sm ${auditToneClasses[tone] || auditToneClasses.neutral}`}>
    {value}
  </span>
);

const AuditLogCard = ({ log, onOpen }) => {
  const changeSet = buildAuditChangeSet(log);
  const category = getAuditCategory(log);
  const Icon = category.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-3 text-left transition hover:border-primary/35 hover:bg-card"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${auditIconToneClasses[category.tone] || auditIconToneClasses.neutral}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-background/40">
            {category.label}
          </Badge>
          <p className="truncate text-sm font-medium text-foreground">
            {buildActivitySummary(log, changeSet)}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{log.actor?.name || "System"}</span>
          <span>{"\u00B7"}</span>
          <span>{formatResourceType(log.resourceType)}</span>
          <span>{"\u00B7"}</span>
          <span title={log.resourceId || ""}>Resource {truncateId(log.resourceId)}</span>
          <span>{"\u00B7"}</span>
          <span>{formatRelativeTime(log.createdAt)}</span>
        </div>
      </div>
      <span className="hidden shrink-0 items-center gap-2 rounded-md border border-border/60 bg-background/50 px-3 py-2 text-xs font-medium text-muted-foreground transition group-hover:border-primary/35 group-hover:text-foreground sm:inline-flex">
        <Eye className="h-3.5 w-3.5" />
        View Details
      </span>
    </button>
  );
};

const AuditDetailModal = ({ log, onOpenChange }) => {
  if (!log) return null;

  const changeSet = buildAuditChangeSet(log);
  const category = getAuditCategory(log);
  const Icon = category.icon;

  return (
    <Dialog open={Boolean(log)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto border-border/70 bg-background/95">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${auditIconToneClasses[category.tone] || auditIconToneClasses.neutral}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>{changeSet.title}</DialogTitle>
              <DialogDescription>{buildActivitySummary(log, changeSet)}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <section className="rounded-xl border border-border/60 bg-card/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Audit Overview</h3>
              <Badge variant="outline">{category.label}</Badge>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Actor</p>
                <p className="font-medium">{log.actor?.name || "System"}</p>
                <p className="truncate text-xs text-muted-foreground">{log.actor?.email || log.actorType || "System"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Timestamp</p>
                <p className="font-medium">{new Date(log.createdAt).toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(log.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Resource ID</p>
                <p className="truncate font-medium" title={log.resourceId || ""}>{log.resourceId || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{formatResourceType(log.resourceType)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-card/60 p-4">
            <h3 className="text-sm font-semibold">Change Summary</h3>
            <p className="mt-2 text-sm text-muted-foreground">{changeSet.summary}</p>
          </section>

          <section className="rounded-xl border border-border/60 bg-card/60 p-4">
            <h3 className="text-sm font-semibold">Before vs After</h3>
            {changeSet.changes.length > 0 ? (
              <div className="mt-3 space-y-3">
                {changeSet.changes.map((change) => (
                  <div key={change.key} className="rounded-lg border border-border/50 bg-background/45 p-3">
                    <p className="text-sm font-medium text-foreground">{change.label}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Before</p>
                        <AuditValue value={change.beforeLabel} tone={change.beforeTone} />
                      </div>
                      <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">After</p>
                        <AuditValue value={change.afterLabel} tone={change.afterTone} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-border/50 bg-background/45 p-3 text-sm text-muted-foreground">
                This entry has no changed fields to display.
              </div>
            )}
          </section>

          <details className="rounded-xl border border-border/60 bg-card/60 p-4 text-xs text-muted-foreground">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">Technical Metadata</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <p className="mb-2 font-semibold text-muted-foreground">System References</p>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-muted-foreground">Audit ID</dt>
                    <dd className="break-all text-foreground">{log.id || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Resource Type</dt>
                    <dd className="break-all text-foreground">{log.resourceType || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Actor ID</dt>
                    <dd className="break-all text-foreground">{log.actor?.publicId || log.actor?.id || "N/A"}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <p className="mb-2 font-semibold text-muted-foreground">Raw Payload</p>
                <details>
                  <summary className="cursor-pointer text-foreground">Before</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px]">
                    {JSON.stringify(log.before, null, 2)}
                  </pre>
                </details>
                <details className="mt-3">
                  <summary className="cursor-pointer text-foreground">After</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px]">
                    {JSON.stringify(log.after, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

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
                      {refund.payment?.booking?.event?.title || "Unknown event"}{" \u00B7 "}{refund.payment?.booking?.user?.name || "Unknown user"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Booking {refund.payment?.booking?.publicId || "N/A"}{" \u00B7 "}Payment {refund.payment?.publicId || "N/A"}
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
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Audit logs
              </CardTitle>
              <CardDescription className="mt-1 text-muted-foreground">
                Recent promoter/admin activity across users, organizers, events, payouts, refunds, and bank reviews.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAudit} disabled={auditFetching}>
              <RefreshCw className={`h-4 w-4 ${auditFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search action, actor, resource..."
                value={auditFilters.search}
                onChange={(event) => updateAuditFilters({ search: event.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {auditTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateAuditFilters({ type })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <AuditLogCard key={log.id} log={log} onOpen={() => setSelectedAuditLog(log)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AuditDetailModal
        log={selectedAuditLog}
        onOpenChange={(open) => {
          if (!open) setSelectedAuditLog(null);
        }}
      />
    </div>
  );
};

export default PromoterReports;
