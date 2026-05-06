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

const organizerBenefits = [
  "Set up your organizer profile, business details, and bank information before you launch.",
  "Build events section by section with control over tickets, media, venue, artists, and sponsors.",
  "Run live check-ins, manage attendees, and stay on top of analytics, refunds, and payouts.",
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
    desc: "Launch with a structured workspace for organizer onboarding, draft management, and publishing control.",
    icon: ShieldCheck,
    points: [
      "Organizer onboarding with profile and bank setup",
      "Draft saving, section-wise editing, review, and publishing",
      "Event details, media uploads, date and time, and venue setup",
    ],
  },
  {
    title: "Event management",
    desc: "Keep event content, pricing, and team-facing details organized without leaving the same workflow.",
    icon: Ticket,
    points: [
      "Multiple ticket types with pricing and event-specific configuration",
      "Sponsors, artists, advisories, attendee questions, and organizer notes",
      "My Events overview with search, statuses, edit access, and cancellation requests",
    ],
  },
  {
    title: "Operations and reporting",
    desc: "Handle live operations and post-event reporting from a single organizer-ready command center.",
    icon: BarChart3,
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
          <div className="grid gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:gap-12">
            <div className="space-y-7">
              <div className="space-y-5">
                <Badge className="border border-white/20 bg-white/10 text-white">Host Events</Badge>
                <h1 className="text-3xl font-bold leading-tight md:text-[2.75rem]">
                  Everything organizers need to launch, manage, and run events in one place.
                </h1>
                <p className="max-w-2xl text-lg text-slate-200/80">
                  Map MyParty brings together organizer onboarding, event creation, live check-ins, attendee
                  visibility, analytics, refunds, payouts, and operations tooling so your team can work from one
                  system instead of stitching together multiple tools.
                </p>
              </div>

              <ul className="space-y-3">
                {organizerBenefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200/85"
                  >
                    <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-pink-300 shadow-[0_0_16px_rgba(249,168,212,0.55)]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button>
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

            <Card className="overflow-hidden border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_25px_80px_-35px_rgba(0,0,0,0.75)]">
              <CardContent className="space-y-6 p-6 md:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200/60">
                      Organizer command center
                    </div>
                    <h2 className="text-2xl font-semibold text-white">Operate from setup to payout in one place</h2>
                    <p className="max-w-xl text-sm leading-relaxed text-slate-300/80">
                      A single view for organizer setup, event editing, live reception, attendee visibility, and
                      reporting.
                    </p>
                  </div>
                  <Badge className="w-fit border border-white/15 bg-white/10 text-slate-100">Live dashboard</Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {highlights.map(({ title, value, icon: Icon }) => (
                    <div key={title} className="space-y-3 rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-200/75">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-pink-200">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span>{title}</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {workflow.map(({ title, desc, icon: Icon }, index) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-100">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-200/55">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300/80">{desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 max-w-3xl space-y-4">
            <Badge className="border border-white/15 bg-white/5 text-slate-100">Why host with us</Badge>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Why Host Your Event with MapMyParty</h2>
            <p className="text-slate-300/80">
              Every part of the host experience is organized around real organizer needs, from structured event setup
              to smoother live operations and clearer post-event visibility.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map(({ title, desc, icon: Icon }, index) => (
              <Card
                key={title}
                className="h-full border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-[0_25px_80px_-24px_rgba(0,0,0,0.65)]"
              >
                <CardContent className="flex h-full flex-col gap-5 p-6">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-pink-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-200/70">
                        0{index + 1}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-2 rounded-full bg-white/10" />
                      <div className="h-2 w-4/5 rounded-full bg-white/5" />
                      <div className="flex gap-2 pt-2">
                        <div className="h-8 w-8 rounded-lg bg-white/10" />
                        <div className="h-8 flex-1 rounded-lg bg-white/5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-300/80">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 max-w-3xl space-y-4">
            <Badge className="border border-amber-300/30 bg-amber-400/15 text-amber-100">Organizer-ready</Badge>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Tools Tailored for Event Hosts</h2>
            <p className="text-slate-300/80">
              The platform already covers the full organizer journey: setup, publishing, attendee operations, live
              event handling, analytics, refunds, payouts, and inventory-style add-ons for published events.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {capabilityGroups.map(({ title, desc, points, icon: Icon }) => (
              <Card key={title} className="h-full border-white/10 bg-white/5 backdrop-blur">
                <CardContent className="flex h-full flex-col gap-5 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200/75">
                      {points.length} focus areas
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-300/80">{desc}</p>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-200/80">
                    {points.map((point) => (
                      <div key={point} className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-pink-300" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-amber-400/10 via-rose-400/10 to-blue-400/10 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl border border-white/15 bg-white/10 px-6 py-10 text-center backdrop-blur-xl md:px-10 md:py-12">
            <Badge className="border border-amber-300/30 bg-amber-400/15 text-amber-100">Start hosting</Badge>
            <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">
              Host your next event with MapMyParty
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200/80">
              Create, manage, and run events from one organizer-ready workspace built for launch day and everything
              after.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth">
                <Button>
                  Get Started for Free
                </Button>
              </Link>
              <Link to="/browse-events">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-slate-900">
                  Explore Live Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HostEvents;
