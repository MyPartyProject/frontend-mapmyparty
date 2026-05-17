import React, { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Loader,
  DollarSign,
  Calendar,
  Filter,
} from "lucide-react";
import PayoutDetail from "@/components/organizer/PayoutDetail";

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

const getPayoutAmount = (payout) => {
  const isEventPayout = Boolean(payout?.eventId || payout?.event);
  const snapshotAmount = Number(payout?.netPayoutAmount);
  if (isEventPayout && Number.isFinite(snapshotAmount) && snapshotAmount > 0) {
    return snapshotAmount;
  }
  return Number(payout?.amount || 0);
};

const OrganizerPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPayoutId, setSelectedPayoutId] = useState(null);
  const limit = 20;

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (statusFilter) params.append("status", statusFilter);
      const res = await apiFetch(`organizer/me/payouts?${params}`);
      if (res.success) {
        setPayouts(res.data.payouts);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch payouts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [page, statusFilter]);

  if (selectedPayoutId) {
    return (
      <PayoutDetail
        payoutId={selectedPayoutId}
        onBack={() => setSelectedPayoutId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Payouts</h1>
          <p className="text-sm text-white/60 mt-1">
            Track your earnings and payout history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-white/60" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Statuses</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="RETRY_PENDING">Retry Pending</option>
            <option value="RECONCILED">Reconciled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-6 h-6 animate-spin text-white/60" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <DollarSign className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No payouts found</p>
            <p className="text-sm mt-1">Your payouts will appear here once processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/50 uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Bank</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payouts.map((payout) => (
                  <tr
                    key={payout.id}
                    onClick={() => setSelectedPayoutId(payout.id)}
                    className="hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 text-sm text-white/80">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-white/40" />
                        {payout.payoutDate
                          ? new Date(payout.payoutDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : new Date(payout.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      <div>
                        <div className="max-w-[220px] truncate font-medium">
                          {payout.event?.title || "Organizer payout"}
                        </div>
                        <div className="text-xs text-white/40">
                          {payout.invoiceNumber || payout.publicId || payout.id.slice(0, 8)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      Rs. {getPayoutAmount(payout).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`${statusColors[payout.status] || ""} border text-xs`}
                      >
                        {formatStatus(payout.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {payout.bank_details ? (
                        <div>
                          <div>{payout.bank_details.bankName}</div>
                          <div className="text-xs text-white/40">
                            ****{payout.bank_details.accountNumber?.slice(-4)}
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50 max-w-[200px] truncate">
                      {payout.failureReason || payout.blockedReason || payout.remarks || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <span className="text-sm text-white/50">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/70"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/70">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/70"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerPayouts;
