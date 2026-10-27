import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export function plainText(value) {
  if (value == null || value === '') return '';
  if (Array.isArray(value)) return value.map(plainText).filter(Boolean).join('\n');
  if (typeof value === 'object') return Object.entries(value)
    .map(([key, item]) => [key, plainText(item)])
    .filter(([, text]) => text !== '')
    .map(([key, text]) => `${key.replace(/([a-z])([A-Z])/g, '$1 $2')}: ${text}`).join('\n');
  const doc = new DOMParser().parseFromString(String(value).replace(/<\/(p|div|li|h[1-6])>/gi, '\n').replace(/<br\s*\/?\s*>/gi, '\n'), 'text/html');
  doc.querySelectorAll('script,style').forEach(el => el.remove());
  return doc.body.textContent.trim();
}
export function CopyButton({ value, label = 'Copy', compact = false }) {
  return <Button type="button" size="sm" className={compact ? 'h-7 w-7 shrink-0 p-0' : ''} variant="ghost" disabled={!value} aria-label={label} title={label} onClick={async () => {
    try { await navigator.clipboard.writeText(plainText(value)); toast.success('Copied'); } catch { toast.error('Copy failed. Select the text and copy it manually.'); }
  }}><Copy className="h-3.5 w-3.5" />{!compact && <span className="ml-1">{label}</span>}</Button>;
}
export function Pager({ page, total, onChange }) {
  return <div className="flex items-center justify-between gap-3 text-sm pt-3"><span>{total} results · Page {page} of {Math.max(1, Math.ceil(total / 20))}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => onChange(page + 1)}>Next</Button></div></div>;
}
export function QueryState({ query }) {
  if (query.isPending) return <div role="status" className="space-y-3 py-3"><span className="sr-only">Loading</span>{[1, 2, 3].map(n => <div key={n} className="h-16 animate-pulse rounded bg-muted" />)}</div>;
  if (query.isError) return <div role="alert" className="py-3 text-sm">{query.error.message}<Button className="ml-2" variant="outline" size="sm" onClick={() => query.refetch()}>Retry</Button></div>;
  return null;
}
