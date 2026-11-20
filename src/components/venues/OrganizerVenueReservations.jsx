import { Dialog, DialogClose, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { CalendarDays, Clock3, Users, Mail, MapPin, RefreshCw, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { venueRequest } from "@/services/venueService";
import { Button } from "@/components/ui/button";
import VenueDatePicker from "./VenueDatePicker";

const statusLabels = { PENDING_APPROVAL: "Awaiting approval", CONFIRMED: "Confirmed", DECLINED: "Declined", CANCELLED: "Cancelled", EXPIRED: "Expired", COMPLETED: "Completed", NO_SHOW: "No show" };
const actionLabels = { CONFIRMED: "Confirm reservation", DECLINED: "Decline", CANCELLED: "Cancel reservation", COMPLETED: "Mark completed", NO_SHOW: "Mark no show" };
const statusStyles = { PENDING_APPROVAL: "bg-amber-500/10 text-amber-600 dark:text-amber-300", CONFIRMED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300", COMPLETED: "bg-primary/10 text-primary", DECLINED: "bg-rose-500/10 text-rose-600 dark:text-rose-300", CANCELLED: "bg-rose-500/10 text-rose-600 dark:text-rose-300" };
export default function OrganizerVenueReservations({ resolutionOnly = false }) {
  const client = useQueryClient();
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('PENDING_APPROVAL');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [confirmationNote, setConfirmationNote] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const openConfirmation = (reservation) => {
    setConfirmation(reservation);
    setConfirmationText("");
    setConfirmationNote("");
    setConfirmationError("");
    setConfirmed(false);
  };
  const confirmReservation = async (event) => {
    event.preventDefault();
    if (busy || confirmed || confirmationText !== "CONFIRMED" || !confirmation) return;
    setBusy(true);
    setConfirmationError("");
    try {
      await venueRequest(`organizer/venue-reservations/${confirmation.reference}`, "PATCH", { status: "CONFIRMED", note: confirmationNote });
      setConfirmed(true);
      await client.invalidateQueries({ queryKey: ["organizer-venue-reservations"] });
    } catch (error) {
      setConfirmationError(error.message);
    } finally { setBusy(false); }
  };
  const { data, error, isFetching } = useQuery({
    queryKey: ["organizer-venue-reservations", date, status, page],
    queryFn: () =>
      venueRequest(
        `organizer/venue-reservations?${new URLSearchParams({ date, status, page })}`,
      ),
    refetchInterval: 30000,
  });
  const act = async (r, next) => {
    const note = window.prompt(
      `${next === "CONFIRMED" ? "Check your seating and other reservations before confirming. " : ""}${next.replaceAll("_", " ")} — optional note to guest:`,
      "",
    );
    if (note === null) return;
    setBusy(true);
    try {
      await venueRequest(
        `organizer/venue-reservations/${r.reference}`,
        "PATCH",
        { status: next, note },
      );
      await client.invalidateQueries({
        queryKey: ["organizer-venue-reservations"],
      });
      toast.success("Reservation updated");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="!text-lg sm:!text-xl !font-semibold tracking-tight">Venue reservations</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Manage table requests and welcome your guests.</p>
        </div>
        <Button size="sm" variant="outline" className="h-9 rounded-lg text-xs gap-2" disabled={isFetching} onClick={() => client.invalidateQueries({ queryKey: ["organizer-venue-reservations"] })}>
          <RefreshCw aria-hidden="true" className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />Refresh
        </Button>
      </header>
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[200px_240px_1fr] items-end gap-3">
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            <span>Date (IST)</span>
            <VenueDatePicker label="All dates" value={date} onChange={(value) => { setDate(value); setPage(1); }} />
          </label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
            <span>Reservation status</span>
            <select className="block w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All verified requests</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <p className="text-xs text-muted-foreground lg:text-right pb-2">Check available seating before confirming a request.</p>
        </div>
      </div>
      {isFetching && !data && <p className="text-sm text-muted-foreground py-6" role="status">Loading reservations...</p>}
      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error.message}</p>}
      {data?.total === 0 && <div className="rounded-xl border border-dashed border-border bg-card/50 py-14 px-5 text-center"><ClipboardList aria-hidden="true" className="mx-auto mb-3 h-7 w-7 text-muted-foreground/60" /><h2 className="!text-sm !font-medium">No reservations found</h2><p className="mt-1 text-xs text-muted-foreground">Requests matching your date and status will appear here.</p></div>}
      <div className="space-y-3">
        {data?.items.map((r) => (
          <article key={r.reference} className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 min-w-0 !text-sm !font-semibold"><MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="break-words">{r.venueName}</span></h2>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[r.status] || "bg-muted text-muted-foreground"}`}>{statusLabels[r.status] || r.status}</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="min-w-0"><p className="text-[11px] font-medium text-muted-foreground mb-1">Guest</p><p className="text-sm font-medium break-words">{r.name}</p><a className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground hover:text-primary" href={`mailto:${r.email}`}><Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span className="break-all">{r.email}</span></a></div>
                <div><p className="text-[11px] font-medium text-muted-foreground mb-1">Reservation time</p><p className="flex items-center gap-2 text-sm"><CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />{r.localDate}</p><p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />{r.localTime} IST</p></div>
                <div><p className="text-[11px] font-medium text-muted-foreground mb-1">Party size</p><p className="flex items-center gap-2 text-sm"><Users aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />{r.guests} {r.guests === 1 ? "guest" : "guests"}</p></div>
              </div>
              {r.decisionNote && <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed break-words"><span className="font-medium">Note: </span>{r.decisionNote}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-muted/20 px-4 sm:px-5 py-3">
              <p className="min-w-0 text-[10px] font-mono break-all text-muted-foreground">{r.reference}</p>
              <div className="flex flex-wrap gap-2">
                {(r.status === "PENDING_APPROVAL" ? resolutionOnly ? ["DECLINED"] : ["CONFIRMED", "DECLINED"] : r.status === "CONFIRMED" ? ["CANCELLED", "COMPLETED", "NO_SHOW"] : []).map((next) => <Button key={next} size="sm" className="h-8 rounded-lg text-xs" variant={next === "CONFIRMED" ? "default" : "outline"} disabled={busy} onClick={() => next === "CONFIRMED" ? openConfirmation(r) : act(r, next)}>{actionLabels[next]}</Button>)}
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Page {page}{data ? ` ? ${data.total} reservations` : ""}</span>
        <div className="flex gap-2"><Button size="sm" className="h-8 rounded-lg text-xs" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button size="sm" className="h-8 rounded-lg text-xs" variant="outline" disabled={!data || page * data.limit >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
      </div>
      <Dialog open={!!confirmation} onOpenChange={(open) => { if (!open && !busy) setConfirmation(null); }}>
        <DialogContent className="[&>.modal-close-button]:hidden w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border-border/60 bg-card p-6 sm:p-7" closeDisabled={busy} onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()} onInteractOutside={(event) => event.preventDefault()}>
          <DialogClose asChild><button type="button" aria-label="Close confirmation" disabled={busy} className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted text-foreground hover:bg-primary/10 hover:text-[#EC4899] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><X aria-hidden="true" size={18} /></button></DialogClose>
          <DialogTitle className="!text-lg !font-semibold pr-5">{confirmed ? "Reservation confirmed" : "Confirm this reservation"}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">{confirmed ? "The reservation has been confirmed. Close this window using the X button." : "Check available seating and other reservations before confirming this guest's table."}</DialogDescription>
          {confirmation && <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2 text-sm"><p className="font-medium break-words">{confirmation.venueName}</p><p className="text-xs text-muted-foreground break-words">{confirmation.name} / {confirmation.guests} guests</p><p className="text-xs text-muted-foreground">{confirmation.localDate} at {confirmation.localTime} IST</p></div>}
          {!confirmed && <form onSubmit={confirmReservation} className="space-y-4">
            <label className="block space-y-2 text-xs font-medium">Note to guest <span className="font-normal text-muted-foreground">(optional)</span><textarea className="w-full min-h-20 rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={confirmationNote} maxLength={500} disabled={busy} onChange={(event) => setConfirmationNote(event.target.value)} /></label>
            <label className="block space-y-2 text-xs font-medium">Type <span className="font-mono text-[#EC4899]">CONFIRMED</span> to confirm<Input className="rounded-xl font-mono tracking-wider" value={confirmationText} disabled={busy} autoComplete="off" spellCheck={false} onChange={(event) => setConfirmationText(event.target.value)} aria-describedby="confirmation-help" /></label>
            <p id="confirmation-help" className="text-xs text-muted-foreground">Enter the word exactly as shown, in uppercase.</p>
            {confirmationError && <p role="alert" className="text-xs text-destructive">{confirmationError}</p>}
            <Button type="submit" className="w-full rounded-xl gap-2 transition-colors" disabled={busy || confirmationText !== "CONFIRMED"}>{busy ? <Loader2 aria-hidden="true" className="animate-spin" size={16} /> : <CheckCircle2 aria-hidden="true" size={16} />}{busy ? "Confirming..." : "Confirm reservation"}</Button>
          </form>}
          {confirmed && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-300">Booking confirmed successfully.</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
