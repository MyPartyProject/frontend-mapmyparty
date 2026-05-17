import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader,
  PauseCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminPayouts } from "@/hooks/useAdminPayouts";
import {
  approveEventPayout,
  calculateEventPayout,
  createEventPayout,
  fetchAdminEvents,
  fetchAdminPayoutDetail,
  holdEventPayout,
  updateAdminPayoutStatus,
} from "@/services/adminService";

const payoutStatusOptions = [
  "ALL",
  "REVIEW_REQUIRED",
  "APPROVED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "RETRY_PENDING",
  "RECONCILED",
  "CANCELLED",
  "PENDING",
];

const updateStatusOptions = payoutStatusOptions.filter((status) => status !== "ALL");

const reviewableStatuses = new Set(["REVIEW_REQUIRED", "PENDING", "APPROVED", "FAILED", "RETRY_PENDING"]);
const terminalStatuses = new Set(["COMPLETED", "RECONCILED", "CANCELLED"]);

const formatMoney = (value, maximumFractionDigits = 0) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  });

const formatDate = (value) => {
  if (!value) return "Not set";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (value) =>
  String(value || "UNKNOWN")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const statusClass = (status) => {
  switch (status) {
    case "COMPLETED":
    case "RECONCILED":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
    case "APPROVED":
    case "PROCESSING":
      return "border-blue-500/40 bg-blue-500/15 text-blue-300";
    case "REVIEW_REQUIRED":
    case "PENDING":
    case "RETRY_PENDING":
      return "border-amber-500/40 bg-amber-500/15 text-amber-300";
    case "FAILED":
    case "CANCELLED":
      return "border-destructive/40 bg-destructive/15 text-destructive";
    default:
      return "border-border/70 bg-card/80 text-muted-foreground";
  }
};

const compactId = (value) => {
  if (!value) return "N/A";
  const text = String(value);
  if (text.length <= 14) return text;
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
};

const getPayoutAmount = (payout) => {
  const isEventPayout = Boolean(payout?.eventId || payout?.event);
  const snapshotAmount = Number(payout?.netPayoutAmount);
  if (isEventPayout && Number.isFinite(snapshotAmount) && snapshotAmount > 0) {
    return snapshotAmount;
  }
  return Number(payout?.amount || 0);
};

const SummaryTile = ({ label, value, tone = "text-foreground" }) => (
  <div className="rounded-lg border border-border/60 bg-card/70 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`mt-1 text-base font-semibold ${tone}`}>{value}</p>
  </div>
);

const PayoutDetailModal = ({ payout, loading, onOpenChange }) => {
  const lineItems = payout?.lineItems || [];

  return (
    <Dialog open={Boolean(payout) || loading} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto border-border/70 bg-background/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Payout settlement detail
          </DialogTitle>
          <DialogDescription>
            Event ledger, deductions, GST, and provider references for this payout.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          payout && (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <SummaryTile label="Net payout" value={formatMoney(getPayoutAmount(payout), 2)} tone="text-accent" />
                <SummaryTile label="Gross sales" value={formatMoney(payout.grossTicketSales, 2)} />
                <SummaryTile label="Platform fee" value={formatMoney(payout.platformFeeAmount, 2)} />
                <SummaryTile label="GST deducted" value={formatMoney(payout.gstTotal, 2)} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                  <h3 className="text-sm font-semibold">Audit overview</h3>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-4">
                      <span>Status</span>
                      <Badge className={`${statusClass(payout.status)} border`}>{formatStatus(payout.status)}</Badge>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Payout ID</span>
                      <span className="font-mono text-foreground">{payout.publicId || compactId(payout.id)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Invoice</span>
                      <span className="font-mono text-foreground">{payout.invoiceNumber || "Not issued"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Created</span>
                      <span className="text-foreground">{formatDate(payout.createdAt)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Approved</span>
                      <span className="text-foreground">{formatDate(payout.approvedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                  <h3 className="text-sm font-semibold">Event and organizer</h3>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-4">
                      <span>Event</span>
                      <span className="text-right text-foreground">{payout.event?.title || "Legacy organizer payout"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Event type</span>
                      <span className="text-foreground">{formatStatus(payout.event?.type || "manual")}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Organizer</span>
                      <span className="text-foreground">{payout.organizer?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Bank</span>
                      <span className="text-right text-foreground">
                        {payout.bank_details?.bankName || "N/A"} {payout.bank_details?.accountNumber ? `- ****${payout.bank_details.accountNumber.slice(-4)}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/70">
                <div className="border-b border-border/60 px-4 py-3">
                  <h3 className="text-sm font-semibold">Before deductions to net payout</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground">
                      <tr className="border-b border-border/60">
                        <th className="px-4 py-3 text-left">Ticket</th>
                        <th className="px-4 py-3 text-right">Gross</th>
                        <th className="px-4 py-3 text-right">Refunds</th>
                        <th className="px-4 py-3 text-right">Net sales</th>
                        <th className="px-4 py-3 text-right">Fee</th>
                        <th className="px-4 py-3 text-right">GST</th>
                        <th className="px-4 py-3 text-right">Net payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            No line item snapshot is available for this payout.
                          </td>
                        </tr>
                      ) : (
                        lineItems.map((item) => (
                          <tr key={item.id} className="border-b border-border/40 last:border-0">
                            <td className="px-4 py-3">
                              <p className="font-medium">{item.ticketName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} x {formatMoney(item.ticketPrice, 2)}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right">{formatMoney(item.ticketSubtotal, 2)}</td>
                            <td className="px-4 py-3 text-right">{formatMoney((item.refundAmount || 0) + (item.refundReserveAmount || 0), 2)}</td>
                            <td className="px-4 py-3 text-right">{formatMoney(item.netSales, 2)}</td>
                            <td className="px-4 py-3 text-right">{formatMoney(item.platformFeeAmount, 2)}</td>
                            <td className="px-4 py-3 text-right">{formatMoney(item.gstTotal, 2)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-accent">{formatMoney(item.netPayoutAmount, 2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <details className="rounded-xl border border-border/60 bg-card/70 p-4">
                <summary className="cursor-pointer text-sm font-semibold">Technical metadata</summary>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <div>Provider: <span className="text-foreground">{payout.provider || "MANUAL"}</span></div>
                  <div>Provider status: <span className="text-foreground">{payout.providerStatus || "Not started"}</span></div>
                  <div>Batch ID: <span className="font-mono text-foreground">{payout.providerBatchId || "Not set"}</span></div>
                  <div>Payout ID: <span className="font-mono text-foreground">{payout.providerPayoutId || "Not set"}</span></div>
                  <div>Failure code: <span className="text-foreground">{payout.providerFailureCode || "None"}</span></div>
                  <div>Failure reason: <span className="text-foreground">{payout.failureReason || payout.blockedReason || "None"}</span></div>
                </div>
              </details>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

const PromoterPayouts = () => {
  const { items, statistics, filters, loading, isFetching, error, updateFilters, refresh } = useAdminPayouts();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [createForm, setCreateForm] = useState({ eventId: "", remarks: "" });
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [statusForm, setStatusForm] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [detailPayout, setDetailPayout] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      setEventsLoading(true);
      try {
        const data = await fetchAdminEvents({ limit: 50 });
        if (!cancelled) {
          setEvents(data?.events || []);
        }
      } catch (loadError) {
        if (!cancelled) {
          toast.error(loadError.message || "Failed to load events for payout.");
        }
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
        }
      }
    };

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const base = {
      totalAmount: 0,
      totalCount: 0,
      reviewAmount: 0,
      processingAmount: 0,
      failedAmount: 0,
    };

    statistics.forEach((item) => {
      const amount = Number(item?._sum?.amount || 0);
      const count = Number(item?._count?.id || 0);
      base.totalAmount += amount;
      base.totalCount += count;
      if (["PENDING", "REVIEW_REQUIRED", "APPROVED"].includes(item.status)) base.reviewAmount += amount;
      if (item.status === "PROCESSING") base.processingAmount += amount;
      if (item.status === "FAILED") base.failedAmount += amount;
    });

    return base;
  }, [statistics]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === createForm.eventId),
    [events, createForm.eventId]
  );

  const updatePayoutForm = (payoutId, updates) => {
    setStatusForm((current) => ({
      ...current,
      [payoutId]: { ...current[payoutId], ...updates },
    }));
  };

  const getActionPayload = (payoutId) => {
    const form = statusForm[payoutId] || {};
    return {
      providerBatchId: form.providerBatchId || undefined,
      providerPayoutId: form.providerPayoutId || undefined,
      remarks: form.remarks || undefined,
      failureReason: form.failureReason || undefined,
      blockedReason: form.blockedReason || form.remarks || undefined,
      providerFailureCode: form.providerFailureCode || undefined,
    };
  };

  const handlePreviewPayout = async () => {
    if (!createForm.eventId) {
      toast.error("Select an event first.");
      return;
    }

    setPreviewLoading(true);
    setPreview(null);
    try {
      const result = await calculateEventPayout(createForm.eventId);
      setPreview(result);
      if (result.eligible) {
        toast.success("Payout calculation is ready for review.");
      } else {
        toast.error("Payout is blocked. Review the eligibility reasons.");
      }
    } catch (previewError) {
      setPreview(previewError.data || null);
      toast.error(previewError.message || "Failed to calculate payout.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateEventPayout = async (event) => {
    event.preventDefault();
    if (!createForm.eventId) {
      toast.error("Select an event first.");
      return;
    }

    setIsCreating(true);
    try {
      await createEventPayout(createForm.eventId, { remarks: createForm.remarks.trim() });
      toast.success("Event payout draft created.");
      setCreateForm({ eventId: "", remarks: "" });
      setPreview(null);
      refresh();
    } catch (createError) {
      setPreview(createError.data || preview);
      toast.error(createError.message || "Failed to create event payout.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (payoutId) => {
    const form = statusForm[payoutId];
    if (!form?.status) {
      toast.error("Choose a status first.");
      return;
    }

    setUpdatingId(payoutId);
    try {
      await updateAdminPayoutStatus(payoutId, {
        status: form.status,
        ...getActionPayload(payoutId),
      });
      toast.success("Payout status updated.");
      refresh();
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update payout.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApprove = async (payoutId) => {
    setUpdatingId(payoutId);
    try {
      await approveEventPayout(payoutId, getActionPayload(payoutId));
      toast.success("Payout approved for provider processing.");
      refresh();
    } catch (approveError) {
      toast.error(approveError.message || "Failed to approve payout.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleHold = async (payoutId) => {
    const reason = statusForm[payoutId]?.blockedReason || statusForm[payoutId]?.remarks;
    if (!reason?.trim()) {
      toast.error("Add a review note before holding payout.");
      return;
    }

    setUpdatingId(payoutId);
    try {
      await holdEventPayout(payoutId, {
        reason: reason.trim(),
        remarks: statusForm[payoutId]?.remarks || undefined,
      });
      toast.success("Payout held for review.");
      refresh();
    } catch (holdError) {
      toast.error(holdError.message || "Failed to hold payout.");
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetail = async (payoutId) => {
    setDetailLoading(true);
    setDetailPayout(null);
    try {
      const payout = await fetchAdminPayoutDetail(payoutId);
      setDetailPayout(payout);
    } catch (detailError) {
      toast.error(detailError.message || "Failed to load payout detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const previewTotals = preview?.totals;
  const blockers = preview?.blockers || preview?.data?.blockers || [];
  const warnings = preview?.warnings || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Payouts</h2>
          <p className="text-muted-foreground">Calculate event settlement, review deductions, and release payout drafts.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 bg-card/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total pipeline</p>
            <p className="mt-1 text-2xl font-semibold">{formatMoney(totals.totalAmount)}</p>
            <p className="text-sm text-muted-foreground">{totals.totalCount} payouts</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">In review</p>
            <p className="mt-1 text-2xl font-semibold text-amber-400">{formatMoney(totals.reviewAmount)}</p>
            <p className="text-sm text-muted-foreground">Calculated or approved</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Processing</p>
            <p className="mt-1 text-2xl font-semibold text-blue-300">{formatMoney(totals.processingAmount)}</p>
            <p className="text-sm text-muted-foreground">Provider stage</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="mt-1 text-2xl font-semibold text-destructive">{formatMoney(totals.failedAmount)}</p>
            <p className="text-sm text-muted-foreground">Needs intervention</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Create event payout
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Select an ended event, preview the backend settlement ledger, then create a review draft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_auto]" onSubmit={handleCreateEventPayout}>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={createForm.eventId}
                onChange={(event) => {
                  setCreateForm((current) => ({ ...current, eventId: event.target.value }));
                  setPreview(null);
                }}
                disabled={eventsLoading}
              >
                <option value="">{eventsLoading ? "Loading events..." : "Select event"}</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {event.organizer?.name || "Organizer"} - {formatStatus(event.type)}
                  </option>
                ))}
              </select>
              <Textarea
                className="min-h-10 md:min-h-10"
                placeholder="Internal payout remarks"
                value={createForm.remarks}
                onChange={(event) => setCreateForm((current) => ({ ...current, remarks: event.target.value }))}
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={handlePreviewPayout} disabled={previewLoading || !createForm.eventId}>
                {previewLoading ? <Loader className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Preview
              </Button>
              <Button type="submit" disabled={isCreating || !preview?.eligible}>
                {isCreating ? "Creating..." : "Create draft"}
              </Button>
            </div>
          </form>

          {selectedEvent && (
            <div className="mt-4 grid gap-3 rounded-xl border border-border/60 bg-background/40 p-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Selected event</p>
                <p className="font-semibold">{selectedEvent.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Organizer</p>
                <p className="font-semibold">{selectedEvent.organizer?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Event type</p>
                <p className="font-semibold">{formatStatus(selectedEvent.type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ends</p>
                <p className="font-semibold">{formatDate(selectedEvent.endDate)}</p>
              </div>
            </div>
          )}

          {preview && (
            <div className="mt-4 space-y-4 rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{preview.eligible ? "Payout is eligible" : "Payout is blocked"}</p>
                  <p className="text-sm text-muted-foreground">
                    Backend calculated {preview.lineItems?.length || 0} ticket settlement lines.
                  </p>
                </div>
                <Badge className={`${preview.eligible ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-destructive/40 bg-destructive/15 text-destructive"} border`}>
                  {preview.eligible ? "Ready for draft" : "Review required"}
                </Badge>
              </div>

              {previewTotals && (
                <div className="grid gap-3 md:grid-cols-5">
                  <SummaryTile label="Gross sales" value={formatMoney(previewTotals.grossTicketSales, 2)} />
                  <SummaryTile label="Refunds/reserve" value={formatMoney((previewTotals.refundAmount || 0) + (previewTotals.refundReserveAmount || 0), 2)} />
                  <SummaryTile label={`Platform fee (${previewTotals.platformFeePercent || 0}%)`} value={formatMoney(previewTotals.platformFeeAmount, 2)} />
                  <SummaryTile label={`${previewTotals.gstType || "GST"} deducted`} value={formatMoney(previewTotals.gstTotal, 2)} />
                  <SummaryTile label="Net payout" value={formatMoney(previewTotals.netPayoutAmount, 2)} tone="text-accent" />
                </div>
              )}

              {(blockers.length > 0 || warnings.length > 0) && (
                <div className="grid gap-3 md:grid-cols-2">
                  {blockers.length > 0 && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                      <p className="text-sm font-semibold text-destructive">Eligibility blockers</p>
                      <ul className="mt-2 space-y-1 text-sm text-destructive/80">
                        {blockers.map((blocker) => (
                          <li key={blocker.code}>{blocker.message || blocker.code}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {warnings.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="text-sm font-semibold text-amber-300">Warnings</p>
                      <ul className="mt-2 space-y-1 text-sm text-amber-200/80">
                        {warnings.map((warning) => (
                          <li key={warning.code}>{warning.message || warning.code}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search event, organizer, invoice, bank..."
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {payoutStatusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => updateFilters({ status })}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                filters.status === status
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card/70 text-muted-foreground hover:bg-card"
              }`}
            >
              {status === "ALL" ? "All" : formatStatus(status)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Error loading payouts</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <Card className="border-border/60 bg-card/70">
              <CardContent className="py-12 text-center text-muted-foreground">No payouts found.</CardContent>
            </Card>
          ) : (
            items.map((payout) => {
              const isEventPayout = Boolean(payout.eventId || payout.event);
              const form = statusForm[payout.id] || {};

              return (
                <Card key={payout.id} className="border-border/60 bg-card/70 transition hover:border-primary/30 hover:bg-card/85">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                            {isEventPayout ? <CalendarDays className="h-5 w-5" /> : <Wallet2 className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-lg font-semibold">
                              {payout.event?.title || `${payout.organizer?.name || "Organizer"} manual payout`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payout.organizer?.name || "Unknown organizer"} - {payout.event?.type ? formatStatus(payout.event.type) : "Legacy payout"}
                            </p>
                          </div>
                          <Badge className={`${statusClass(payout.status)} border`}>{formatStatus(payout.status)}</Badge>
                          {payout.invoiceNumber && <Badge variant="outline">{payout.invoiceNumber}</Badge>}
                          {!isEventPayout && <Badge variant="outline">Manual</Badge>}
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <SummaryTile label="Gross sales" value={formatMoney(payout.grossTicketSales, 2)} />
                          <SummaryTile label="Refunds/reserve" value={formatMoney((payout.refundAmount || 0) + (payout.refundReserveAmount || 0), 2)} />
                          <SummaryTile label="Fee + GST" value={formatMoney((payout.platformFeeAmount || 0) + (payout.gstTotal || 0), 2)} />
                          <SummaryTile label="Net payout" value={formatMoney(getPayoutAmount(payout), 2)} tone="text-accent" />
                        </div>
                      </div>

                      <div className="min-w-[220px] space-y-2 text-sm xl:text-right">
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="font-medium">{formatDate(payout.createdAt)}</p>
                        <p className="text-xs text-muted-foreground">Provider</p>
                        <p className="font-mono text-xs">{payout.providerStatus || payout.provider || "Manual review"}</p>
                        <Button variant="outline" size="sm" onClick={() => openDetail(payout.id)}>
                          <Eye className="h-4 w-4" />
                          View details
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Banknote className="h-4 w-4" /> Bank</p>
                        <p className="truncate font-semibold">{payout.bank_details?.bankName || "No bank"}</p>
                        <p className="text-xs text-muted-foreground">
                          {payout.bank_details?.accountNumber ? `****${payout.bank_details.accountNumber.slice(-4)}` : "No account"} - {payout.bank_details?.verificationStatus || "Unknown"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" /> Provider payout</p>
                        <p className="truncate font-semibold">{payout.providerPayoutId || "Not set"}</p>
                        <p className="text-xs text-muted-foreground">Batch {payout.providerBatchId || "not set"}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/40 p-3 md:col-span-2">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          {payout.failureReason || payout.blockedReason ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                          Review notes
                        </p>
                        <p className="truncate font-semibold">{payout.failureReason || payout.blockedReason || payout.remarks || "No remarks"}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 xl:grid-cols-[160px_1fr_1fr_1fr_auto]">
                      <select
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={form.status || payout.status}
                        onChange={(event) => updatePayoutForm(payout.id, { status: event.target.value })}
                      >
                        {updateStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Provider batch id"
                        value={form.providerBatchId ?? payout.providerBatchId ?? ""}
                        onChange={(event) => updatePayoutForm(payout.id, { providerBatchId: event.target.value })}
                      />
                      <Input
                        placeholder="Provider payout id"
                        value={form.providerPayoutId ?? payout.providerPayoutId ?? ""}
                        onChange={(event) => updatePayoutForm(payout.id, { providerPayoutId: event.target.value })}
                      />
                      <Input
                        placeholder="Review note, hold reason, or failure reason"
                        value={form.remarks ?? form.blockedReason ?? payout.blockedReason ?? payout.failureReason ?? payout.remarks ?? ""}
                        onChange={(event) =>
                          updatePayoutForm(payout.id, {
                            remarks: event.target.value,
                            blockedReason: event.target.value,
                            failureReason: event.target.value,
                          })
                        }
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        {isEventPayout && reviewableStatuses.has(payout.status) && (
                          <Button variant="outline" onClick={() => handleApprove(payout.id)} disabled={updatingId === payout.id}>
                            <ShieldCheck className="h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {isEventPayout && !terminalStatuses.has(payout.status) && (
                          <Button variant="outline" onClick={() => handleHold(payout.id)} disabled={updatingId === payout.id}>
                            <PauseCircle className="h-4 w-4" />
                            Hold
                          </Button>
                        )}
                        <Button onClick={() => handleUpdateStatus(payout.id)} disabled={updatingId === payout.id}>
                          {updatingId === payout.id ? "Saving..." : "Update"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <PayoutDetailModal
        payout={detailPayout}
        loading={detailLoading}
        onOpenChange={(open) => {
          if (!open) {
            setDetailPayout(null);
            setDetailLoading(false);
          }
        }}
      />
    </div>
  );
};

export default PromoterPayouts;
