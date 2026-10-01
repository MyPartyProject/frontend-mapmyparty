import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/config/api';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

export default function UpcomingSettlements({ admin = false }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ['upcoming-settlements', user?.id, admin, page],
    queryFn: async () => {
      const result = await apiFetch(`${admin ? 'admin' : 'organizer/me'}/settlements?page=${page}&limit=20`);
      if (!result.success) throw new Error(result.message || 'Unable to load settlements');
      return result.data;
    },
    refetchOnWindowFocus: true,
  });
  const items = data?.items || [];
  return <section className="space-y-3 rounded-xl border border-border bg-card p-4">
    <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Upcoming and blocked settlements</h2><button type="button" className="min-h-11 px-3 text-sm text-primary" disabled={isFetching} onClick={() => refetch()}>{isFetching ? 'Loading…' : 'Refresh'}</button></div>
    <p className="text-sm text-muted-foreground">Eligible payouts are processed automatically seven days after the event ends. Verified GST and a verified bank account are required. Bank processing can take additional time.</p>
    {admin && data?.automation && <p className="text-sm">Release mode: {data.automation.releaseMode}. Transfer execution: {data.automation.executionEnabled ? 'Enabled' : 'Disabled'}.</p>}
    {error ? <p role="alert" className="text-sm text-destructive">{error.message} Use Refresh to retry.</p> : <>
      {!isFetching && !items.length && <p className="text-sm text-muted-foreground">No upcoming settlements on this page.</p>}
      {items.map(item => <article key={item.event.id} className="space-y-2 rounded-lg border border-border p-3">
        <div className="flex flex-wrap justify-between gap-2"><h3 className="font-medium">{item.event.title}</h3><span>{item.status.replaceAll('_', ' ')}</span></div>
        {admin && <p className="text-sm text-muted-foreground">Organizer: {item.event.organizer?.name || item.event.organizer?.id || 'Unavailable'}</p>}
        <p className="font-semibold">{item.isEstimate ? 'Estimated payout' : 'Payout'}: {item.totals ? money(item.totals.netPayoutAmount) : 'Unavailable'}</p>
        {item.totals && <dl className="grid grid-cols-2 gap-2 text-sm">{[['Ticket sales', item.totals.grossTicketSales], ['Refunds', item.totals.refundAmount], ['Pending refunds', item.totals.refundReserveAmount], ['Platform fee', item.totals.platformFeeAmount], ['GST on fee', item.totals.gstTotal], ['Balance deductions', item.totals.organizerBalanceAdjustmentAmount]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd>{money(value || 0)}</dd></div>)}</dl>}
        <p className="text-sm">Eligible from: {item.eligibleAt ? new Date(item.eligibleAt).toLocaleString('en-IN') : 'Unavailable'} · Bank: {item.bankAccountMasked || 'Not ready'}</p>
        {item.blockers.map((blocker, index) => <p key={`${blocker.code}-${index}`} className="text-sm text-muted-foreground">{blocker.message}</p>)}
      </article>)}
      <div className="flex items-center justify-between text-sm"><button className="min-h-11 px-3" disabled={page <= 1 || isFetching} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {Math.max(1, data?.pagination?.totalPages || 1)}</span><button className="min-h-11 px-3" disabled={page >= (data?.pagination?.totalPages || 1) || isFetching} onClick={() => setPage(page + 1)}>Next</button></div>
    </>}
  </section>;
}
