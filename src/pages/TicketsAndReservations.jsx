import React, { useState } from "react";
import { ArrowLeft, Download, Search, Filter, CheckCircle, Clock, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const badgeTones = {
  confirmed: "from-emerald-400 to-emerald-500 text-emerald-50 border-emerald-400/30",
  pending: "from-amber-300 to-amber-500 text-amber-900 border-amber-400/50",
  cancelled: "from-red-400 to-red-500 text-red-50 border-red-400/30",
  default: "from-slate-600 to-slate-700 text-slate-50 border-slate-500/40",
};

const TicketsAndReservations = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Empty data - to be populated from API
  const ticketsData = [];
  const reservationsData = [];

  // Statistics based on actual data
  const statistics = {
    totalTickets: ticketsData.length,
    confirmedTickets: ticketsData.filter((t) => t.status === "confirmed").length,
    pendingTickets: ticketsData.filter((t) => t.status === "pending").length,
    cancelledTickets: ticketsData.filter((t) => t.status === "cancelled").length,
    checkedIn: ticketsData.filter((t) => t.checkInStatus === "checked-in").length,
    totalReservations: reservationsData.length,
    confirmedReservations: reservationsData.filter((r) => r.status === "confirmed").length,
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const baseClass = "px-3 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 border bg-gradient-to-r";
    const tone = badgeTones[status] || badgeTones.default;
    const Icon = status === "confirmed" ? CheckCircle : status === "pending" ? Clock : status === "cancelled" ? XCircle : AlertCircle;
    const label = status === "confirmed" ? "Confirmed" : status === "pending" ? "Pending" : status === "cancelled" ? "Cancelled" : status;
    return (
      <span className={`${baseClass} ${tone}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  // Get check-in status badge
  const getCheckInBadge = (status) => {
    const baseClass = "px-2 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 border bg-gradient-to-r";
    if (status === "checked-in")
      return (
        <span className={`${baseClass} from-cyan-400 to-blue-500 text-white border-blue-400/30 light:text-foreground`}>
          <CheckCircle className="w-3 h-3" />
          Checked In
        </span>
      );
    if (status === "pending")
      return (
        <span className={`${baseClass} from-slate-500 to-slate-600 text-white border-slate-400/40 light:text-foreground`}>
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    if (status === "cancelled")
      return (
        <span className={`${baseClass} from-red-500 to-rose-500 text-white border-red-400/40 light:text-foreground`}>
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    return null;
  };

  // Filter tickets
  const filteredTickets = ticketsData.filter((ticket) => {
    const matchesFilter = selectedFilter === "all" || ticket.status === selectedFilter;
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05060c] via-[#090f1c] to-[#05060c] text-white light:from-surface light:via-surface light:to-surface light:text-foreground">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 bg-white/5 backdrop-blur light:border-border light:bg-muted">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition light:bg-muted light:border-border light:hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5 text-white/80 light:text-muted-foreground" />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/50 flex items-center gap-2 light:text-muted-foreground">
                <Sparkles className="w-4 h-4 text-red-400 light:text-destructive" /> Operations
              </p>
              <h1 className="text-2xl font-extrabold">Tickets & Reservations</h1>
              <p className="text-sm text-white/60 light:text-muted-foreground">Keep a pulse on ticket flow and reservation health.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-blue-500 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition light:text-foreground">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
            <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Total Tickets</p>
            <p className="text-3xl font-bold mt-2">{statistics.totalTickets}</p>
            <p className="text-sm text-white/60 mt-1 light:text-muted-foreground">{statistics.confirmedTickets} confirmed</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
            <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Checked In</p>
            <p className="text-3xl font-bold mt-2 text-cyan-200 light:text-info">{statistics.checkedIn}</p>
            <p className="text-sm text-white/60 mt-1 light:text-muted-foreground">
              {Math.round((statistics.checkedIn / statistics.totalTickets) * 100)}% check-in rate
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
            <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold mt-2 text-amber-200 light:text-warning">{statistics.pendingTickets}</p>
            <p className="text-sm text-white/60 mt-1 light:text-muted-foreground">Awaiting confirmation</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
            <p className="text-xs uppercase tracking-wide text-white/60 light:text-muted-foreground">Total Reservations</p>
            <p className="text-3xl font-bold mt-2 text-emerald-200 light:text-success">{statistics.totalReservations}</p>
            <p className="text-sm text-white/60 mt-1 light:text-muted-foreground">{statistics.confirmedReservations} confirmed</p>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur shadow-lg shadow-black/30 mb-4 light:bg-muted light:border-border light:shadow-black/5">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3 light:border-border">
            <h2 className="text-xl font-semibold">Tickets</h2>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-white/50 flex items-center gap-1 light:text-muted-foreground">
                <Filter className="w-4 h-4" /> Filter by status
              </span>
              <div className="flex gap-2">
                {["all", "confirmed", "pending", "cancelled"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                      selectedFilter === filter
                        ? "bg-gradient-to-r from-red-500 to-blue-500 text-white shadow-md shadow-red-500/20 light:text-foreground"
                        : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 light:bg-muted light:border-border light:text-muted-foreground light:hover:bg-muted"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="px-5 py-4 border-b border-white/10 flex gap-4 flex-wrap light:border-border">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-white/50 light:text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by ticket ID, customer name, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/60 light:bg-muted light:border-border light:text-foreground light:placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto">
            {filteredTickets.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-white/30 light:text-muted-foreground" />
                <p className="text-white/60 text-lg font-medium light:text-muted-foreground">No tickets found</p>
                <p className="text-white/40 text-sm mt-1 light:text-muted-foreground">Tickets will appear here when customers make purchases</p>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-white/60 uppercase text-[11px] light:bg-muted light:border-border light:text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Ticket ID</th>
                    <th className="px-5 py-3 text-left font-semibold">Event</th>
                    <th className="px-5 py-3 text-left font-semibold">Customer</th>
                    <th className="px-5 py-3 text-left font-semibold">Type</th>
                    <th className="px-5 py-3 text-left font-semibold">Qty</th>
                    <th className="px-5 py-3 text-left font-semibold">Amount</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 light:divide-border">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-white/5 transition light:hover:bg-muted">
                      <td className="px-5 py-4 font-semibold text-white light:text-foreground">{ticket.id}</td>
                      <td className="px-5 py-4 text-white/80 light:text-muted-foreground">{ticket.eventName}</td>
                      <td className="px-5 py-4 text-white/80 light:text-muted-foreground">
                        <div>{ticket.customerName}</div>
                        <div className="text-xs text-white/50 light:text-muted-foreground">{ticket.email}</div>
                      </td>
                      <td className="px-5 py-4 text-white/80 light:text-muted-foreground">{ticket.ticketType}</td>
                      <td className="px-5 py-4 text-white/80 light:text-muted-foreground">{ticket.quantity}</td>
                      <td className="px-5 py-4 font-semibold text-white light:text-foreground">{ticket.totalAmount}</td>
                      <td className="px-5 py-4">{getStatusBadge(ticket.status)}</td>
                      <td className="px-5 py-4">{getCheckInBadge(ticket.checkInStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Reservations Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur shadow-lg shadow-black/30 light:bg-muted light:border-border light:shadow-black/5">
          <div className="px-5 py-4 border-b border-white/10 light:border-border">
            <h2 className="text-xl font-semibold">Reservations</h2>
          </div>

          {/* Reservations Table */}
          <div className="overflow-x-auto">
            {reservationsData.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-white/30 light:text-muted-foreground" />
                <p className="text-white/60 text-lg font-medium light:text-muted-foreground">No reservations found</p>
                <p className="text-white/40 text-sm mt-1 light:text-muted-foreground">Reservations will appear here when customers book seats</p>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-white/60 uppercase text-[11px] light:bg-muted light:border-border light:text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Reservation ID</th>
                    <th className="px-5 py-3 text-left font-semibold">Event</th>
                    <th className="px-5 py-3 text-left font-semibold">Customer</th>
                    <th className="px-5 py-3 text-left font-semibold">Type</th>
                    <th className="px-5 py-3 text-left font-semibold">Seats</th>
                    <th className="px-5 py-3 text-left font-semibold">Event Date</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 light:divide-border">
                  {reservationsData.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-white/5 transition light:hover:bg-muted">
                      <td className="px-5 py-4 font-semibold text-white light:text-foreground">{reservation.id}</td>
                      <td className="px-5 py-4 text-white/80 light:text-muted-foreground">{reservation.eventName}</td>
                      <td className="px-5 py-4 text-white/80 light:text-muted-foreground">
                        <div>{reservation.customerName}</div>
                        <div className="text-xs text-white/50 light:text-muted-foreground">{reservation.email}</div>
                      </td>
                      <td className="px-5 py-4 text-white/80 light:text-muted-foreground">{reservation.reservationType}</td>
                      <td className="px-5 py-4 text-white/80 light:text-muted-foreground">{reservation.seats}</td>
                      <td className="px-5 py-4 text-white/80 light:text-muted-foreground">{reservation.eventDate}</td>
                      <td className="px-5 py-4">{getStatusBadge(reservation.status)}</td>
                      <td className="px-5 py-4 text-white/80 max-w-xs truncate light:text-muted-foreground" title={reservation.notes}>
                        {reservation.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketsAndReservations;
