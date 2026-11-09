import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { setAdminEventSuspension, permanentlyDeleteAdminEvent } from '@/services/adminService';

export default function EventLifecycleActions({ event, onUpdated, disabled = false }) {
  const navigate = useNavigate();
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [deletionBlock, setDeletionBlock] = useState(null);
  const eligibility = deletionBlock || event.deletionEligibility;
  const blocked = action === 'delete' && !eligibility?.canDelete;
  const title = blocked ? 'This event cannot be deleted' : action === 'delete' ? 'Permanently delete this event?' : action === 'resume' ? 'Resume this event?' : 'Suspend this event?';
  const submit = async () => {
    if (busy || blocked || (action === 'suspend' && !reason.trim())) return;
    setBusy(true);
    try {
      if (action === 'delete') {
        await permanentlyDeleteAdminEvent(event.id);
        toast.success('Event permanently deleted.');
        navigate('/promoter/events', { replace: true });
      } else {
        await setAdminEventSuspension(event.id, { isSuspended: action === 'suspend', reason: reason.trim() });
        toast.success(action === 'suspend' ? 'Event suspended.' : 'Event resumed.');
        setAction(null);
        setReason('');
      }
      await onUpdated();
    } catch (error) {
      toast.error(error.message || 'Unable to update event.');
      if (error.status === 409 && action === 'delete') {
        setDeletionBlock(error.data?.deletionEligibility || { canDelete: false, reasons: [error.message] });
      }
    } finally { setBusy(false); }
  };

  return <section className="space-y-3 rounded-lg border border-border/60 bg-card/70 p-4" aria-label="Event availability">
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-sm font-semibold">Event availability</h2>
      {event.isSuspended && <Badge variant="destructive">Suspended</Badge>}
    </div>
    {event.isSuspended && <p className="break-words text-sm text-muted-foreground">Hidden from public users. New bookings are paused. {event.suspensionReason}</p>}
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={disabled || busy} onClick={() => { setReason(''); setAction(event.isSuspended ? 'resume' : 'suspend'); }}>{event.isSuspended ? 'Resume event' : 'Suspend event'}</Button>
      <Button variant="destructive" disabled={disabled || busy} onClick={() => setAction('delete')}>Delete permanently</Button>
    </div>
    <AlertDialog open={Boolean(action)} onOpenChange={open => { if (!open && !busy) setAction(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {blocked ? `${eligibility?.reasons?.join(' ') || 'Deletion eligibility is unavailable.'} ${event.isSuspended ? 'This event is already suspended.' : 'You can suspend it instead.'}`
              : action === 'delete' ? `“${event.title}” and its eligible event data will be permanently removed. This cannot be undone. Booking eligibility will be checked again before deletion.`
              : action === 'resume' ? 'Remove the suspension. The event will appear publicly only if its publication, schedule and organizer status allow it.'
              : 'Hide the event from public pages and stop new bookings. Existing tickets remain valid. This does not cancel bookings or issue refunds.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {action === 'suspend' && <div className="space-y-2">
          <label htmlFor="event-suspension-reason" className="text-sm font-medium">Reason for suspension</label>
          <Textarea id="event-suspension-reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={500} disabled={busy} />
        </div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          {blocked ? !event.isSuspended && <Button onClick={() => { setReason(''); setAction('suspend'); }}>Suspend instead</Button>
            : <Button variant={action === 'resume' ? 'default' : 'destructive'} disabled={busy || (action === 'suspend' && !reason.trim())} onClick={submit}>
              {busy ? 'Saving…' : action === 'delete' ? 'Delete permanently' : action === 'resume' ? 'Resume event' : 'Suspend event'}
            </Button>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}
