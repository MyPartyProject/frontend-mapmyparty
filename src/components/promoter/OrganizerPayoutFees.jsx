import { useEffect, useState } from 'react';
import { apiFetch } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function OrganizerPayoutFees() {
  const [config, setConfig] = useState(null);
  const [rates, setRates] = useState(['', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const accept = value => {
    setConfig(value);
    setRates([value.exclusiveFeeRate, value.nonExclusiveFeeRate].map(rate => String(Number((rate * 100).toFixed(8)))));
  };
  const refresh = async () => {
    setBusy(true); setError('');
    try { accept((await apiFetch('admin/payout-config/fees')).data); }
    catch (e) { setError(e.message || 'Unable to load payout fees'); }
    finally { setBusy(false); }
  };
  useEffect(() => { refresh(); }, []);
  const save = async event => {
    event.preventDefault();
    if (rates.some(rate => rate.trim() === '' || !Number.isFinite(Number(rate)) || Number(rate) < 0 || Number(rate) > 100)) {
      setError('Enter both percentages between 0 and 100.'); return;
    }
    setBusy(true); setError('');
    try {
      accept((await apiFetch('admin/payout-config/fees', { method: 'PATCH', body: JSON.stringify({
        exclusiveFeeRate: Number(rates[0]) / 100, nonExclusiveFeeRate: Number(rates[1]) / 100,
        expectedVersion: config.id ? config.version : 0,
      }) })).data);
      toast.success('Organizer payout fees updated.');
    } catch (e) { setError(e.message || 'Unable to save payout fees'); }
    finally { setBusy(false); }
  };
  const unchanged = config && Number(rates[0]) === Number((config.exclusiveFeeRate * 100).toFixed(8)) && Number(rates[1]) === Number((config.nonExclusiveFeeRate * 100).toFixed(8));
  return <Card>
    <CardHeader><CardTitle>Organizer payout fees</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">Deducted from organizer payouts. Changes apply to subsequent payout calculations; saved payouts are not automatically recalculated.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!config && busy && <p role="status">Loading payout fees...</p>}
      <form onSubmit={save} className="space-y-4">
        <fieldset disabled={busy || !config} className="grid gap-4 sm:grid-cols-2">
          {['Exclusive events', 'Non-exclusive events'].map((label, index) => <div key={label} className="space-y-2">
            <Label htmlFor={`payout-fee-${index}`}>{label} (%)</Label>
            <Input id={`payout-fee-${index}`} type="number" min="0" max="100" step="any" required value={rates[index]} onChange={e => setRates(current => current.map((value, i) => i === index ? e.target.value : value))} />
          </div>)}
        </fieldset>
        <div className="flex gap-3">
          <Button type="submit" disabled={busy || !config || unchanged}>{busy ? 'Please wait...' : 'Save payout fees'}</Button>
          <Button type="button" variant="outline" disabled={busy} onClick={refresh}>Refresh</Button>
        </div>
      </form>
    </CardContent>
  </Card>;
}
