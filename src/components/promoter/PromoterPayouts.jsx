import UpcomingSettlements from '@/components/organizer/UpcomingSettlements';
import { apiFetch } from '@/config/api';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader,
  PauseCircle,
  Plus,
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
  approvePayoutRevision,
  approveEventPayout,
  calculateEventPayout,
  cancelAdminBalanceAdjustment,
  createAdminOrganizerBalanceAdjustment,
  createEventPayout,
  createPayoutRevision,
  disbursePayout,
  fetchAdminOrganizerBalanceAdjustments,
  fetchAdminEvents,
  fetchAdminOrganizers,
  takeControlOfPayout,
  downloadPayoutExport,
  fetchAdminPayoutDetail,
  holdEventPayout,
  resolvePayout,
} from "@/services/adminService";

const payoutStatusOptions = [
  "ALL",
  "REVIEW_REQUIRED",
  "AUTO_APPROVED",
  "APPROVED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "RETRY_PENDING",
  "RECONCILED",
  "CANCELLED",
  "REVERSED",
  "PENDING",
];

const reviewableStatuses = new Set(["REVIEW_REQUIRED", "PENDING", "FAILED", "RETRY_PENDING"]);
const terminalStatuses = new Set(["COMPLETED", "RECONCILED", "CANCELLED", "REVERSED"]);

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
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 light:text-success";
    case "APPROVED":
    case "AUTO_APPROVED":
    case "PROCESSING":
      return "border-blue-500/40 bg-blue-500/15 text-blue-300 light:text-info";
    case "REVIEW_REQUIRED":
    case "PENDING":
    case "RETRY_PENDING":
      return "border-amber-500/40 bg-amber-500/15 text-amber-300 light:text-warning";
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

const emptyInputs = () => ({ feeMode: "CONFIGURED", feeValue: "", adjustments: [], reason: "" });
const calculationInputs = (form) => ({
  fee: form.feeMode === "CONFIGURED" ? null : form.feeMode === "FIXED"
    ? { mode: "FIXED", amountCents: Math.round(Number(form.feeValue) * 100) }
    : { mode: "PERCENTAGE", rate: Number(form.feeValue) / 100 },
  adjustments: form.adjustments.map(row => ({ direction: row.direction, amountCents: Math.round(Number(row.amount) * 100),
    category: row.category.trim(), description: row.description.trim() })),
});
const PayoutInputs = ({ value, onChange, totals, disabled = false }) => (
  <fieldset disabled={disabled} className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm">Platform fee
        <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={value.feeMode}
          onChange={e => onChange({ ...value, feeMode: e.target.value, feeValue: e.target.value === "FIXED" ? String(totals?.platformFeeAmount ?? "") : String((totals?.platformFeeRate ?? 0) * 100) })}>
          <option value="CONFIGURED">Use configured fee</option><option value="PERCENTAGE">Custom percentage</option><option value="FIXED">Custom amount (INR)</option>
        </select>
      </label>
      <label className="space-y-1 text-sm">{value.feeMode === "FIXED" ? "Fee amount (INR)" : "Fee rate (%)"}
        <Input type="number" min="0" max={value.feeMode === "PERCENTAGE" ? 100 : undefined} step="0.01"
          readOnly={value.feeMode === "CONFIGURED"} required={value.feeMode !== "CONFIGURED"}
          value={value.feeMode === "CONFIGURED" ? (totals ? String((totals.configuredFeeRate ?? totals.platformFeeRate) * 100) : "") : value.feeValue}
          onChange={e => onChange({ ...value, feeValue: e.target.value })} />
      </label>
    </div>
    <p className="text-xs text-muted-foreground">GST is calculated automatically. Sales, refunds and bank details cannot be edited here.</p>
    {value.adjustments.map((row, index) => {
      const update = patch => onChange({ ...value, adjustments: value.adjustments.map((item, i) => i === index ? { ...item, ...patch } : item) });
      return <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
        <label className="text-sm">Adjustment
          <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={row.direction} onChange={e => update({ direction: e.target.value })}>
            <option value="DEBIT">Deduct from payout</option><option value="CREDIT">Add to payout</option>
          </select>
        </label>
        <label className="text-sm">Amount (INR)<Input type="number" min="0.01" step="0.01" required value={row.amount} onChange={e => update({ amount: e.target.value })} /></label>
        <label className="text-sm">Category<Input required maxLength={80} value={row.category} onChange={e => update({ category: e.target.value })} /></label>
        <label className="text-sm">Description<Input required minLength={3} maxLength={300} value={row.description} onChange={e => update({ description: e.target.value })} /></label>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...value, adjustments: value.adjustments.filter((_, i) => i !== index) })}>Remove adjustment</Button>
      </div>;
    })}
    <Button type="button" variant="outline" size="sm" disabled={value.adjustments.length >= 20}
      onClick={() => onChange({ ...value, adjustments: [...value.adjustments, { direction: "DEBIT", amount: "", category: "MANUAL_CORRECTION", description: "" }] })}>
      <Plus className="h-4 w-4" /> Add adjustment
    </Button>
    <label className="block space-y-1 text-sm">Reason / review note
      <Textarea maxLength={500} minLength={5} required={value.feeMode !== "CONFIGURED" || value.adjustments.length > 0}
        placeholder="Explain any fee change or adjustment" value={value.reason} onChange={e => onChange({ ...value, reason: e.target.value })} />
    </label>
  </fieldset>
);
const PayoutBreakdown = ({ totals }) => totals ? (
  <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
    {[
      ["Gross ticket sales", totals.grossTicketSales], ["Processed refunds", totals.refundAmount],
      ["Pending refund reserves", totals.refundReserveAmount], ["Net sales", totals.netSales],
      ["Configured platform fee", totals.configuredFeeAmount], ["Effective platform fee", totals.platformFeeAmount],
      ["CGST", totals.cgstAmount], ["SGST", totals.sgstAmount], ["IGST", totals.igstAmount],
      ["Balance recovery", (totals.organizerBalanceAdjustmentCents || 0) / 100],
      ["Manual adjustments (+ / −)", (totals.manualAdjustmentCents || 0) / 100], ["Final payout", totals.netPayoutAmount],
    ].map(([label, amount]) => <div key={label} className="flex justify-between gap-4 border-b border-border/40 py-2">
      <dt className="text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{amount == null ? "Unavailable" : formatMoney(amount, 2)}</dd>
    </div>)}
  </dl>
) : <p className="text-sm text-muted-foreground">No calculation snapshot is available.</p>;
const PayoutDownloads = ({ payoutId, filters = {} }) => {
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState("Summary");
  const download = async format => {
    setBusy(true);
    try { await downloadPayoutExport({ ...filters, exportType: payoutId ? "payout_detail" : "payout_summary", ...(payoutId ? { payoutId } : {}), format, section }); }
    catch (error) { toast.error(error.message || "Download failed"); }
    finally { setBusy(false); }
  };
  return <div className="flex flex-wrap items-center gap-2">
    {payoutId && <select aria-label="CSV section" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={section} onChange={e => setSection(e.target.value)}>
      {["Summary", "Ticket Lines", "Adjustments", "Transfers", "Status History"].map(name => <option key={name}>{name}</option>)}
    </select>}
    <Button variant="outline" size="sm" disabled={busy} onClick={() => download("csv")}>Download CSV</Button>
    <Button variant="outline" size="sm" disabled={busy} onClick={() => download("xlsx")}>Download Excel</Button>
  </div>;
};

const PayoutDetailModal = ({
  payout,
  loading,
  onOpenChange,
  onCreateRevision,
  onApproveRevision,
  revisionBusy,
  onTakeControl,
}) => {
  const lineItems = payout?.lineItems || [];
  const revisions = payout?.revisions || [];
  const transferAttempts = payout?.transferAttempts || [];
  const statusHistory = payout?.statusHistory || [];
  const adjustmentAmount = Number(payout?.organizerBalanceAdjustmentCents || 0) / 100;
  const [revisionForm, setRevisionForm] = useState(emptyInputs);
  useEffect(() => {
    const fee = payout?.calculationSnapshot?.inputs?.fee;
    setRevisionForm({ ...emptyInputs(), feeMode: fee?.mode || "CONFIGURED",
      feeValue: fee ? String(fee.mode === "PERCENTAGE" ? fee.rate * 100 : fee.amountCents / 100) : "" });
  }, [payout?.id, payout?.revisionNumber, payout?.calculationSnapshot?.inputs?.fee]);
  const canTakeControl = payout?.eventId && !payout.manualControl && ["PENDING", "REVIEW_REQUIRED", "AUTO_APPROVED", "APPROVED", "FAILED"].includes(payout.status)
    && !payout.initiatedAt && !payout.automaticAttemptCount && !transferAttempts.length;
  const canRevise = payout?.manualControl && ["PENDING", "REVIEW_REQUIRED", "APPROVED", "FAILED"].includes(payout.status)
    && !payout.initiatedAt && !payout.automaticAttemptCount && !transferAttempts.length;
  const submitRevision = async event => {
    event.preventDefault();
    if (revisionForm.reason.trim().length < 5) return toast.error("Explain the revision in at least 5 characters.");
    await onCreateRevision(payout.id, {
      ...calculationInputs(revisionForm), expectedRevision: payout.revisionNumber, reason: revisionForm.reason.trim(),
    });
  };

  return (
    <Dialog open={Boolean(payout) || loading} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto border-border/70 bg-background/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary light:text-accent-foreground" />
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge variant="outline">{payout.manualControl ? "Promoter controlled" : "Automatic"} · Revision {payout.revisionNumber}</Badge>
                <PayoutDownloads payoutId={payout.id} />
              </div>
              <PayoutBreakdown totals={payout.calculationSnapshot?.totals} />
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Eligible from: {formatDate(payout.holdUntil)}</p><p>Completed: {formatDate(payout.completedAt)}</p>
                <p>Approved by: {payout.approvedById || "Not approved"}</p><p>Released by: {payout.releasedById || "Not released"}</p>
                <p>Transfer: {payout.cashfreeTransferId || payout.providerPayoutId || "Not submitted"}</p><p>UTR: {payout.providerUtr || "Not available"}</p>
              </div>
              {canTakeControl && <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm">Take control to edit this payout and require your approval before release.</p>
                <Textarea aria-label="Take control reason" value={revisionForm.reason} onChange={e => setRevisionForm(current => ({ ...current, reason: e.target.value }))} placeholder="Reason for taking control" />
                <Button disabled={revisionBusy || revisionForm.reason.trim().length < 5} onClick={() => onTakeControl(payout, revisionForm.reason.trim())}>Take control</Button>
              </div>}
              <div className="grid gap-3 md:grid-cols-4">
                <SummaryTile label="Net payout" value={formatMoney(getPayoutAmount(payout), 2)} tone="text-accent light:text-accent-foreground" />
                <SummaryTile label="Gross sales" value={formatMoney(payout.grossTicketSales, 2)} />
                <SummaryTile label="Platform fee" value={formatMoney(payout.platformFeeAmount, 2)} />
                <SummaryTile label="GST deducted" value={formatMoney(payout.gstTotal, 2)} />
                {adjustmentAmount > 0 && (
                  <SummaryTile label="Balance recovered" value={formatMoney(adjustmentAmount, 2)} tone="text-amber-300 light:text-warning" />
                )}
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
                      <span className="text-foreground">{payout.publicId || compactId(payout.id)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Invoice</span>
                      <span className="text-foreground">{payout.invoiceNumber || "Not issued"}</span>
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
                        {payout.bank_details?.bankName || "N/A"} {payout.bank_details?.accountNumberMasked ? `- ${payout.bank_details.accountNumberMasked}` : ""}
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
                            <td className="px-4 py-3 text-right font-semibold text-accent light:text-accent-foreground">{formatMoney(item.netPayoutAmount, 2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                  <h3 className="text-sm font-semibold">Structured payout revisions</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Every debit or credit is recorded and requires approval before release.
                  </p>
                  {canRevise && (
                    <form className="mt-4 grid gap-3" onSubmit={submitRevision}>
                      <PayoutInputs value={revisionForm} onChange={setRevisionForm} totals={payout.calculationSnapshot?.totals} disabled={revisionBusy} />
                      <Button type="submit" disabled={revisionBusy}>
                        <Plus className="h-4 w-4" />
                        Propose revision
                      </Button>
                    </form>
                  )}
                  <div className="mt-4 grid gap-3">
                    {revisions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No payout revisions.</p>
                    ) : revisions.map((revision) => (
                      <div key={revision.id} className="rounded-lg border border-border/60 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">Revision {revision.revisionNumber}</span>
                          <Badge className={`${statusClass(revision.status)} border`}>{formatStatus(revision.status)}</Badge>
                        </div>
                        <p className="mt-2 text-muted-foreground">{revision.reason}</p>
                        {revision.afterSnapshot?.totals && <PayoutBreakdown totals={revision.afterSnapshot.totals} />}
                        {(revision.adjustments || []).map((adjustment) => (
                          <div key={adjustment.id} className="mt-2 flex justify-between gap-3 text-xs">
                            <span>{formatStatus(adjustment.category)} - {adjustment.description}</span>
                            <span className={adjustment.direction === "CREDIT" ? "text-emerald-300 light:text-success" : "text-amber-300 light:text-warning"}>
                              {adjustment.direction === "CREDIT" ? "+" : "-"}{formatMoney(adjustment.amountCents / 100, 2)}
                            </span>
                          </div>
                        ))}
                        {revision.status === "PENDING_APPROVAL" && (
                          <Button
                            className="mt-3"
                            size="sm"
                            variant="outline"
                            disabled={revisionBusy}
                            onClick={() => onApproveRevision(payout.id, revision.id)}
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Approve adjustment
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                    <h3 className="text-sm font-semibold">Provider attempts</h3>
                    <div className="mt-3 grid gap-2 text-sm">
                      {transferAttempts.length === 0 ? (
                        <p className="text-muted-foreground">No transfer attempt has been submitted.</p>
                      ) : transferAttempts.map((attempt) => (
                        <div key={attempt.id} className="rounded-lg border border-border/50 p-3">
                          <div className="flex justify-between gap-3">
                            <span>Attempt {attempt.attemptNumber}</span>
                            <span>{formatStatus(attempt.status)}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(attempt.submittedAt || attempt.createdAt)}{attempt.failureReason ? ` - ${attempt.failureReason}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                    <h3 className="text-sm font-semibold">Status audit trail</h3>
                    <div className="mt-3 grid gap-2 text-sm">
                      {statusHistory.length === 0 ? (
                        <p className="text-muted-foreground">No status history.</p>
                      ) : statusHistory.map((entry) => (
                        <div key={entry.id} className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0">
                          <span>{formatStatus(entry.fromStatus || "CREATED")} to {formatStatus(entry.toStatus)}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <details className="rounded-xl border border-border/60 bg-card/70 p-4">
                <summary className="cursor-pointer text-sm font-semibold">Technical metadata</summary>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <div>Provider: <span className="text-foreground">{payout.provider || "MANUAL"}</span></div>
                  <div>Provider status: <span className="text-foreground">{payout.providerStatus || "Not started"}</span></div>
                  <div>Batch ID: <span className="text-foreground">{payout.providerBatchId || "Not set"}</span></div>
                  <div>Payout ID: <span className="text-foreground">{payout.providerPayoutId || "Not set"}</span></div>
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

const AdjustmentStatusBadge = ({ status }) => (
  <Badge className={`${statusClass(status)} border`}>{formatStatus(status)}</Badge>
);

const BalanceAdjustmentsModal = ({
  organizer,
  data,
  loading,
  form,
  onFormChange,
  creating,
  cancellingId,
  onCreate,
  onCancel,
  onOpenChange,
}) => {
  const items = data?.items || [];
  const summary = data?.summary || {};

  return (
    <Dialog open={Boolean(organizer)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto border-border/70 bg-background/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet2 className="h-5 w-5 text-primary light:text-accent-foreground" />
            Organizer balance adjustments
          </DialogTitle>
          <DialogDescription>
            Chargebacks and corrections are deducted from future payouts until recovered or cancelled.
          </DialogDescription>
        </DialogHeader>

        {organizer && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <SummaryTile label="Organizer" value={organizer.name || "Organizer"} />
              <SummaryTile
                label="Open balance"
                value={formatMoney((summary.openRemainingAmountCents || 0) / 100, 2)}
                tone={summary.openRemainingAmountCents > 0 ? "text-amber-300 light:text-warning" : "text-emerald-300 light:text-success"}
              />
              <SummaryTile label="Open adjustments" value={summary.openAdjustmentCount || 0} />
            </div>

            <form className="rounded-xl border border-border/60 bg-card/70 p-4" onSubmit={onCreate}>
              <div className="grid gap-3 lg:grid-cols-[180px_160px_1fr_1fr_auto]">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.adjustmentType}
                  onChange={(event) => onFormChange({ adjustmentType: event.target.value })}
                >
                  <option value="CHARGEBACK">Chargeback</option>
                  <option value="POST_PAYOUT_REFUND">Post payout refund</option>
                  <option value="MANUAL_CORRECTION">Manual correction</option>
                </select>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={(event) => onFormChange({ amount: event.target.value })}
                />
                <Input
                  placeholder="Reference, optional"
                  value={form.chargebackReference}
                  onChange={(event) => onFormChange({ chargebackReference: event.target.value })}
                />
                <Input
                  placeholder="Reason"
                  value={form.reason}
                  onChange={(event) => onFormChange({ reason: event.target.value })}
                />
                <Button type="submit" disabled={creating}>
                  <Plus className="h-4 w-4" />
                  {creating ? "Adding..." : "Add"}
                </Button>
              </div>
            </form>

            <div className="rounded-xl border border-border/60 bg-card/70">
              <div className="border-b border-border/60 px-4 py-3">
                <h3 className="text-sm font-semibold">Adjustment history</h3>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No balance adjustments found for this organizer.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground">
                      <tr className="border-b border-border/60">
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Original</th>
                        <th className="px-4 py-3 text-right">Remaining</th>
                        <th className="px-4 py-3 text-left">Reference</th>
                        <th className="px-4 py-3 text-left">Reason</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((adjustment) => (
                        <tr key={adjustment.id} className="border-b border-border/40 last:border-0">
                          <td className="px-4 py-3">{formatStatus(adjustment.adjustmentType)}</td>
                          <td className="px-4 py-3"><AdjustmentStatusBadge status={adjustment.status} /></td>
                          <td className="px-4 py-3 text-right">{formatMoney(adjustment.amountCents / 100, 2)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatMoney(adjustment.remainingAmountCents / 100, 2)}</td>
                          <td className="px-4 py-3">{adjustment.chargebackReference || adjustment.payment?.providerPaymentId || "-"}</td>
                          <td className="max-w-[260px] truncate px-4 py-3">{adjustment.reason || "-"}</td>
                          <td className="px-4 py-3 text-right">
                            {["OPEN", "PARTIALLY_RECOVERED"].includes(adjustment.status) ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onCancel(adjustment)}
                                disabled={cancellingId === adjustment.id}
                              >
                                <Ban className="h-4 w-4" />
                                {cancellingId === adjustment.id ? "Cancelling..." : "Cancel"}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">No action</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PromoterPayouts = () => {
  const { items, statistics, filters, loading, isFetching, error, updateFilters, refresh: refreshPayouts, pagination, changePage } = useAdminPayouts();
  const queryClient = useQueryClient();
  const refresh = () => { refreshPayouts(); queryClient.invalidateQueries({ queryKey: ["upcoming-settlements"] }); };
  const [organizers, setOrganizers] = useState([]);
  const [organizerId, setOrganizerId] = useState("");
  const [organizerSearch, setOrganizerSearch] = useState("");
  const [organizerPage, setOrganizerPage] = useState(1);
  const [organizerPages, setOrganizerPages] = useState(1);
  const [organizersLoading, setOrganizersLoading] = useState(false);
  const [eventPage, setEventPage] = useState(1);
  const [eventPages, setEventPages] = useState(1);
  const [eventSearch, setEventSearch] = useState("");
  const [financialForm, setFinancialForm] = useState(emptyInputs);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const previewRequest = useRef(0);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [createForm, setCreateForm] = useState({ eventId: "", remarks: "" });
  const [preview, setPreview] = useState(null);
  const [lastTotals, setLastTotals] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [statusForm, setStatusForm] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [detailPayout, setDetailPayout] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [revisionBusy, setRevisionBusy] = useState(false);
  const [adjustmentOrganizer, setAdjustmentOrganizer] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState(null);
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentCreating, setAdjustmentCreating] = useState(false);
  const [adjustmentCancellingId, setAdjustmentCancellingId] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustmentType: "CHARGEBACK",
    amount: "",
    chargebackReference: "",
    reason: "",
  });

  useEffect(() => {
    let cancelled = false;
    setOrganizersLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await fetchAdminOrganizers({ page: organizerPage, limit: 20, search: organizerSearch });
        if (!cancelled) { setOrganizers(data?.organizers || []); setOrganizerPages(data?.pagination?.totalPages || 1); }
      } catch (error) { if (!cancelled) toast.error(error.message); }
      finally { if (!cancelled) setOrganizersLoading(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [organizerSearch, organizerPage]);
  useEffect(() => { setOrganizerId(""); }, [organizerSearch, organizerPage]);
  useEffect(() => {
    previewRequest.current += 1;
    setCreateForm({ eventId: "", remarks: "" }); setPreview(null); setLastTotals(null); setFinancialForm(emptyInputs());
  }, [organizerId, eventSearch, eventPage]);
  useEffect(() => {
    let cancelled = false;
    setEvents([]);
    if (!organizerId) { setEventsLoading(false); return; }
    setEventsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await fetchAdminEvents({ organizerId, ended: true, page: eventPage, limit: 20, search: eventSearch });
        if (!cancelled) { setEvents(data?.events || []); setEventPages(data?.pagination?.totalPages || 1); }
      } catch (error) { if (!cancelled) toast.error(error.message); }
      finally { if (!cancelled) setEventsLoading(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [organizerId, eventPage, eventSearch]);

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

  const invalidatePreview = () => { previewRequest.current += 1; setPreview(null); setPreviewLoading(false); };
  const handlePreviewPayout = useCallback(async () => {
    if (!createForm.eventId) return;
    const request = ++previewRequest.current;
    setPreviewLoading(true);
    setPreview(null);
    try {
      const result = await calculateEventPayout(createForm.eventId, calculationInputs(financialForm));
      if (request === previewRequest.current) { setPreview(result); setLastTotals(result.totals); }
    } catch (error) {
      if (request === previewRequest.current) toast.error(error.message || "Failed to calculate payout");
    } finally { if (request === previewRequest.current) setPreviewLoading(false); }
  }, [createForm.eventId, financialForm]);
  useEffect(() => {
    if (!createForm.eventId) return;
    const request = ++previewRequest.current;
    setPreviewLoading(true);
    calculateEventPayout(createForm.eventId).then(result => {
      if (request === previewRequest.current) { setPreview(result); setLastTotals(result.totals); }
    }).catch(error => { if (request === previewRequest.current) toast.error(error.message); })
      .finally(() => { if (request === previewRequest.current) setPreviewLoading(false); });
    return () => { previewRequest.current += 1; };
  }, [createForm.eventId]);

  const handleCreateEventPayout = async (event) => {
    event.preventDefault();
    if (isCreating || previewLoading || !preview?.eligible) return;
    if (!createForm.eventId) {
      toast.error("Select an event first.");
      return;
    }

    setIsCreating(true);
    try {
      await createEventPayout(createForm.eventId, {
        ...calculationInputs(financialForm), remarks: createForm.remarks.trim(),
        reason: financialForm.reason.trim() || undefined, previewFingerprint: preview.previewFingerprint,
      });
      toast.success("Event payout draft created.");
      setCreateForm({ eventId: "", remarks: "" });
      setFinancialForm(emptyInputs());
      setPreview(null);
      refresh();
    } catch (createError) {
      setPreview(createError.data?.data || null);
      toast.error(createError.message || "Failed to create event payout.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleApprove = async (payoutId) => {
    setUpdatingId(payoutId);
    try {
      await approveEventPayout(payoutId, { ...getActionPayload(payoutId), expectedRevision: items.find(item => item.id === payoutId)?.revisionNumber });
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

  const handleDisburse = async (payoutId) => {
    setUpdatingId(payoutId);
    try {
      await disbursePayout(payoutId, releaseTarget.revisionNumber);
      toast.success("Payout released to the Cashfree queue.");
      setReleaseTarget(null);
      refresh();
    } catch (error) {
      toast.error(error.message || "Failed to disburse payout.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualRetry = async (payoutId) => {
    const reason = statusForm[payoutId]?.remarks?.trim();
    if (!reason) return toast.error("Add a resolution reason first.");
    setUpdatingId(payoutId);
    try {
      await resolvePayout(payoutId, { action: "RETRY", reason });
      toast.success("Manual retry authorized. Review and disburse the payout.");
      refresh();
    } catch (error) {
      toast.error(error.message || "Failed to resolve payout.");
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

  const reloadDetail = async (payoutId) => {
    const payout = await fetchAdminPayoutDetail(payoutId);
    setDetailPayout(payout);
  };

  const handleCreateRevision = async (payoutId, payload) => {
    setRevisionBusy(true);
    try {
      await createPayoutRevision(payoutId, payload);
      await reloadDetail(payoutId);
      refresh();
      toast.success("Payout revision saved for approval.");
    } catch (revisionError) {
      toast.error(revisionError.message || "Failed to propose payout revision.");
    } finally {
      setRevisionBusy(false);
    }
  };

  const handleApproveRevision = async (payoutId, revisionId) => {
    setRevisionBusy(true);
    try {
      await approvePayoutRevision(payoutId, revisionId);
      await reloadDetail(payoutId);
      refresh();
      toast.success("Payout revision approved and ready for disbursement.");
    } catch (revisionError) {
      toast.error(revisionError.message || "Failed to approve payout revision.");
    } finally {
      setRevisionBusy(false);
    }
  };

  const loadBalanceAdjustments = async (organizer) => {
    if (!organizer?.id) return;

    setAdjustmentLoading(true);
    try {
      const data = await fetchAdminOrganizerBalanceAdjustments(organizer.id, { limit: 50 });
      setAdjustmentData(data);
    } catch (loadError) {
      toast.error(loadError.message || "Failed to load balance adjustments.");
    } finally {
      setAdjustmentLoading(false);
    }
  };

  const openBalanceAdjustments = async (organizer) => {
    setAdjustmentOrganizer(organizer);
    setAdjustmentData(null);
    setAdjustmentForm({
      adjustmentType: "CHARGEBACK",
      amount: "",
      chargebackReference: "",
      reason: "",
    });
    await loadBalanceAdjustments(organizer);
  };

  const updateAdjustmentForm = (updates) => {
    setAdjustmentForm((current) => ({ ...current, ...updates }));
  };

  const handleCreateAdjustment = async (event) => {
    event.preventDefault();
    if (!adjustmentOrganizer?.id) return;

    const amountCents = Math.round(Number(adjustmentForm.amount || 0) * 100);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      toast.error("Enter a valid adjustment amount.");
      return;
    }

    if (!adjustmentForm.reason.trim()) {
      toast.error("Add a reason for the adjustment.");
      return;
    }

    setAdjustmentCreating(true);
    try {
      await createAdminOrganizerBalanceAdjustment(adjustmentOrganizer.id, {
        adjustmentType: adjustmentForm.adjustmentType,
        amountCents,
        chargebackReference: adjustmentForm.chargebackReference.trim() || undefined,
        reason: adjustmentForm.reason.trim(),
      });
      toast.success("Balance adjustment recorded.");
      setAdjustmentForm({
        adjustmentType: "CHARGEBACK",
        amount: "",
        chargebackReference: "",
        reason: "",
      });
      await loadBalanceAdjustments(adjustmentOrganizer);
      refresh();
    } catch (createError) {
      toast.error(createError.message || "Failed to create balance adjustment.");
    } finally {
      setAdjustmentCreating(false);
    }
  };

  const handleCancelAdjustment = async (adjustment) => {
    if (!adjustment?.id) return;
    const reason = window.prompt("Reason for cancelling this adjustment");
    if (!reason?.trim()) return;

    setAdjustmentCancellingId(adjustment.id);
    try {
      await cancelAdminBalanceAdjustment(adjustment.id, { reason: reason.trim() });
      toast.success("Balance adjustment cancelled.");
      await loadBalanceAdjustments(adjustmentOrganizer);
      refresh();
    } catch (cancelError) {
      toast.error(cancelError.message || "Failed to cancel balance adjustment.");
    } finally {
      setAdjustmentCancellingId(null);
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
          <p className="text-muted-foreground">Automatic settlement after seven days. Review blocked payouts and resolve exceptions.</p>
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
            <p className="mt-1 text-2xl font-semibold text-amber-400 light:text-warning">{formatMoney(totals.reviewAmount)}</p>
            <p className="text-sm text-muted-foreground">Calculated or approved</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Processing</p>
            <p className="mt-1 text-2xl font-semibold text-blue-300 light:text-info">{formatMoney(totals.processingAmount)}</p>
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
            <Sparkles className="h-4 w-4 text-primary light:text-accent-foreground" />
            Create event payout
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Select an organizer and completed event, review the calculation, then create a payout draft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleCreateEventPayout}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="payout-organizer-search" className="text-sm font-medium">1. Organizer</label>
                <Input id="payout-organizer-search" placeholder="Search organizers" value={organizerSearch} onChange={e => { setOrganizerSearch(e.target.value); setOrganizerPage(1); }} />
                <select aria-label="Select organizer" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={organizerId} disabled={organizersLoading}
                  onChange={e => { invalidatePreview(); setOrganizerId(e.target.value); setEventPage(1); setEventSearch(""); setCreateForm({ eventId: "", remarks: "" }); setFinancialForm(emptyInputs()); }}>
                  <option value="">{organizersLoading ? "Loading organizers..." : "Select organizer"}</option>
                  {organizers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <div className="flex items-center justify-between text-xs">
                  <Button type="button" size="sm" variant="ghost" disabled={organizerPage <= 1 || organizersLoading} onClick={() => setOrganizerPage(page => page - 1)}>Previous</Button>
                  <span>Page {organizerPage} of {Math.max(1, organizerPages)}</span>
                  <Button type="button" size="sm" variant="ghost" disabled={organizerPage >= organizerPages || organizersLoading} onClick={() => setOrganizerPage(page => page + 1)}>Next</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="payout-event-search" className="text-sm font-medium">2. Completed event</label>
                <Input id="payout-event-search" disabled={!organizerId} placeholder="Search ended events" value={eventSearch} onChange={e => { setEventSearch(e.target.value); setEventPage(1); }} />
                <select aria-label="Select completed event" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={createForm.eventId} disabled={!organizerId || eventsLoading}
                  onChange={e => { invalidatePreview(); setCreateForm(current => ({ ...current, eventId: e.target.value })); setFinancialForm(emptyInputs()); }}>
                  <option value="">{eventsLoading ? "Loading events..." : "Select completed event"}</option>
                  {events.map(event => <option key={event.id} value={event.id}>{event.title} - {formatDate(event.endDate)}</option>)}
                </select>
                {organizerId && !eventsLoading && !events.length && <p className="text-xs text-muted-foreground">No matching completed events.</p>}
                <div className="flex items-center justify-between text-xs">
                  <Button type="button" size="sm" variant="ghost" disabled={eventPage <= 1 || eventsLoading} onClick={() => setEventPage(page => page - 1)}>Previous</Button>
                  <span>Page {eventPage} of {Math.max(1, eventPages)}</span>
                  <Button type="button" size="sm" variant="ghost" disabled={eventPage >= eventPages || eventsLoading} onClick={() => setEventPage(page => page + 1)}>Next</Button>
                </div>
              </div>
            </div>
            {createForm.eventId && <>
              <h3 className="text-sm font-medium">3. Review calculation</h3>
              <PayoutInputs value={financialForm} totals={lastTotals} disabled={isCreating || Boolean(preview?.existingPayout)}
                onChange={value => { invalidatePreview(); setFinancialForm(value); }} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={handlePreviewPayout} disabled={previewLoading || isCreating}>{previewLoading ? "Calculating..." : "Recalculate"}</Button>
                <Button type="submit" disabled={isCreating || previewLoading || !preview?.eligible}>{isCreating ? "Creating..." : "Create payout draft"}</Button>
              </div>
              <p className="text-xs text-muted-foreground">Release is available after the settlement hold. Creating a draft stops automatic release for this event.</p>
            </>}
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

          {preview?.existingPayout && <div role="status" className="mt-4 space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="font-medium">{["COMPLETED", "RECONCILED"].includes(preview.existingPayout.status) ? "Already paid - another payout is not allowed." : "A payout already exists for this event."}</p>
            <p className="text-sm">{formatStatus(preview.existingPayout.status)} - {formatMoney(preview.existingPayout.amount, 2)} - {preview.existingPayout.publicId}</p>
            {preview.existingPayout.completedAt && <p className="text-sm">Completed {formatDate(preview.existingPayout.completedAt)}</p>}
            <Button variant="outline" onClick={() => openDetail(preview.existingPayout.id)}>View existing payout</Button>
          </div>}
          {preview && (
            <div className="mt-4 space-y-4 rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{preview.eligible ? "Payout is eligible" : "Payout is blocked"}</p>
                  <p className="text-sm text-muted-foreground">
                    Includes {preview.lineItems?.length || 0} ticket settlement lines.
                  </p>
                </div>
                <Badge className={`${preview.eligible ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 light:text-success" : "border-destructive/40 bg-destructive/15 text-destructive"} border`}>
                  {preview.eligible ? "Ready for draft" : "Review required"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">Eligible from: {formatDate(preview.holdUntil)}</p>
              <PayoutBreakdown totals={previewTotals} />

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
                      <p className="text-sm font-semibold text-amber-300 light:text-warning">Warnings</p>
                      <ul className="mt-2 space-y-1 text-sm text-amber-200/80 light:text-warning">
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

      <PayoutDownloads filters={filters} />
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
                  ? "border-primary bg-primary text-primary-foreground light:bg-primaryCTA"
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
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary light:text-accent-foreground">
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
                          <SummaryTile label="Net payout" value={formatMoney(getPayoutAmount(payout), 2)} tone="text-accent light:text-accent-foreground" />
                        </div>
                      </div>

                      <div className="min-w-[220px] space-y-2 text-sm xl:text-right">
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="font-medium">{formatDate(payout.createdAt)}</p>
                        <p className="text-xs text-muted-foreground">Provider</p>
                        <p className="text-xs">{payout.providerStatus || payout.provider || "Manual review"}</p>
                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          <Button variant="outline" size="sm" onClick={() => openDetail(payout.id)}>
                            <Eye className="h-4 w-4" />
                            View details
                          </Button>
                          {payout.organizer?.id && (
                            <Button variant="outline" size="sm" onClick={() => openBalanceAdjustments(payout.organizer)}>
                              <Wallet2 className="h-4 w-4" />
                              Adjustments
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Banknote className="h-4 w-4" /> Bank</p>
                        <p className="truncate font-semibold">{payout.bank_details?.bankName || "No bank"}</p>
                        <p className="text-xs text-muted-foreground">
                          {payout.bank_details?.accountNumberMasked || (payout.bank_details?.accountNumberLast4 ? `****${payout.bank_details.accountNumberLast4}` : "No account")} - {payout.bank_details?.verificationStatus || "Unknown"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" /> Provider payout</p>
                        <p className="truncate font-semibold">{payout.providerPayoutId || "Not set"}</p>
                        <p className="text-xs text-muted-foreground">Batch {payout.providerBatchId || "not set"}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/40 p-3 md:col-span-2">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          {payout.failureReason || payout.blockedReason ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400 light:text-success" />}
                          Review notes
                        </p>
                        <p className="truncate font-semibold">{payout.failureReason || payout.blockedReason || payout.remarks || "No remarks"}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto]">
                      <Input
                        placeholder="Review, hold, or manual-resolution reason"
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
                        {isEventPayout && !payout.initiatedAt && !payout.automaticAttemptCount && reviewableStatuses.has(payout.status) && <Button variant="outline" onClick={async () => { try { const reason = statusForm[payout.id]?.remarks || statusForm[payout.id]?.blockedReason || ""; if (reason.trim().length < 10) { toast.error("Enter a recalculation reason of at least 10 characters in the remarks field"); return; } await apiFetch(`admin/payouts/${payout.id}/recalculate`, { method: "POST", body: JSON.stringify({ reason }) }); toast.success("Payout recalculated for review"); refresh(); } catch (error) { toast.error(error.message); } }}>Recalculate</Button>}
                        {isEventPayout && reviewableStatuses.has(payout.status) && (
                          <Button variant="outline" onClick={() => handleApprove(payout.id)} disabled={updatingId === payout.id}>
                            <ShieldCheck className="h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {payout.status === "APPROVED" && !payout.manualInterventionRequired && (
                          <Button onClick={() => setReleaseTarget(payout)} disabled={updatingId === payout.id}>
                            <Banknote className="h-4 w-4" />
                            Initiate payout
                          </Button>
                        )}
                        {payout.manualInterventionRequired && payout.providerStatus !== "REVISION_PENDING_APPROVAL" && (
                          <Button variant="outline" onClick={() => handleManualRetry(payout.id)} disabled={updatingId === payout.id}>
                            <RefreshCw className="h-4 w-4" />
                            Resolve & Retry
                          </Button>
                        )}
                        {isEventPayout && !terminalStatuses.has(payout.status) && (
                          <Button variant="outline" onClick={() => handleHold(payout.id)} disabled={updatingId === payout.id}>
                            <PauseCircle className="h-4 w-4" />
                            Hold
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" disabled={!pagination.hasPrevPage || isFetching} onClick={() => changePage(pagination.page - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span>
        <Button variant="outline" disabled={!pagination.hasNextPage || isFetching} onClick={() => changePage(pagination.page + 1)}>Next</Button>
      </div>
      <Dialog open={Boolean(releaseTarget)} onOpenChange={open => { if (!open && !updatingId) setReleaseTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Initiate this payout?</DialogTitle><DialogDescription>Confirm the organizer, event and amount before sending it to the payment queue.</DialogDescription></DialogHeader>
          <p>{releaseTarget?.organizer?.name} - {releaseTarget?.event?.title}</p>
          <p className="text-xl font-semibold">{formatMoney(getPayoutAmount(releaseTarget), 2)}</p>
          <p className="text-sm text-muted-foreground">Bank: {releaseTarget?.bank_details?.accountNumberMasked || "See verified destination in payout details"}</p>
          <p className="text-sm text-muted-foreground">The server rechecks eligibility and approval. Queued does not mean paid.</p>
          <Button disabled={Boolean(updatingId)} onClick={() => handleDisburse(releaseTarget.id)}>{updatingId ? "Submitting..." : "Confirm and initiate"}</Button>
        </DialogContent>
      </Dialog>
      <UpcomingSettlements admin />
      <PayoutDetailModal
        payout={detailPayout}
        loading={detailLoading}
        revisionBusy={revisionBusy}
        onCreateRevision={handleCreateRevision}
        onTakeControl={async (payout, reason) => {
          setRevisionBusy(true);
          try {
            await takeControlOfPayout(payout.id, { reason, expectedRevision: payout.revisionNumber });
            await reloadDetail(payout.id); refresh();
            toast.success("Payout moved to manual review.");
          } catch (error) { toast.error(error.message); }
          finally { setRevisionBusy(false); }
        }}
        onApproveRevision={handleApproveRevision}
        onOpenChange={(open) => {
          if (!open) {
            setDetailPayout(null);
            setDetailLoading(false);
          }
        }}
      />
      <BalanceAdjustmentsModal
        organizer={adjustmentOrganizer}
        data={adjustmentData}
        loading={adjustmentLoading}
        form={adjustmentForm}
        onFormChange={updateAdjustmentForm}
        creating={adjustmentCreating}
        cancellingId={adjustmentCancellingId}
        onCreate={handleCreateAdjustment}
        onCancel={handleCancelAdjustment}
        onOpenChange={(open) => {
          if (!open) {
            setAdjustmentOrganizer(null);
            setAdjustmentData(null);
            setAdjustmentLoading(false);
          }
        }}
      />
    </div>
  );
};

export default PromoterPayouts;
