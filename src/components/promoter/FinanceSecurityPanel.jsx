import { useEffect, useState } from "react";
import { apiFetch } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinanceSecurityPanel() {
  const [status, setStatus] = useState(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [secret, setSecret] = useState("");
  const [codes, setCodes] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    const response = await apiFetch("admin/mfa/status"); setStatus(response.data);
    if (response.data.financeAccess) setProposals((await apiFetch("admin/finance-approvals")).data);
  };
  useEffect(() => { refresh().catch((failure) => setError(failure.message)); }, []);
  const run = async (fn) => {
    setBusy(true); setError("");
    try { await fn(); await refresh(); } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  return <Card><CardHeader><CardTitle>Finance security</CardTitle></CardHeader><CardContent className="space-y-4">
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {status && !status.financeAccess && <p>A super administrator must grant you finance access.</p>}
    {status?.financeAccess && !status.mfaEnabledAt && <>
      <p>Set up an authenticator before approving or releasing payouts.</p>
      {!secret ? <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); run(async () => { const result = await apiFetch("admin/mfa/enroll", { method: "POST", body: JSON.stringify({ password }) }); setSecret(result.data.secret); setPassword(""); }); }}>
        <Input aria-label="Current password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><Button disabled={busy}>Set up MFA</Button>
      </form> : <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); run(async () => { const result = await apiFetch("admin/mfa/confirm", { method: "POST", body: JSON.stringify({ code }) }); setCodes(result.data.recoveryCodes); setSecret(""); setCode(""); }); }}>
        <p>Add this setup key to your authenticator: <code className="break-all">{secret}</code></p>
        <Input aria-label="Authenticator code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} pattern="[0-9]{6}" required /><Button disabled={busy}>Verify authenticator</Button>
      </form>}
    </>}
    {codes.length > 0 && <div><p>Save these recovery codes privately. They will not be displayed again.</p><pre className="whitespace-pre-wrap break-all">{codes.join("\n")}</pre><Button variant="outline" onClick={() => setCodes([])}>I saved my recovery codes</Button></div>}
    {status?.mfaEnabledAt && <p>Authenticator enabled. Payout approval and release require different finance staff members.</p>}
    {proposals.map((proposal) => <div key={proposal.id} className="space-y-2 rounded border p-3">
      <p>{proposal.reason}</p><p className="break-all text-sm">{proposal.method} {proposal.path}</p>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(proposal.payload, null, 2)}</pre>
      <p className="break-all text-xs">Proposal ID: {proposal.id}</p>
      {!proposal.approvedById ? <Button disabled={busy} onClick={() => run(() => apiFetch(`admin/finance-approvals/${proposal.id}/approve`, { method: "POST" }))}>Approve proposal</Button> : <Button disabled={busy} onClick={() => run(() => apiFetch(proposal.path.replace(/^\/api\//, ""), { method: proposal.method, body: JSON.stringify(proposal.payload) }))}>Execute approved proposal</Button>}
    </div>)}
  </CardContent></Card>;
}
