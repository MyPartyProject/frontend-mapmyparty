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
  REVIEW_REQUIRED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  APPROVED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  PROCESSING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
  RETRY_PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  RECONCILED: "bg-green-500/20 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
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
        <Loader className="w-6 h-6 animate-spin text-white/60" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-white/50">
        <p>Payout not found.</p>
        <button onClick={onBack} className="mt-4 text-primary hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const { payout, bankDetails, organizer, event, summary, eventBreakdowns } = data;
  const payoutAmount = getPayoutAmount(payout, summary);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Payout Detail</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {payout.invoiceNumber || payout.publicId || payout.id}
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadInvoice}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
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
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white/70">Payout</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            Rs. {payoutAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <Badge className={`${statusColors[payout.status] || ""} border text-xs`}>
            {formatStatus(payout.status)}
          </Badge>
          <div className="mt-3 text-xs text-white/40 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {payout.payoutDate
              ? new Date(payout.payoutDate).toLocaleDateString("en-IN")
              : "Pending"}
          </div>
          {payout.remarks && (
            <p className="mt-2 text-xs text-white/50">{payout.remarks}</p>
          )}
          {payout.failureReason && (
            <p className="mt-2 text-xs text-red-400">{payout.failureReason}</p>
          )}
          {payout.blockedReason && (
            <p className="mt-2 text-xs text-yellow-400">{payout.blockedReason}</p>
          )}
        </div>

        {/* Event Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white/70">Event</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-white">{event?.title || "Organizer payout"}</p>
            {event?.type && <p className="text-white/60">{formatStatus(event.type)}</p>}
            {payout.invoiceNumber && (
              <p className="text-white/40 text-xs">Invoice: {payout.invoiceNumber}</p>
            )}
          </div>
        </div>

        {/* Bank Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white/70">Bank Details</h3>
          </div>
          {bankDetails ? (
            <div className="space-y-1 text-sm">
              <p className="text-white">{bankDetails.accountHolder}</p>
              <p className="text-white/60">{bankDetails.bankName}</p>
              <p className="text-white/40 text-xs">Branch: {bankDetails.branchName}</p>
              <p className="text-white/40 text-xs">
                A/C: ****{bankDetails.accountNumber?.slice(-4)}
              </p>
              <p className="text-white/40 text-xs">IFSC: {bankDetails.ifscCode}</p>
            </div>
          ) : (
            <p className="text-white/40 text-sm">No bank details</p>
          )}
        </div>

        {/* Organizer Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white/70">Organizer</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-white">{organizer?.name}</p>
            {organizer?.email && <p className="text-white/60">{organizer.email}</p>}
            {organizer?.gstNumber && (
              <p className="text-white/40 text-xs">GST: {organizer.gstNumber}</p>
            )}
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40">Gross sales</p>
            <p className="mt-1 font-semibold text-white">Rs. {formatAmount(summary.grossTicketSales)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40">Refunds/reserve</p>
            <p className="mt-1 font-semibold text-white">
              Rs. {formatAmount((summary.refundAmount || 0) + (summary.refundReserveAmount || 0))}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40">Platform fee</p>
            <p className="mt-1 font-semibold text-white">Rs. {formatAmount(summary.platformFeeAmount)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40">{summary.gstType || "GST"}</p>
            <p className="mt-1 font-semibold text-white">Rs. {formatAmount(summary.gstTotal)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40">Net payable</p>
            <p className="mt-1 font-semibold text-primary">Rs. {formatAmount(summary.netPayoutAmount)}</p>
          </div>
          {Number(summary.organizerBalanceAdjustmentCents || 0) > 0 && (
            <div className="bg-white/5 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-white/40">Balance recovered</p>
              <p className="mt-1 font-semibold text-yellow-300">
                Rs. {formatAmount(Number(summary.organizerBalanceAdjustmentCents || 0) / 100)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Breakdown Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Settlement Breakdown</h2>
        </div>
        {eventBreakdowns && eventBreakdowns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/50 uppercase tracking-wider">
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
              <tbody className="divide-y divide-white/5">
                {eventBreakdowns.map((evt) => (
                  <React.Fragment key={evt.eventId}>
                    <tr className="bg-white/[0.02]">
                      <td
                        colSpan={9}
                        className="px-6 py-3 text-sm font-semibold text-white/80"
                      >
                        {evt.eventTitle}
                      </td>
                    </tr>
                    {evt.ticketBreakdowns.map((tb, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="px-6 py-3 text-sm text-white/70 pl-10">
                          {tb.ticketName}
                        </td>
                        <td className="px-6 py-3 text-sm text-white/60">
                          Rs. {formatAmount(tb.ticketPrice)}
                        </td>
                        <td className="px-6 py-3 text-sm text-white/60">
                          {tb.quantity}
                        </td>
                        <td className="px-6 py-3 text-sm text-white/60">
                          Rs. {formatAmount(tb.ticketSubtotal)}
                        </td>
                        <td className="px-6 py-3 text-sm text-white/60">
                          Rs. {((tb.refundAmount || 0) + (tb.refundReserveAmount || 0)).toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-white/60">
                          Rs. {formatAmount(tb.netSales)}
                        </td>
                        <td className="px-6 py-3 text-sm text-white/60">
                          Rs. {formatAmount(tb.platformFee)}
                        </td>
                        <td className="px-6 py-3 text-sm text-white/60">
                          Rs. {formatAmount(tb.gstAmount)}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-white">
                          Rs. {formatAmount(tb.totalPayout)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-white/10">
                      <td colSpan={8} className="px-6 py-2 text-sm text-white/50 text-right">
                        Subtotal:
                      </td>
                      <td className="px-6 py-2 text-sm font-semibold text-white">
                        Rs. {formatAmount(evt.totals.netPayout)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-white/20">
                  <td colSpan={8} className="px-6 py-4 text-right font-bold text-white">
                    Total Payout:
                  </td>
                  <td className="px-6 py-4 font-bold text-white text-lg">
                    Rs. {payoutAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-white/40">
            <p>No breakdown data available for this payout.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutDetail;
