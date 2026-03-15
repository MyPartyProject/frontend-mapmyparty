import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import {
  BarChart3,
  CalendarPlus2,
  CreditCard,
  QrCode,
  Save,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";

const highlights = [
  { title: "Organizer setup", value: "Profile + bank", icon: ShieldCheck },
  { title: "Event editing", value: "Save by section", icon: Save },
  { title: "Reception ops", value: "QR + manual", icon: QrCode },
  { title: "Reporting", value: "Analytics + payouts", icon: BarChart3 },
];

const features = [
  {
    title: "Guided event builder",
    desc: "Create events step by step with full control over categories, media, scheduling, venue setup, and publish state.",
    icon: CalendarPlus2,
  },
  {
    title: "Flexible editing",
    desc: "Jump directly to any section while editing and save only that section without being forced through the entire flow again.",
    icon: Save,
  },
  {
    title: "Ticketing and event content",
    desc: "Manage ticket types, sponsors, artists, advisories, attendee questions, and organizer notes in one workflow.",
    icon: Ticket,
  },
  {
    title: "Live reception tools",
    desc: "Run live event operations with QR-based and manual check-ins plus real-time visibility into ticket movement.",
    icon: QrCode,
  },
  {
    title: "Attendee visibility",
    desc: "Review bookings, payment status, check-in progress, and export attendee data when your operations team needs it.",
    icon: Users,
  },
  {
    title: "Analytics, refunds, and payouts",
    desc: "Track revenue, top events, ticket performance, refund status, payout views, and organizer-side operational reporting.",
    icon: CreditCard,
  },
];

const workflow = [
  {
    title: "Set up your organizer account",
    desc: "Create your organizer profile, add business details, and configure bank information so payouts are ready before launch.",
    icon: ShieldCheck,
  },
  {
    title: "Build and publish with control",
    desc: "Draft events, save section by section, and manage tickets, venue, sponsors, artists, and attendee-facing information before going live.",
    icon: Sparkles,
  },
  {
    title: "Run the event and track results",
    desc: "Monitor live activity, manage check-ins, review attendees and refunds, and stay on top of analytics and payouts after launch.",
    icon: BarChart3,
  },
];

const capabilityGroups = [
  {
    title: "Setup and publishing",
    points: [
      "Organizer onboarding with profile and bank setup",
      "Draft saving, section-wise editing, review, and publishing",
      "Event details, media uploads, date and time, and venue setup",
    ],
  },
  {
    title: "Event management",
    points: [
      "Multiple ticket types with pricing and event-specific configuration",
      "Sponsors, artists, advisories, attendee questions, and organizer notes",
      "My Events overview with search, statuses, edit access, and cancellation requests",
    ],
  },
  {
    title: "Operations and reporting",
    points: [
      "Live event monitoring, reception desk tools, and QR/manual check-in flows",
      "Attendee management with payment visibility, check-in status, and CSV export",
      "Audience analytics, refunds, payouts, and add-on inventory for published events",
    ],
  },
];

const HostEvents = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Header forceMainHeader />

      <section className="relative overflow-hidden bg-[#140a2b]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,105,180,0.28),transparent_45%),radial-gradient(circle_at_65%_25%,rgba(122,78,255,0.35),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,183,104,0.25),transparent_40%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0619] via-[#1b0c2f] to-[#31154a] opacity-90" />
        <div className="absolute inset-0 opacity-70">
          <div className="absolute left-16 top-16 h-3 w-3 rounded-full bg-pink-300/70 blur-sm" />
          <div className="absolute left-40 top-28 h-2 w-2 rounded-full bg-purple-200/70 blur-sm" />
          <div className="absolute right-20 top-20 h-4 w-4 rounded-full bg-fuchsia-300/70 blur-sm" />
          <div className="absolute right-36 bottom-24 h-3 w-3 rounded-full bg-rose-200/80 blur-sm" />
          <div className="absolute left-1/2 bottom-14 h-2 w-2 rounded-full bg-amber-200/80 blur-sm" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
          <Badge className="mb-5 border border-white/20 bg-white/10 text-white">Host Events</Badge>
          <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold leading-tight md:text-[2.75rem]">
                Everything organizers need to launch, manage, and run events in one place.
              </h1>
              <p className="max-w-2xl text-lg text-slate-200/80">
                Map MyParty brings together organizer onboarding, event creation, live check-ins, attendee visibility,
                analytics, refunds, payouts, and operations tooling so your team can work from one system instead of
                stitching together multiple tools.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-400 hover:to-fuchsia-400">
                    Start Hosting
                  </Button>
                </Link>
                <Link to="/browse-events">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-slate-900">
                    Explore Live Events
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_25px_80px_-35px_rgba(0,0,0,0.75)]">
              <CardContent className="grid grid-cols-2 gap-4 p-6">
                {highlights.map(({ title, value, icon: Icon }) => (
                  <div key={title} className="space-y-2 rounded-xl border border-white/10 bg-white/10 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-200/75">
                      <Icon className="h-4 w-4 text-pink-200" />
                      <span>{title}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          {features.map(({ title, desc, icon: Icon }) => (
            <Card
              key={title}
              className="border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-[0_25px_80px_-24px_rgba(0,0,0,0.65)]"
            >
              <CardContent className="space-y-3 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-pink-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-semibold text-white">{title}</h2>
                <p className="text-sm leading-relaxed text-slate-300/80">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/60 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur md:grid-cols-3">
            {workflow.map(({ title, desc, icon: Icon }, index) => (
              <div key={title} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-[0.18em] text-slate-200/60">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-300/80">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-amber-400/10 via-rose-400/10 to-blue-400/10 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-4">
              <Badge className="border border-amber-300/30 bg-amber-400/15 text-amber-100">Organizer-ready</Badge>
              <h2 className="text-3xl font-bold text-white">Built around real organizer workflows</h2>
              <p className="text-slate-200/80">
                The platform already covers the full organizer journey: setup, publishing, attendee operations, live
                event handling, analytics, refunds, payouts, and inventory-style add-ons for published events.
              </p>
            </div>

            <div className="space-y-3 text-sm text-slate-200/80">
              {capabilityGroups.map((group) => (
                <div key={group.title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="font-semibold text-white">{group.title}</div>
                  <ul className="mt-3 space-y-2">
                    {group.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-pink-300" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HostEvents;
