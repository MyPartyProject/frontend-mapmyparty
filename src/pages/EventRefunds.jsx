import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/config/api";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  Clock,
  DollarSign,
} from "lucide-react";

const refundStatusColors = {
  REQUESTED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  APPROVED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DECLINED: "bg-red-500/20 text-red-400 border-red-500/30",
  PROCESSED: "bg-green-500/20 text-green-400 border-green-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const EventRefunds = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 20;

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (statusFilter) params.append("status", statusFilter);
      const res = await apiFetch(`organizer/events/${eventId}/refunds?${params}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch refunds:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchRefunds();
  }, [eventId, page, statusFilter]);

  const stats = data?.statistics;
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Event Refunds</h1>
            {data?.event && (
              <p className="text-sm text-white/60 mt-0.5">{data.event.title}</p>
            )}
          </div>
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
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="DECLINED">Declined</option>
            <option value="PROCESSED">Processed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
              <RotateCcw className="w-3.5 h-3.5" /> Total Refunds
            </div>
            <p className="text-xl font-bold text-white">{stats.totalRefunds}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" /> Total Amount
            </div>
            <p className="text-xl font-bold text-white">
              Rs. {stats.totalRefundAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" /> Pending
            </div>
            <p className="text-xl font-bold text-white">{stats.pendingCount}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-6 h-6 animate-spin text-white/60" />
          </div>
        ) : !data?.refunds?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <RotateCcw className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No refunds found</p>
            <p className="text-sm mt-1">Refund requests for this event will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/50 uppercase tracking-wider">
                  <th className="px-6 py-4">Attendee</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Booking</th>
                  <th className="px-6 py-4">Original Amount</th>
                  <th className="px-6 py-4">Refund Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Requested</th>
                  <th className="px-6 py-4">Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.refunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {refund.payment?.booking?.user?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {refund.payment?.booking?.user?.email || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {refund.payment?.booking?.id?.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      Rs. {refund.payment?.booking?.totalAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      Rs. {(refund.amountCents / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`text-xs border ${
                          refundStatusColors[refund.status] || ""
                        }`}
                      >
                        {refund.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {new Date(refund.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {refund.processedAt
                        ? new Date(refund.processedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <span className="text-sm text-white/50">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 text-white/70"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 text-white/70"
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

export default EventRefunds;
