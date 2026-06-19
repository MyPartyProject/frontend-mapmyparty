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
        <span className={`${baseClass} from-cyan-400 to-blue-500 text-white border-blue-400/30`}>
          <CheckCircle className="w-3 h-3" />
          Checked In
        </span>
      );
    if (status === "pending")
      return (
        <span className={`${baseClass} from-slate-500 to-slate-600 text-white border-slate-400/40`}>
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    if (status === "cancelled")
      return (
        <span className={`${baseClass} from-red-500 to-rose-500 text-white border-red-400/40`}>
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-muted/70 border border-border/70 hover:bg-muted transition"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-400" /> Operations
              </p>
              <h1 className="text-2xl font-extrabold">Tickets & Reservations</h1>
              <p className="text-sm text-muted-foreground">Keep a pulse on ticket flow and reservation health.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-blue-500 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Tickets</p>
            <p className="text-3xl font-bold mt-2">{statistics.totalTickets}</p>
            <p className="text-sm text-muted-foreground mt-1">{statistics.confirmedTickets} confirmed</p>
          </div>

          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Checked In</p>
            <p className="text-3xl font-bold mt-2 text-cyan-200">{statistics.checkedIn}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round((statistics.checkedIn / statistics.totalTickets) * 100)}% check-in rate
            </p>
          </div>

          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold mt-2 text-amber-200">{statistics.pendingTickets}</p>
            <p className="text-sm text-muted-foreground mt-1">Awaiting confirmation</p>
          </div>

          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Reservations</p>
            <p className="text-3xl font-bold mt-2 text-emerald-200">{statistics.totalReservations}</p>
            <p className="text-sm text-muted-foreground mt-1">{statistics.confirmedReservations} confirmed</p>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="bg-card border border-border/70 rounded-2xl shadow-[var(--shadow-card)] mb-4">
          <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-semibold">Tickets</h2>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="w-4 h-4" /> Filter by status
              </span>
              <div className="flex gap-2">
                {["all", "confirmed", "pending", "cancelled"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                      selectedFilter === filter
                        ? "bg-gradient-to-r from-red-500 to-blue-500 text-white shadow-md shadow-red-500/20"
                        : "bg-muted/60 border border-border/70 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="px-5 py-4 border-b border-border/70 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by ticket ID, customer name, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </div>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto">
            {filteredTickets.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg font-medium">No tickets found</p>
                <p className="text-muted-foreground text-sm mt-1">Tickets will appear here when customers make purchases</p>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-muted/60 border-b border-border/70 text-muted-foreground uppercase text-[11px]">
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
                <tbody className="divide-y divide-border/50">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-muted/45 transition">
                      <td className="px-5 py-4 font-semibold text-foreground">{ticket.id}</td>
                      <td className="px-5 py-4 text-foreground">{ticket.eventName}</td>
                      <td className="px-5 py-4 text-foreground">
                        <div>{ticket.customerName}</div>
                        <div className="text-xs text-muted-foreground">{ticket.email}</div>
                      </td>
                      <td className="px-5 py-4 text-foreground">{ticket.ticketType}</td>
                      <td className="px-5 py-4 text-foreground">{ticket.quantity}</td>
                      <td className="px-5 py-4 font-semibold text-foreground">{ticket.totalAmount}</td>
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
        <div className="bg-card border border-border/70 rounded-2xl shadow-[var(--shadow-card)]">
          <div className="px-5 py-4 border-b border-border/70">
            <h2 className="text-xl font-semibold">Reservations</h2>
          </div>

          {/* Reservations Table */}
          <div className="overflow-x-auto">
            {reservationsData.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg font-medium">No reservations found</p>
                <p className="text-muted-foreground text-sm mt-1">Reservations will appear here when customers book seats</p>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-muted/60 border-b border-border/70 text-muted-foreground uppercase text-[11px]">
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
                <tbody className="divide-y divide-border/50">
                  {reservationsData.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-muted/45 transition">
                      <td className="px-5 py-4 font-semibold text-foreground">{reservation.id}</td>
                      <td className="px-5 py-4 text-foreground">{reservation.eventName}</td>
                      <td className="px-5 py-4 text-foreground">
                        <div>{reservation.customerName}</div>
                        <div className="text-xs text-muted-foreground">{reservation.email}</div>
                      </td>
                      <td className="px-5 py-4 text-foreground">{reservation.reservationType}</td>
                      <td className="px-5 py-4 text-foreground">{reservation.seats}</td>
                      <td className="px-5 py-4 text-foreground">{reservation.eventDate}</td>
                      <td className="px-5 py-4">{getStatusBadge(reservation.status)}</td>
                      <td className="px-5 py-4 text-foreground max-w-xs truncate" title={reservation.notes}>
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
