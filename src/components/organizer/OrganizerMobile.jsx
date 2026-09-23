import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Home, UserRound, Monitor, LogOut, RefreshCw, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/config/api";
import { useOrganizerAnalytics } from "@/hooks/useOrganizerAnalytics";
import { OrganizerMobileEvents, OrganizerMobileEventDetail } from "./OrganizerMobileEvents";
import OrganizerAnalyticsSnapshot from "./OrganizerAnalyticsSnapshot";
import { organizerMobilePage, organizerMobileTotals, organizerDesktopTask } from "@/utils/organizerMobile";
import { buildOrganizerProfile } from "@/utils/organizerProfile";


const card = "rounded-xl border border-border bg-card p-4 shadow-sm";
const control = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const number = (value) => value == null ? "Unavailable" : new Intl.NumberFormat("en-IN").format(value);
const money = (value) => value == null ? "Unavailable" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
const label = (value) => value ? String(value).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Unavailable";
const date = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Date unavailable";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

function LoadState({ loading, error, retry, children }) {
  if (loading) return <p role="status" className={`${card} text-sm text-muted-foreground`}>Loading…</p>;
  if (error) return <div role="alert" className={`${card} space-y-3`}><p className="text-sm">Unable to load this information.</p><button className={control} onClick={retry}><RefreshCw size={16} />Try again</button></div>;
  return children;
}

function Overview() {
  const { analytics, loading, error, refresh } = useOrganizerAnalytics("month");

  const totals = organizerMobileTotals(analytics);
  const period = analytics?.summary?.period;
  return <div className="space-y-3">
    <LoadState loading={loading} error={error} retry={refresh}>
      <section aria-label="Organizer summary" className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
        {[
          ["Events", number(totals.events), "All time"],
          ["Tickets sold", number(totals.tickets), "All time"],
          ["Revenue", money(totals.revenue), period ? `${date(period.start)} – ${date(period.end)}` : "Period unavailable"],
        ].map(([title, value, hint], index) => <div key={title} className={`${card} ${index === 2 ? "min-[360px]:col-span-2" : ""}`}>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="my-2 break-words text-xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>)}
      </section>
    </LoadState>
    <OrganizerAnalyticsSnapshot analytics={analytics} loading={loading} error={error} compact />
    <Link className={`${control} w-full`} to="/organizer/myevents">View your events</Link>
  </div>;
}

function Fields({ items }) {
  return <dl className="space-y-3">{items.map(([title, value]) => <div key={title}><dt className="text-xs text-muted-foreground">{title}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">{value || "Not provided"}</dd></div>)}</dl>;
}

function BankDetails({ userId }) {
  const bank = useQuery({
    queryKey: ["organizer-mobile-bank", userId],
    queryFn: async () => {
      try {
        const response = await apiFetch("organizer/me/bank-details", { method: "GET" });
        return response?.data || response || {};
      } catch (error) {
        if (error?.status === 404) return null;
        throw error;
      }
    },
    retry: false,
  });
  return <LoadState loading={bank.isPending} error={bank.error} retry={bank.refetch}>
    {bank.data ? <Fields items={[["Account holder", bank.data.accountHolder], ["Account number", bank.data.accountNumberMasked], ["IFSC", bank.data.ifscCode], ["Bank", bank.data.bankName], ["Verification", label(bank.data.verificationStatus)]]} /> : <p className="text-sm text-muted-foreground">No bank details added.</p>}
    <p className="mt-4 text-xs text-muted-foreground">Use a laptop or PC to update or verify bank details.</p>
  </LoadState>;
}

function Profile({ user }) {
  const [bankOpen, setBankOpen] = useState(false);
  const profile = useQuery({
    queryKey: ["organizer-mobile-profile", user.id],
    queryFn: async () => {
      const response = await apiFetch("organizer/me/profile", { method: "GET" });
      return response?.data || response || {};
    },
    retry: false,
  });
  const data = buildOrganizerProfile(profile.data || {}, user);
  return <LoadState loading={profile.isPending} error={profile.error} retry={profile.refetch}>
    <div className="space-y-3">
      <section className={`${card} space-y-3`} aria-label="Organizer profile">
        {data.logo && <img src={data.logo} alt="Organizer logo" className="h-20 w-20 rounded-xl border border-border object-cover" />}
        <div><h2 className="break-words text-xl font-semibold">{data.name || "Organizer"}</h2><p className="mt-1 text-sm text-muted-foreground">{data.isVerified ? "Verified organizer" : "Organizer verification pending"}</p></div>
        <Fields items={[["About", data.description], ["Email", data.email], ["Phone", data.contact], ["Location", [data.address, data.state].filter(Boolean).join(", ")], ["GST number", data.gstNumber]]} />
      </section>
      <section className={`${card} space-y-3`} aria-labelledby="owner-title"><h2 id="owner-title" className="font-semibold">Account owner</h2><Fields items={[["Name", data.ownerName], ["Email", data.ownerEmail], ["Phone", data.ownerPhone]]} /></section>
      <section className={`${card} space-y-3`} aria-labelledby="social-title"><h2 id="social-title" className="font-semibold">Social profiles</h2><Fields items={["instagram", "linkedin", "facebook", "reddit", "x", "snapchat"].map((key) => [label(key), data[key]])} /></section>
      <details className={card} onToggle={(event) => setBankOpen(event.currentTarget.open)}><summary className="min-h-11 cursor-pointer py-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Bank details</summary>{bankOpen && <BankDetails userId={user.id} />}</details>
      <p className="text-sm text-muted-foreground">Profile changes are available on a laptop or PC.</p>
    </div>
  </LoadState>;
}

export default function OrganizerMobile({ setupRequired = false }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const page = organizerMobilePage(pathname);
  const title = setupRequired ? "Organizer setup" : { overview: "Overview", events: "Your events", eventDetail: "Event details", profile: "Your profile", desktop: "Desktop workspace" }[page];
  const signOut = async () => {
    setSigningOut(true);
    setLogoutError(false);
    try { await logout(); navigate("/"); } catch { setLogoutError(true); } finally { setSigningOut(false); }
  };
  return <div className="organizer-dashboard-theme dashboard-theme min-h-[100dvh] min-w-0 bg-background text-foreground [overflow-wrap:anywhere]">
    <header className="border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-16 max-w-2xl items-center justify-between gap-3">
        <Link to="/" className="inline-flex min-h-11 items-center text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">MapMyParty</Link><span className="text-xs text-muted-foreground">Organizer</span>
      </div>
    </header>
    <main className="mx-auto max-w-2xl space-y-3 px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <h1 className="text-xl font-bold">{title}</h1>
      {setupRequired || page === "desktop" ? <section className={`${card} space-y-3`}>
        <Monitor className="h-9 w-9 text-primary" aria-hidden="true" />
        <h2 className="text-xl font-semibold">{setupRequired ? "Complete organizer setup on a laptop or PC" : "Continue on a laptop or PC"}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{setupRequired ? "Finish your organizer profile and bank setup on a larger screen to access your organizer summary." : `Use a laptop or PC for ${organizerDesktopTask(pathname).toLowerCase()}. Open this page there to continue.`}</p>
        <div className="flex flex-wrap gap-3">{setupRequired ? <Link className={control} to="/">Go home</Link> : <><Link className={control} to="/organizer/dashboard">Overview</Link><Link className={control} to="/organizer/profile">Profile</Link></>}</div>
      </section> : <>
        <aside aria-labelledby="mobile-view-note" className="flex items-start gap-3 rounded-xl border border-primary/30 border-l-4 border-l-primary bg-primary/10 p-4">
          <Info size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <h2 id="mobile-view-note" className="text-sm font-semibold text-foreground">NOTE — Mobile is view-only</h2>
            <p className="text-sm leading-relaxed text-foreground">You can browse your data and event details here. To make changes or manage any operations, please use a <strong className="font-semibold">laptop or PC</strong>.</p>
          </div>
        </aside>
        {page === "overview" && <Overview />}
        {page === "events" && <OrganizerMobileEvents />}
        {page === "profile" && <Profile user={user} />}
        {page === "eventDetail" && <OrganizerMobileEventDetail />}
      </>}
      {(setupRequired || page === "profile") && <div><button className={`${control} w-full`} disabled={signingOut} onClick={signOut}><LogOut size={16} />{signingOut ? "Signing out…" : "Sign out"}</button>{logoutError && <p role="alert" className="mt-2 text-sm">Unable to sign out. Please try again.</p>}</div>}
    </main>
    {!setupRequired && <nav aria-label="Organizer navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-2xl grid-cols-3">{[["Overview", "/organizer/dashboard", Home], ["Events", "/organizer/myevents", CalendarDays], ["Profile", "/organizer/profile", UserRound]].map(([text, to, Icon]) => <NavLink key={to} to={to} end aria-current={text === "Events" && page === "eventDetail" ? "page" : undefined} className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${(isActive || (text === "Events" && page === "eventDetail")) ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><Icon size={21} aria-hidden="true" />{text}</NavLink>)}</div>
    </nav>}
  </div>;
}
