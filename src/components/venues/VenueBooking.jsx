import { MailCheck, Clock3 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { addDays, parseISO, format } from "date-fns";
import VenueDatePicker from "./VenueDatePicker";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { venueRequest, venueToday } from "@/services/venueService";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl text-sm bg-background/90 border border-input/70 text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const newIdentity = () => ({
  idempotencyKey: crypto.randomUUID(),
  token: Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join(""),
});
const tokenKey = (reference) => `venue-reservation-${reference}`;

export function ReservationStatus({ reservation, token, onChange }) {
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [remaining, setRemaining] = useState(60);
  useEffect(() => { const timer = setInterval(() => setRemaining((n) => Math.max(0, n - 1)), 1000); return () => clearInterval(timer); }, []);
  const [busy, setBusy] = useState(false);
  const run = async (action, body = {}) => {
    setMessage("");
    setBusy(true);
    try {
      onChange(
        await venueRequest(
          `venue-reservations/${reservation.reference}${action ? `/${action}` : ""}`,
          action ? "POST" : "GET",
          action ? body : undefined,
          token,
        ),
      );
      if (action === "resend") { setRemaining(60); setCode(""); toast.success("Verification email requested"); }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5" aria-live="polite">
      <span className="inline-flex rounded-full px-3 py-1 text-xs bg-secondary/30 border border-border">
        {reservation.status.replaceAll("_", " ")}
      </span>
      <h3 className="text-2xl font-semibold">{reservation.venueName}</h3>
      <dl className="rounded-xl bg-muted/45 border border-border/40 p-4 space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Guest</dt>
          <dd>{reservation.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Date & time</dt>
          <dd>
            {reservation.localDate} · {reservation.localTime} (
            {reservation.timezone})
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Party size</dt>
          <dd>{reservation.guests} guests</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Booking fee</dt>
          <dd>₹0 · Pay for your order at the venue</dd>
        </div>
      </dl>
      <p className="text-xs break-all text-muted-foreground">
        {reservation.reference}
      </p>
      {reservation.status === "PENDING_VERIFICATION" && (<><Button onClick={() => setOpen(true)} className="gap-2"><MailCheck size={16} />Continue verification</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl p-6 sm:p-8"><MailCheck className="text-primary" size={32} /><DialogTitle>Verify your email</DialogTitle><DialogDescription>Submit your request for organizer approval.</DialogDescription><p className="text-xs text-muted-foreground">{reservation.localDate} at {reservation.localTime} / {reservation.guests} guests</p><form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run("verify", { code });
          }}
        >
          <p className="text-sm">
            Enter the code sent to {reservation.email}. This submits your
            request for organizer approval.
          </p>
          <label className="block text-sm">
            Email verification code
            <input
              className={`${inputClass} text-center !text-2xl tracking-[0.4em] font-mono`}
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          {message && <p role="alert" className="text-xs text-destructive">{message}</p>}
          <Button className="w-full transition-transform hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none" type="submit" disabled={busy || code.length !== 6}>
            {busy ? "Verifying..." : "Verify & submit request"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy || remaining > 0}
            onClick={() => run("resend")}
          >
            {remaining ? `Resend in ${remaining}s` : "Resend code"}
          </Button>
        </form></DialogContent></Dialog></>
      )}
      {reservation.status === "PENDING_APPROVAL" && (
        <p className="text-sm">
          Your request is awaiting organizer approval. Your table is not yet
          confirmed.
        </p>
      )}
      {reservation.status === "CONFIRMED" && (
        <p className="text-sm text-success">Your reservation is confirmed.</p>
      )}
      {reservation.decisionNote && (
        <p className="text-sm">{reservation.decisionNote}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => run("")}
        >
          Refresh status
        </Button>
        {["PENDING_VERIFICATION", "PENDING_APPROVAL", "CONFIRMED"].includes(
          reservation.status,
        ) && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Cancel this reservation request?"))
                run("cancel");
            }}
          >
            Cancel reservation
          </Button>
        )}
      </div>
    </div>
  );
}

export default function VenueBooking({ venue, preview = false }) {
  const [form, setForm] = useState({
    date: venueToday(),
    time: "",
    guests: Math.min(2, venue.maxGuests),
    name: "",
    email: "",
  });
  const [identity, setIdentity] = useState(newIdentity);
  const [reservation, setReservation] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["venue-slots", venue.id, form.date],
    queryFn: ({ signal }) => venueRequest(`public/venues/${venue.id}/slots?date=${form.date}`, "GET", undefined, undefined, { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) }),
    staleTime: 0, retry: false,
    refetchInterval: form.date === venueToday() ? 30000 : false,
    enabled: !!form.date && !preview && venue.reservationsEnabled && !reservation,
  });
  useEffect(() => {
    if (!data || data.times.includes(form.time)) return;
    const time = data.times[0] || "";
    if (time !== form.time) setForm((f) => ({ ...f, time }));
  }, [data, form.time]);
  const [timeOpen, setTimeOpen] = useState(false);
  const change = (key, value) => {
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === "date" ? { time: "" } : {}),
    }));
    setIdentity(newIdentity());
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await venueRequest(
        `public/venues/${venue.id}/reservations`,
        "POST",
        { ...form, ...identity, guests: Number(form.guests) },
      );
      sessionStorage.setItem(tokenKey(result.reference), identity.token);
      setReservation(result);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <aside
      id="booking-widget-aside"
      aria-label="Table Reservation"
      className="lg:col-span-4 lg:sticky lg:top-24 scroll-mt-24"
    >
      <div className="theme-card rounded-2xl sm:rounded-3xl p-6 sm:p-7 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C99774]/70 to-transparent" />
        {reservation ? (
          <ReservationStatus
            reservation={reservation}
            token={identity.token}
            onChange={setReservation}
          />
        ) : (
          <>
            <h2 className="text-xl font-semibold tracking-tight">
              Book a place
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-6">
              Request a table. No booking fee. Organizer approval required.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <fieldset
                disabled={busy || preview || !venue.reservationsEnabled}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs">
                    Date
                    <VenueDatePicker label="Booking date" value={form.date} onChange={(date) => change("date", date)} disabledDays={[{ before: parseISO(venueToday()) }, { after: addDays(parseISO(venueToday()), venue.horizonDays) }]} />
                  </label>
                  <label className="block text-xs">
                    Time
                    <Popover open={timeOpen} onOpenChange={setTimeOpen}><PopoverTrigger asChild><button type="button" className={inputClass}><Clock3 className="inline mr-2" size={14} />{form.time || (isFetching && !data ? "Loading..." : "Select time")}</button></PopoverTrigger><PopoverContent className="w-72 rounded-xl p-3"><p className="text-xs text-muted-foreground mb-2">Available times (IST)</p><div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">{data?.times.map((time) => <button type="button" key={time} aria-pressed={form.time === time} className={`rounded-lg border p-2 text-xs hover:bg-primary/10 focus-visible:ring-2 ${form.time === time ? "border-primary bg-primary/10" : "border-border"}`} onClick={() => { change("time", time); setTimeOpen(false); }}>{format(parseISO(`2000-01-01T${time}`), "h:mm a")}</button>)}</div>{isFetching && !data && <p role="status">Loading times...</p>}{data?.times.length === 0 && <p className="text-xs">No times available. Try another date.</p>}{error && <Button type="button" onClick={() => refetch()}>Retry</Button>}</PopoverContent></Popover>
                  </label>
                </div>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error.message}
                  </p>
                )}
                {!isFetching && data?.times.length === 0 && (
                  <p className="text-sm">
                    No request times available on this date.
                  </p>
                )}
                <label className="block text-xs">
                  Guests
                  <select
                    className={`${inputClass} mt-1.5`}
                    value={form.guests}
                    onChange={(e) => change("guests", Number(e.target.value))}
                  >
                    {Array.from({ length: venue.maxGuests }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1} {i ? "guests" : "guest"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  Name
                  <input
                    className={`${inputClass} mt-1.5`}
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => change("name", e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </label>
                <label className="block text-xs">
                  Email
                  <input
                    className={`${inputClass} mt-1.5`}
                    required
                    type="email"
                    maxLength={254}
                    value={form.email}
                    onChange={(e) => change("email", e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                <div className="rounded-xl bg-muted/45 border border-border/40 p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking fee</span>
                    <span className="text-gold">₹0</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-2.5 font-semibold">
                    <span>You pay now</span>
                    <span>₹0</span>
                  </div>
                </div>
                <button
                  className="cta-primary w-full py-3.5 px-5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  disabled={!form.date || !form.time || busy}
                >
                  {busy ? "Submitting…" : "Book a place"}{" "}
                  <span className="ml-2 rounded-full bg-black/25 px-2 py-0.5 text-xs">
                    Zero fee
                  </span>
                </button>
              </fieldset>
              <p className="text-center text-xs text-muted-foreground">
                {preview
                  ? "Preview only — reservations are disabled."
                  : !venue.reservationsEnabled
                    ? "Reservations are currently paused."
                    : "Pay for what you order at the venue."}
              </p>
            </form>
          </>
        )}
      </div>
    </aside>
  );
}

export function GuestVenueReservation() {
  const { reference } = useParams();
  const [token] = useState(
    () =>
      new URLSearchParams(window.location.hash.slice(1)).get("token") ||
      sessionStorage.getItem(tokenKey(reference)) ||
      "",
  );
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (token) sessionStorage.setItem(tokenKey(reference), token);
    window.history.replaceState(null, "", window.location.pathname);
    let cancelled = false;
    venueRequest(`venue-reservations/${reference}`, "GET", undefined, token)
      .then((value) => {
        if (!cancelled) setReservation(value);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [reference, token]);
  return (
    <main className="max-w-xl mx-auto p-6 my-10">
      <Link to="/venues" className="text-primary">
        ← Venues
      </Link>
      <div className="rounded-2xl border bg-card p-6 mt-6">
        {error ? (
          <p role="alert">{error}</p>
        ) : reservation ? (
          <ReservationStatus
            reservation={reservation}
            token={token}
            onChange={setReservation}
          />
        ) : (
          <p>Loading reservation…</p>
        )}
      </div>
    </main>
  );
}
