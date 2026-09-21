import React, { useState, useEffect } from "react";
import { apiFetch, downloadFile } from "@/config/api";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Loader,
  Building2,
  CreditCard,
  Calendar,
  FileText,
} from "lucide-react";

const statusColors = {
  AUTO_APPROVED: "bg-blue-500/20 text-info border-blue-500/30",
  REVIEW_REQUIRED: "bg-yellow-500/20 text-warning border-yellow-500/30",
  APPROVED: "bg-blue-500/20 text-info border-blue-500/30",
  PENDING: "bg-yellow-500/20 text-warning border-yellow-500/30",
  PROCESSING: "bg-blue-500/20 text-info border-blue-500/30",
  COMPLETED: "bg-green-500/20 text-success border-green-500/30",
  FAILED: "bg-red-500/20 text-destructive border-red-500/30",
  RETRY_PENDING: "bg-yellow-500/20 text-warning border-yellow-500/30",
  RECONCILED: "bg-green-500/20 text-success border-green-500/30",
  CANCELLED: "bg-red-500/20 text-destructive border-red-500/30",
};

const formatStatus = (value) =>
  String(value || "UNKNOWN")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatAmount = (value) => Number(value || 0).toFixed(2);

const getPayoutAmount = (payout, summary) => {
  const isEventPayout = Boolean(summary || payout?.eventId || payout?.event);
  const snapshotAmount = Number(summary?.netPayoutAmount ?? payout?.netPayoutAmount);
  if (isEventPayout && Number.isFinite(snapshotAmount) && snapshotAmount > 0) {
    return snapshotAmount;
  }
  return Number(payout?.amount || 0);
};

const PayoutDetail = ({ payoutId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`organizer/me/payouts/${payoutId}`);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch payout detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [payoutId]);

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      await downloadFile(
        `/api/organizer/me/payouts/${payoutId}/invoice`,
        `payout-invoice-${payoutId.substring(0, 8)}.pdf`
      );
    } catch (err) {
      console.error("Failed to download invoice:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Payout not found.</p>
        <button onClick={onBack} className="mt-4 text-accent-foreground hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const {
    payout,
    bankDetails,
    organizer,
    event,
    summary,
    eventBreakdowns,
    revisions = [],
    transferAttempts = [],
    timeline = [],
  } = data;
  const payoutAmount = getPayoutAmount(payout, summary);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payout Detail</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {payout.invoiceNumber || payout.publicId || payout.id}
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadInvoice}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-primaryCTA hover:bg-primaryCTA-hover text-inverse rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {downloading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Invoice
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Payout Info */}
        <div className="bg-muted border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-accent-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Payout</h3>
          </div>
          <div className="text-2xl font-bold text-foreground mb-2">
            Rs. {payoutAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <Badge className={`${statusColors[payout.status] || ""} border text-xs`}>
            {formatStatus(payout.status)}
          </Badge>
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {payout.payoutDate
              ? new Date(payout.payoutDate).toLocaleDateString("en-IN")
              : "Pending"}
          </div>
          {payout.remarks && (
            <p className="mt-2 text-xs text-muted-foreground">{payout.remarks}</p>
          )}
          {payout.failureReason && (
            <p className="mt-2 text-xs text-destructive">{payout.failureReason}</p>
          )}
          {payout.blockedReason && (
            <p className="mt-2 text-xs text-warning">{payout.blockedReason}</p>
          )}
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>Expected eligibility: {payout.eligibleAt || payout.holdUntil ? new Date(payout.eligibleAt || payout.holdUntil).toLocaleString("en-IN") : "Not scheduled"}</p>
            <p>Transfer attempts: {payout.automaticAttemptCount || 0}/{payout.maxAutomaticAttempts || 3}</p>
            {payout.providerUtr && <p>UTR: {payout.providerUtr}</p>}
          </div>
        </div>

        {/* Event Info */}
        <div className="bg-muted border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-accent-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Event</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-foreground">{event?.title || "Organizer payout"}</p>
            {event?.type && <p className="text-muted-foreground">{formatStatus(event.type)}</p>}
            {payout.invoiceNumber && (
              <p className="text-muted-foreground text-xs">Invoice: {payout.invoiceNumber}</p>
            )}
          </div>
        </div>

        {/* Bank Info */}
        <div className="bg-muted border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-accent-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Bank Details</h3>
          </div>
          {bankDetails ? (
            <div className="space-y-1 text-sm">
              <p className="text-foreground">{bankDetails.accountHolder}</p>
              {bankDetails.bankName && <p className="text-muted-foreground">{bankDetails.bankName}</p>}
              {bankDetails.branchName && <p className="text-muted-foreground text-xs">Branch: {bankDetails.branchName}</p>}
              <p className="text-muted-foreground text-xs">
                A/C: {bankDetails.accountNumberMasked || (bankDetails.accountNumberLast4 ? `****${bankDetails.accountNumberLast4}` : "Not available")}
              </p>
              <p className="text-muted-foreground text-xs">IFSC: {bankDetails.ifscCode}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No bank details</p>
          )}
        </div>

        {/* Organizer Info */}
        <div className="bg-muted border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-accent-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Organizer</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-foreground">{organizer?.name}</p>
            {organizer?.email && <p className="text-muted-foreground">{organizer.email}</p>}
            {organizer?.gstNumber && (
              <p className="text-muted-foreground text-xs">GST: {organizer.gstNumber}</p>
            )}
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-muted border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Gross sales</p>
            <p className="mt-1 font-semibold text-foreground">Rs. {formatAmount(summary.grossTicketSales)}</p>
          </div>
          <div className="bg-muted border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Refunds/reserve</p>
            <p className="mt-1 font-semibold text-foreground">
              Rs. {formatAmount((summary.refundAmount || 0) + (summary.refundReserveAmount || 0))}
            </p>
          </div>
          <div className="bg-muted border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Platform fee</p>
            <p className="mt-1 font-semibold text-foreground">Rs. {formatAmount(summary.platformFeeAmount)}</p>
          </div>
          <div className="bg-muted border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{summary.gstType || "GST"}</p>
            <p className="mt-1 font-semibold text-foreground">Rs. {formatAmount(summary.gstTotal)}</p>
          </div>
          <div className="bg-muted border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Net payable</p>
            <p className="mt-1 font-semibold text-accent-foreground">Rs. {formatAmount(summary.netPayoutAmount)}</p>
          </div>
          {Number(summary.organizerBalanceAdjustmentCents || 0) > 0 && (
            <div className="bg-muted border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Balance recovered</p>
              <p className="mt-1 font-semibold text-warning">
                Rs. {formatAmount(Number(summary.organizerBalanceAdjustmentCents || 0) / 100)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Breakdown Table */}
      <div className="bg-muted border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Settlement Breakdown</h2>
        </div>
        {eventBreakdowns && eventBreakdowns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3">Ticket</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Qty</th>
                  <th className="px-6 py-3">Gross</th>
                  <th className="px-6 py-3">Refunds</th>
                  <th className="px-6 py-3">Net Sales</th>
                  <th className="px-6 py-3">Platform Fee</th>
                  <th className="px-6 py-3">GST</th>
                  <th className="px-6 py-3">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {eventBreakdowns.map((evt) => (
                  <React.Fragment key={evt.eventId}>
                    <tr className="bg-muted">
                      <td
                        colSpan={9}
                        className="px-6 py-3 text-sm font-semibold text-muted-foreground"
                      >
                        {evt.eventTitle}
                      </td>
                    </tr>
                    {evt.ticketBreakdowns.map((tb, idx) => (
                      <tr key={idx} className="hover:bg-muted">
                        <td className="px-6 py-3 text-sm text-muted-foreground pl-10">
                          {tb.ticketName}
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          Rs. {formatAmount(tb.ticketPrice)}
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          {tb.quantity}
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          Rs. {formatAmount(tb.ticketSubtotal)}
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          Rs. {((tb.refundAmount || 0) + (tb.refundReserveAmount || 0)).toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          Rs. {formatAmount(tb.netSales)}
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          Rs. {formatAmount(tb.platformFee)}
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          Rs. {formatAmount(tb.gstAmount)}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-foreground">
                          Rs. {formatAmount(tb.totalPayout)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-border">
                      <td colSpan={8} className="px-6 py-2 text-sm text-muted-foreground text-right">
                        Subtotal:
                      </td>
                      <td className="px-6 py-2 text-sm font-semibold text-foreground">
                        Rs. {formatAmount(evt.totals.netPayout)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td colSpan={8} className="px-6 py-4 text-right font-bold text-foreground">
                    Total Payout:
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground text-lg">
                    Rs. {payoutAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <p>No breakdown data available for this payout.</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground">Payout changes</h3>
          <p className="mt-1 text-xs text-muted-foreground">Audited corrections made before disbursement.</p>
          <div className="mt-4 space-y-3">
            {revisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payout revisions were made.</p>
            ) : revisions.map((revision) => (
              <div key={revision.publicId || revision.revisionNumber} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">Revision {revision.revisionNumber}</span>
                  <Badge className={`${statusColors[revision.status] || "bg-muted text-muted-foreground"} border`}>
                    {formatStatus(revision.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{revision.reason}</p>
                {(revision.adjustments || []).map((adjustment, index) => (
                  <div key={adjustment.publicId || adjustment.id || index} className="mt-2 flex justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">{formatStatus(adjustment.category)} - {adjustment.description}</span>
                    <span className={adjustment.direction === "CREDIT" ? "text-success" : "text-warning"}>
                      {adjustment.direction === "CREDIT" ? "+" : "-"}Rs. {formatAmount(adjustment.amountCents / 100)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Transfer attempts</h3>
            <div className="mt-4 space-y-3">
              {transferAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transfer attempt submitted yet.</p>
              ) : transferAttempts.map((attempt) => (
                <div key={attempt.attemptNumber} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex justify-between gap-3 text-foreground">
                    <span>Attempt {attempt.attemptNumber}</span>
                    <span>{formatStatus(attempt.status)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString("en-IN") : "Not submitted"}
                    {attempt.failureReason ? ` - ${attempt.failureReason}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Status history</h3>
            <div className="mt-4 space-y-2">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No status history available.</p>
              ) : timeline.map((entry) => (
                <div key={entry.id} className="flex justify-between gap-4 border-b border-border pb-2 text-sm last:border-0">
                  <span className="text-muted-foreground">{formatStatus(entry.fromStatus || "CREATED")} to {formatStatus(entry.toStatus)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutDetail;
