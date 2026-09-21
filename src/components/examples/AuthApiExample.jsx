import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/config/api";

export default function AuthApiExample() {
  const { user, loading, isAuthenticated, login, logout, refreshAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [meResponse, setMeResponse] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login({ email, password, role: "USER" });
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const loadMe = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await apiFetch("auth/me", { method: "GET" });
      setMeResponse(data);
    } catch (err) {
      setError(err?.message || "Failed to call /auth/me");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl rounded-lg border border-gray-300 p-4 space-y-4">
      <h2 className="text-lg font-semibold">Auth API Wrapper Example</h2>

      {loading ? (
        <p>Bootstrapping session...</p>
      ) : (
        <p>
          Session status: {isAuthenticated ? "Authenticated" : "Not authenticated"}
        </p>
      )}

      {user && (
        <div className="text-sm">
          <div>User: {user.name || user.email || user.id}</div>
          <div>Role: {user.role || "N/A"}</div>
        </div>
      )}

      {!isAuthenticated && (
        <form onSubmit={handleLogin} className="space-y-2">
          <input
            className="w-full border rounded px-3 py-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-black text-inverse px-4 py-2 disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      )}

      {isAuthenticated && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadMe}
            disabled={busy}
            className="rounded border px-3 py-2 disabled:opacity-60"
          >
            Call /auth/me
          </button>
          <button
            type="button"
            onClick={refreshAuth}
            disabled={busy}
            className="rounded border px-3 py-2 disabled:opacity-60"
          >
            Re-sync session
          </button>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="rounded bg-red-600 text-inverse px-3 py-2 disabled:opacity-60"
          >
            Logout
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {meResponse && (
        <pre className="overflow-auto text-xs rounded bg-gray-100 p-3">
          {JSON.stringify(meResponse, null, 2)}
        </pre>
      )}
    </div>
  );
}
