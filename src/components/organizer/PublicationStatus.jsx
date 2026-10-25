import { Clock, Check, X, Pencil, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const states = {
  PENDING: ['Approval pending', Clock, 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-950 dark:text-yellow-300'],
  REJECTED: ['Rejected', X, 'bg-red-100 text-red-800 border-red-400 dark:bg-red-950 dark:text-red-300'],
  APPROVED: ['Approved', Check, 'bg-green-100 text-green-800 border-green-400 dark:bg-green-950 dark:text-green-300'],
  CHANGES_REQUIRED: ['Changes required', Pencil, 'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-950 dark:text-blue-300'],
  DRAFT: ['Draft', FileText, 'bg-muted text-muted-foreground border-border'],
};

export default function PublicationStatus({ event }) {
  const publication = event.publication || { status: event.publishStatus === 'PUBLISHED' ? 'APPROVED' : 'DRAFT', isInitial: true };
  const [name, Icon, color] = states[publication.status] || states.DRAFT;
  const label = !publication.isInitial && publication.status === 'REJECTED' ? 'Changes rejected' : name;
  return <Dialog>
    <DialogTrigger asChild><button type="button" aria-label={label} title={label} onClick={e => e.stopPropagation()} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${color}`}><Icon className="h-4 w-4" aria-hidden="true" /></button></DialogTrigger>
    <DialogContent onClick={e => e.stopPropagation()} className="max-w-md">
      <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
      {event.publishStatus === 'PUBLISHED' && publication.status !== 'APPROVED' && <p className="text-sm">Your last approved event remains live.</p>}
      <p className="whitespace-pre-wrap break-words text-sm">{publication.notes || (publication.status === 'PENDING' ? 'Your submission is locked while the promoter reviews it.' : 'No review note yet.')}</p>
      {publication.status === 'REJECTED' && <p className="text-sm text-muted-foreground">{publication.isInitial ? 'This event cannot be published or resubmitted.' : 'You may prepare a new revision for review.'}</p>}
    </DialogContent>
  </Dialog>;
}
