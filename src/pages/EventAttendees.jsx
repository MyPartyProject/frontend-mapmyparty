import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, downloadFile } from "@/config/api";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Search,
  Loader,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  DollarSign,
  Ticket,
} from "lucide-react";

const EventAttendees = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const limit = 50;

  const fetchAttendees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.append("search", search);
      const res = await apiFetch(`booking/event/${eventId}/attendees?${params}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch attendees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchAttendees();
  }, [eventId, page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (eventId) {
        setPage(1);
        fetchAttendees();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      await downloadFile(
        `/api/booking/event/${eventId}/attendees/download`,
        `attendees-${eventId.substring(0, 8)}.csv`
      );
    } catch (err) {
      console.error("Failed to download CSV:", err);
    } finally {
      setDownloading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-white">Event Attendees</h1>
            {data?.event && (
              <p className="text-sm text-white/60 mt-0.5">{data.event.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search attendees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
            />
          </div>
          <button
            onClick={handleDownloadCSV}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {downloading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Total Bookings
            </div>
            <p className="text-xl font-bold text-white">{stats.totalBookings}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" /> Revenue
            </div>
            <p className="text-xl font-bold text-white">
              Rs. {stats.totalRevenue?.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
              <Ticket className="w-3.5 h-3.5" /> Tickets Sold
            </div>
            <p className="text-xl font-bold text-white">{stats.totalTickets}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Check-in Rate
            </div>
            <p className="text-xl font-bold text-white">{stats.checkInRate}%</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-6 h-6 animate-spin text-white/60" />
          </div>
        ) : !data?.attendees?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <Users className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No attendees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/50 uppercase tracking-wider">
                  <th className="px-6 py-4">Attendee</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Tickets</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.attendees.map((booking) => {
                  const allCheckedIn = booking.booking_items?.every(
                    (i) => i.checkedIn
                  );
                  const someCheckedIn = booking.booking_items?.some(
                    (i) => i.checkedIn
                  );
                  return (
                    <tr key={booking.id} className="hover:bg-white/5">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">
                          {booking.user?.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white/60">{booking.user?.email}</p>
                        <p className="text-xs text-white/40">{booking.user?.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        {booking.booking_items?.map((item) => (
                          <div key={item.id} className="text-sm text-white/70">
                            {item.ticket?.name} x{item.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        Rs. {booking.totalAmount?.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`text-xs border ${
                            booking.payment?.status === "SUCCESS"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : booking.payment?.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {booking.payment?.status || "N/A"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {allCheckedIn ? (
                          <span className="flex items-center gap-1 text-sm text-green-400">
                            <CheckCircle2 className="w-4 h-4" /> All
                          </span>
                        ) : someCheckedIn ? (
                          <span className="text-sm text-yellow-400">Partial</span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-white/40">
                            <XCircle className="w-4 h-4" /> No
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

export default EventAttendees;
