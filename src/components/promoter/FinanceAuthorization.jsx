import { useEffect, useRef, useState } from "react";
import { apiFetch, setFinanceAuthorizationHandler } from "@/config/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FinanceAuthorization() {
  const pending = useRef(null);
  const [action, setAction] = useState(null);
  const [code, setCode] = useState("");
  const [approval, setApproval] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const cancel = () => {
    pending.current?.reject(new Error("Finance action cancelled"));
    pending.current = null;
    setAction(null);
  };
  useEffect(() => {
    setFinanceAuthorizationHandler((next) => new Promise((resolve, reject) => {
      if (pending.current) return reject(new Error("Finish the current finance action first"));
      pending.current = { resolve, reject };
      setCode(""); setApproval(""); setReason(""); setError(""); setAction(next);
    }));
    return () => { setFinanceAuthorizationHandler(null); pending.current?.reject(new Error("Finance authorization closed")); };
  }, []);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await apiFetch("admin/mfa/authorize", { method: "POST", body: JSON.stringify({ ...action, code }) });
      pending.current?.resolve({ "x-finance-authorization": result.data.authorization, ...(approval.trim() ? { "x-finance-approval": approval.trim() } : {}) });
      pending.current = null; setAction(null);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const propose = async () => {
    setBusy(true); setError("");
    try {
      if (reason.trim().length < 10) throw new Error("Explain the reason for this change");
      const payload = { method: action.method, path: action.path, payload: action.payload, reason: reason.trim() };
      const proof = await apiFetch("admin/mfa/authorize", { method: "POST", body: JSON.stringify({ method: "POST", path: "/api/admin/finance-approvals", payload, code }) });
      const result = await apiFetch("admin/finance-approvals", { method: "POST", headers: { "x-finance-authorization": proof.data.authorization }, body: JSON.stringify(payload) });
      pending.current?.reject(new Error(`Proposal ${result.data.id} created. A second finance operator must approve it before execution.`));
      pending.current = null; setAction(null);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !busy) cancel(); }}>
    <DialogContent><DialogHeader><DialogTitle>Confirm finance action</DialogTitle><DialogDescription>Review the action and enter a fresh authenticator code. Each code can be used once.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <p className="break-all text-sm">{action?.method} {action?.path}</p>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">{JSON.stringify(action?.payload, null, 2)}</pre>
        <label className="block text-sm">Authenticator code<Input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required value={code} onChange={(event) => setCode(event.target.value)} /></label>
        {action?.requiresApproval && <label className="block text-sm">Approved proposal ID<Input required value={approval} onChange={(event) => setApproval(event.target.value)} /><span className="text-muted-foreground">A different finance staff member must approve this exact action first.</span></label>}
        {action?.requiresApproval && !approval && <div className="space-y-2"><label className="block text-sm">Reason for requesting approval<Input value={reason} onChange={(event) => setReason(event.target.value)} /></label><Button type="button" variant="outline" disabled={busy} onClick={propose}>Request second approval</Button></div>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button type="button" variant="outline" disabled={busy} onClick={cancel}>Cancel</Button>{" "}<Button disabled={busy}>Authorize</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
