import { useRef, useState } from 'react';
import { Download, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { downloadAdminPayoutInvoice, fetchPayoutDocumentEmail, sendPayoutDocumentEmail } from '@/services/adminService';

const describe = result => {
  if (!result) return 'No manual email has been sent.';
  if (result.deliveryStatus === 'SIMULATED') return 'Simulated in this environment; no email was sent.';
  if (result.status === 'SENT') return 'Accepted by the email provider. Inbox delivery is not yet confirmed.';
  if (result.status === 'SKIPPED') return 'Email was not sent (suppressed or skipped).';
  if (result.status === 'FAILED') return 'Email submission failed.';
  return 'Submission is pending or uncertain. The organizer may already have received the email.';
};

export default function PayoutDocumentActions({ payout }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loadError, setLoadError] = useState('');
  const busy = useRef(false);
  const request = useRef(null);
  const storageKey = `payout-document-request:${payout.id}`;
  const show = async () => {
    setOpen(true); setLoading(true); setDetails(null); setConfirmed(false); setLoadError('');
    request.current = sessionStorage.getItem(storageKey);
    try { setDetails(await fetchPayoutDocumentEmail(payout.id)); }
    catch (error) { setLoadError(error.message); }
    finally { setLoading(false); }
  };
  const download = async () => {
    setDownloading(true);
    try { await downloadAdminPayoutInvoice(payout.id); }
    catch (error) { toast.error(error.message || 'Unable to download PDF'); }
    finally { setDownloading(false); }
  };
  const send = async () => {
    if (busy.current) return;
    busy.current = true; setSending(true);
    try {
      if (!request.current) request.current = crypto.randomUUID();
      sessionStorage.setItem(storageKey, request.current);
      const result = await sendPayoutDocumentEmail(payout.id, { requestId: request.current, confirmResend: confirmed });
      setDetails(current => ({ ...current, latest: result }));
      if (result.status !== 'PROCESSING') {
        sessionStorage.removeItem(storageKey); request.current = null;
      }
      setConfirmed(false);
      toast.info(describe(result));
    } catch (error) { toast.error(error.message || 'Unable to submit email. Retry checks the same request.'); }
    finally { busy.current = false; setSending(false); }
  };
  const retrying = Boolean(request.current);
  return <>
    <Button className="h-10 gap-1.5 px-2.5 text-xs sm:h-8 [&_svg]:size-3.5" variant="outline" size="sm" onClick={download} disabled={downloading}><Download className="h-4 w-4" />{downloading ? 'Downloading…' : 'Download PDF'}</Button>
    <Button className="h-10 gap-1.5 px-2.5 text-xs sm:h-8 [&_svg]:size-3.5" variant="outline" size="sm" onClick={show}><Mail className="h-4 w-4" />Email organizer</Button>
    <Dialog open={open} onOpenChange={value => { if (!sending) setOpen(value); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Email payout document</DialogTitle><DialogDescription>Send one combined invoice and settlement statement PDF to the organizer.</DialogDescription></DialogHeader>
        {loading ? <p>Loading email details…</p> : loadError ? <p role="alert">{loadError}</p> : details && <>
          <p className="font-medium">{details.eventTitle || payout.event?.title}</p>
          <p className="text-sm">Payout status: {details.payoutStatus}</p>
          <p className="text-sm break-all">To: {details.recipientEmail || 'Organizer email is missing. You can still download the PDF.'}</p>
          <p className="text-sm text-muted-foreground" role="status">{describe(details.latest)}</p>
          {details.latest && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={sending} onChange={event => {
            setConfirmed(event.target.checked);
            if (event.target.checked) { request.current = null; sessionStorage.removeItem(storageKey); }
          }} />Send another copy. If the previous outcome is uncertain, this could duplicate an email already received.</label>}
          <Button disabled={sending || !details.recipientEmail || Boolean(details.latest && !confirmed && !retrying)} onClick={send}>
            {sending ? 'Submitting…' : retrying ? 'Check / retry request' : details.latest ? 'Resend email' : 'Send email'}
          </Button>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}
