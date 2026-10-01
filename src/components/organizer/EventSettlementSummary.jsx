import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/config/api';

export default function EventSettlementSummary({ event }) {
  const { user } = useAuth();
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ['event-settlement-summary', user?.id, event.organizerId, event.id],
    queryFn: async () => {
      const response = await apiFetch(`organizer/${event.organizerId}/events/${event.id}/analytics/summary`);
      if (!response.success) throw new Error(response.message || 'Finance unavailable');
      return response.data.settlement;
    },
    enabled: Boolean(event.organizerId),
  });
  const money = value => value == null ? 'Unavailable' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  return <section className="space-y-3 rounded-xl border border-border bg-card p-4">
    <div className="flex justify-between gap-2"><h2 className="font-semibold">Event finance</h2><button type="button" className="min-h-11 text-primary" disabled={isFetching} onClick={() => refetch()}>Refresh</button></div>
    {isFetching && <p role="status">Loading finance…</p>}
    {error && <p role="alert">{error.message}</p>}
    {data && <><p>{data.isEstimate ? 'Estimated payout' : 'Payout'}: <strong>{money(data.totals?.netPayoutAmount)}</strong></p><dl className="grid grid-cols-2 gap-3 text-sm">{[['Ticket sales', 'grossTicketSales'], ['Refunds', 'refundAmount'], ['Pending refunds', 'refundReserveAmount'], ['Platform fee', 'platformFeeAmount'], ['GST on fee', 'gstTotal'], ['Balance deductions', 'organizerBalanceAdjustmentAmount']].map(([label, key]) => <div key={key}><dt className="text-muted-foreground">{label}</dt><dd>{money(data.totals?.[key])}</dd></div>)}</dl><p className="text-sm">Eligible from {data.eligibleAt ? new Date(data.eligibleAt).toLocaleString('en-IN') : 'date unavailable'}</p>{data.blockers.map((blocker, i) => <p key={i} className="text-sm text-muted-foreground">{blocker.message}</p>)}</>}
  </section>;
}
