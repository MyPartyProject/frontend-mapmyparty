import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Shield,
  Sparkles,
  Clock,
  MapPin,
  Radio,
  Users,
  Ticket,
  QrCode,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { apiFetch } from "@/config/api";
import QRScanner from "@/components/QRScanner";
import CheckInResult from "@/components/CheckInResult";
import { buildCanonicalQrPayload, extractValidQrToken } from "@/utils/qrPayload";

// Date formatter utility
const formatDateTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

const buildQrPreview = (value, maxLength = 120) => {
  if (typeof value !== "string") return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized;
};

const transformEvent = (event) => {
  if (!event) return null;
  const ticketTypes = (event.tickets || []).map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    price: t.price,
    totalQty: t.totalQty || 0,
    soldQty: t.soldQty || 0,
    checkedIn: 0,
  }));

  return {
    id: event.id,
    title: event.title,
    category: event.category,
    subCategory: event.subCategory,
    venue: event.venues?.[0]?.name || "Venue TBD",
    city: event.venues?.[0]?.city || "",
    state: event.venues?.[0]?.state || "",
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: event.eventStatus,
    publishStatus: event.publishStatus,
    ticketTypes,
  };
};

const Stat = ({ label, value, hint, icon: Icon }) => (
  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg shadow-black/25">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-emerald-300" />} {label}
      </p>
      <span className="text-[10px] text-white/40">{hint}</span>
    </div>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="bg-[#0d1526] border border-white/10 rounded-2xl p-5 w-full max-w-lg shadow-2xl shadow-black/40">
        {children}
      </div>
    </div>
  );
};

const TicketPanel = ({
  ticket,
  decision,
  onAllow,
  onReject,
  locked,
  message,
  error,
  onReset,
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/30 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-amber-300" /> Ticket
        </p>
        <h3 className="text-2xl font-bold">{ticket.holder}</h3>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-white/80">{ticket.ticketType}</p>
        <p className="text-lg font-bold">Qty {ticket.quantity}</p>
        <p className="text-sm text-white/60">₹{ticket.price?.toLocaleString()}</p>
      </div>
    </div>

    <div className="rounded-xl bg-black/20 border border-white/10 p-3 text-sm text-white/70 flex items-center gap-2">
      <Info className="w-4 h-4 text-cyan-300" />
      {decision === "allowed"
        ? "Allowed • Check-in completed"
        : decision === "rejected"
        ? "Rejected • Entry denied"
        : ticket.status}
    </div>

    {message && <p className="text-sm text-emerald-300">{message}</p>}
    {error && <p className="text-sm text-red-300">{error}</p>}

    <div className="flex items-center gap-2">
      <button
        onClick={onAllow}
        disabled={locked}
        className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-50 hover:bg-emerald-500/25 transition disabled:opacity-60"
      >
        Allow Entry
      </button>
      <button
        onClick={onReject}
        disabled={locked}
        className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/30 text-red-50 hover:bg-red-500/25 transition disabled:opacity-60"
      >
        Reject
      </button>
      <button
        onClick={onReset}
        className="ml-auto px-4 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm"
      >
        Verify another
      </button>
    </div>
  </div>
);

const ReceptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingTicket, setLoadingTicket] = useState(false);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchEventData = useCallback(async () => {
    if (!id || isFetchingRef.current || hasFetchedRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const [eventResponse, checkInsResponse] = await Promise.allSettled([
        apiFetch(`event/${id}`),
        apiFetch(`booking/event/${id}/check-ins?checkedIn=true&limit=1`),
      ]);

      if (!isMountedRef.current) return;

      if (eventResponse.status === "fulfilled") {
        const eventData = eventResponse.value.data || eventResponse.value;
        setEvent(transformEvent(eventData));
      } else {
        throw new Error(eventResponse.reason?.message || "Failed to load event");
      }

      if (checkInsResponse.status === "fulfilled") {
        const checkInsData = checkInsResponse.value.data || checkInsResponse.value;
        const totalCheckedIn = checkInsData.pagination?.total || 0;
        setAccepted(totalCheckedIn);
      }

      hasFetchedRef.current = true;
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Error fetching reception data:", err);
      setError(err.message || "Failed to load reception data");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [id]);

  const ticketTotals = useMemo(() => {
    if (!event) return { total: 0, sold: 0, checkedIn: 0, types: 0 };
    return event.ticketTypes.reduce(
      (acc, t) => {
        acc.total += t.totalQty || 0;
        acc.sold += t.soldQty || 0;
        acc.checkedIn += t.checkedIn || 0;
        acc.types += 1;
        return acc;
      },
      { total: 0, sold: 0, checkedIn: 0, types: 0 }
    );
  }, [event]);

  const [accepted, setAccepted] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [ticketInput, setTicketInput] = useState("");
  const [ticket, setTicket] = useState(null);
  const [decision, setDecision] = useState(null);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);
  const [processing, setProcessing] = useState(false);

  // QR Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanProcessing, setScanProcessing] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);

  const buildReceptionRequestBody = useCallback(
    (payload) => JSON.stringify({ eventId: id, ...payload }),
    [id]
  );

  const ensureCurrentEventMatch = useCallback(
    (scanPayload) => {
      const scannedEventId = scanPayload?.event?.id;
      if (scannedEventId && scannedEventId !== id) {
        throw new Error("This ticket belongs to a different event.");
      }
    },
    [id]
  );

  useEffect(() => {
    isMountedRef.current = true;
    hasFetchedRef.current = false;
    fetchEventData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchEventData]);

  useEffect(() => {
    setRejected(0);
    setTicket(null);
    setDecision(null);
    setMessage("");
    setTicketInput("");
    setReason("");
  }, [ticketTotals, id]);

  if (loading && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#05060c] via-[#0a0f1c] to-[#05060c] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-300" />
          <p className="text-sm text-white/70">Loading reception...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#05060c] via-[#0a0f1c] to-[#05060c] text-white">
        <div className="text-center space-y-3">
          <p className="text-lg">Failed to load reception</p>
          <p className="text-sm text-white/60">{error}</p>
          <button
            onClick={() => {
              hasFetchedRef.current = false;
              fetchEventData();
            }}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#05060c] via-[#0a0f1c] to-[#05060c] text-white">
        <div className="text-center space-y-3">
          <p className="text-lg">Event not found</p>
          <button
            onClick={() => navigate("/organizer/reception")}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition"
          >
            Back to reception
          </button>
        </div>
      </div>
    );
  }

  const resetTicket = () => {
    setTicket(null);
    setDecision(null);
    setMessage("");
    setReason("");
    setTicketInput("");
    setProcessing(false);
  };

  const handleQuickCheckIn = async (qrDataString) => {
    if (scanProcessing || checkInResult) return;

    setScanProcessing(true);
    setCheckInResult(null);

    const rawQrPreview = buildQrPreview(qrDataString);
    let normalizedQrToken = null;
    let normalizedQrPayload = null;

    try {
      normalizedQrToken = extractValidQrToken(qrDataString);
      normalizedQrPayload = buildCanonicalQrPayload(qrDataString);

      if (!normalizedQrToken || !normalizedQrPayload) {
        console.warn("[ReceptionDetail] Unable to normalize scanned QR payload", {
          eventId: id,
          rawType: typeof qrDataString,
          rawPreview: rawQrPreview,
        });
        throw new Error("Unable to read this QR ticket. Try scanning again or use the manual code.");
      }

      const response = await apiFetch("booking/quick-check-in-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: buildReceptionRequestBody({
          qrData: normalizedQrPayload,
          qrToken: normalizedQrToken,
        }),
      });
      const data = response.data || response;
      ensureCurrentEventMatch(data);

      if (data.alreadyCheckedIn) {
        setCheckInResult({
          type: "already_checked_in",
          data,
        });
      } else {
        setCheckInResult({
          type: "success",
          data,
        });
        setAccepted((prev) => prev + 1);
      }
    } catch (err) {
      console.error("[ReceptionDetail] Quick check-in failed", {
        eventId: id,
        message: err?.message || "Check-in failed",
        rawPreview: rawQrPreview,
        normalizedQrToken,
      });
      setCheckInResult({
        type: "error",
        error: err.message || "Check-in failed. Please try again.",
      });
    } finally {
      setScanProcessing(false);
    }
  };

  const handleScanNextFromResult = () => {
    setCheckInResult(null);
    // Scanner stays open — ready for next scan
  };

  const handleCloseResult = () => {
    setCheckInResult(null);
    setShowScanner(false);
  };

  const buildTicketFromScan = (scanPayload) => {
    ensureCurrentEventMatch(scanPayload);

    const bookingItem = scanPayload?.bookingItem;
    const booking = scanPayload?.booking;
    const user = scanPayload?.user;
    const ticketInfo = scanPayload?.ticket;
    const scannedEvent = scanPayload?.event;
    const eventInfo =
      event && (!scannedEvent?.id || scannedEvent.id === event.id)
        ? event
        : scannedEvent || event;

    if (!bookingItem || !ticketInfo || !eventInfo) return null;

    const quantity = bookingItem.quantity || 1;
    const price = bookingItem.ticketPrice || ticketInfo.price || 0;
    const base = price * quantity;

    return {
      ticketId: bookingItem.id,
      bookingItemId: bookingItem.id,
      bookingId: booking?.id,
      holder: user?.name || "Guest",
      email: user?.email || "",
      phone: user?.phone || "",
      ticketType: ticketInfo.name || ticketInfo.type || "Ticket",
      quantity,
      price,
      attendees: [
        {
          id: user?.id || bookingItem.id,
          name: user?.name || "Guest",
          email: user?.email || "",
          phone: user?.phone || "",
          type: ticketInfo.name || ticketInfo.type || "Ticket",
        },
      ],
      breakdown: { base, fees: 0, total: base },
      eventTitle: eventInfo.title,
      venue: `${eventInfo.venue || ""}, ${eventInfo.city || ""}`.replace(/^[,\s]+|[,\s]+$/g, ""),
      schedule: `${formatDateTime(eventInfo.startDate)} — ${formatDateTime(eventInfo.endDate)}`,
      manualCheckInCode: bookingItem.manualCheckInCode || null,
      qrToken: bookingItem.qrCode || null,
      status: bookingItem.checkedIn ? "Already Checked-in" : "Pending Check-in",
      alreadyCheckedIn: bookingItem.checkedIn || false,
    };
  };

  const verifyTicket = async (manualCode) => {
    const normalizedCode = manualCode?.trim().toLowerCase();
    if (!normalizedCode) return;
    if (!/^[a-z0-9]{6,12}$/.test(normalizedCode)) {
      setError("Enter a valid check-in code (e.g., 9sv9begy).");
      return;
    }
    setProcessing(true);
    setLoadingTicket(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch("booking/scan-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: buildReceptionRequestBody({ manualCheckInCode: normalizedCode }),
      });
      const data = response.data || response;
      const nextTicket = buildTicketFromScan(data);
      if (!nextTicket) {
        throw new Error("Ticket details incomplete. Please verify again.");
      }
      // Store the manual code so Allow Entry can use quick-check-in
      nextTicket.manualCheckInCode = normalizedCode;
      setTicket(nextTicket);
      setDecision(null);
      setMessage(`Loaded ticket ${nextTicket.ticketId}`);
    } catch (err) {
      console.error("Failed to verify ticket:", err);
      setError(err.message || "Ticket not found.");
      setTicket(null);
      setDecision(null);
    } finally {
      setProcessing(false);
      setLoadingTicket(false);
    }
  };

  const handleSubmitId = (e) => {
    e.preventDefault();
    verifyTicket(ticketInput.trim());
  };

  const handleAllow = async () => {
    if (!ticket || decision || ticket.alreadyCheckedIn) return;
    setProcessing(true);
    setError("");
    try {
      // Use quick-check-in (single round trip) instead of the old 2-step check-in
      const response = await apiFetch("booking/quick-check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: buildReceptionRequestBody({ manualCheckInCode: ticket.manualCheckInCode }),
      });
      const data = response.data || response;
      if (!data?.checkedIn) {
        throw new Error("Check-in failed. Try again.");
      }
      setDecision("allowed");
      setAccepted((prev) => prev + 1);
      setMessage(`Allowed ${ticket.holder}. Check-in completed.`);
      setTicket((prev) => (prev ? { ...prev, alreadyCheckedIn: true, status: "Checked-in" } : prev));
    } catch (err) {
      console.error("Check-in failed:", err);
      setError(err.message || "Failed to check in ticket");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectConfirm = () => {
    if (!reason.trim()) {
      setError("Please provide a reason to reject.");
      return;
    }
    setDecision("rejected");
    setRejected((prev) => prev + 1);
    setMessage(`Rejected ${ticket.holder}.`);
    setError("");
    setShowReason(false);
  };

  const seatsByType = event.ticketTypes?.map((t) => ({
    name: t.name,
    sold: t.soldQty,
    total: t.totalQty,
    checkedIn: t.checkedIn,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05060c] via-[#0a0f1c] to-[#05060c] text-white">
      <div className="px-4 lg:px-6 py-5 border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/organizer/reception")}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/50 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-300" /> Reception Desk
              </p>
              <h1 className="text-2xl font-extrabold">{event.title}</h1>
              <p className="text-sm text-white/60 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatDateTime(event.startDate)} — {formatDateTime(event.endDate)}
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <MapPin className="w-4 h-4" />
                {event.venue}, {event.city}, {event.state}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live window • Today
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Stat label="Checked-in" value={accepted} hint="Includes prior scans" icon={Users} />
          <Stat label="Rejected" value={rejected} hint="Flagged at entry" icon={XCircle} />
          <Stat label="Sold" value={`${ticketTotals.sold} / ${ticketTotals.total}`} hint="Total tickets" icon={Ticket} />
          <Stat label="Types" value={ticketTotals.types} hint="Seat / ticket types" icon={Layers} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-300" /> Check-in desk
              </p>
              <h3 className="text-xl font-semibold">{event.title}</h3>
              <p className="text-xs text-white/60">Select method: verify QR or enter manual code.</p>
            </div>
            {message && <span className="text-xs text-emerald-300">{message}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-semibold flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-300" /> QR Scan
              </p>
              <p className="text-xs text-white/60 mt-1">Scan a ticket QR code with your camera for instant check-in.</p>
              <button
                onClick={() => setShowScanner(true)}
                className="mt-3 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 border border-white/10 hover:border-emerald-300/40 transition flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Open QR Scanner
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-300" /> Manual Check-in Code
              </p>
              <p className="text-xs text-white/60 mt-1">Enter the code printed on the ticket.</p>
              <form onSubmit={handleSubmitId} className="mt-3 space-y-2">
                <input
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="Enter manual check-in code (e.g., 9sv9begy)"
                  inputMode="text"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                />
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm disabled:opacity-60"
                >
                  Verify Ticket
                </button>
              </form>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        </div>

        {ticket && (
          <TicketPanel
            ticket={ticket}
            decision={decision}
            onAllow={handleAllow}
            onReject={() => setShowReason(true)}
            locked={!!decision}
            message={message}
            error={error}
            onReset={resetTicket}
          />
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-5 h-5 text-emerald-300" />
            <h4 className="text-lg font-semibold">Event tracker</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {seatsByType?.map((s) => (
              <div key={s.name} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-white/60">Sold: {s.sold} / {s.total}</p>
                <p className="text-xs text-white/60">Checked-in: {s.checkedIn}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showScanner && (
        <QRScanner
          onScan={handleQuickCheckIn}
          onClose={() => setShowScanner(false)}
          isProcessing={scanProcessing}
          isPaused={!!checkInResult}
        />
      )}

      {checkInResult && (
        <CheckInResult
          result={checkInResult}
          onScanNext={handleScanNextFromResult}
          onClose={handleCloseResult}
        />
      )}

      <Modal open={showReason} onClose={() => setShowReason(false)}>
        <h3 className="text-lg font-semibold text-white mb-2">Reject ticket</h3>
        <p className="text-sm text-white/70 mb-3">Provide a reason to deny entry.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-400/40"
          placeholder="e.g., QR mismatch, ticket already used, ID not verified"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => setShowReason(false)}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleRejectConfirm}
            className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/30 text-red-50 hover:bg-red-500/25 transition text-sm"
          >
            Submit & Reject
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ReceptionDetail;
