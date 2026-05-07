import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import {
  BarChart3,
  CalendarDays,
  Eye,
  Kanban,
  LineChart,
  PencilLine,
  QrCode,
  Rocket,
  Save,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserCheck,
  Wallet,
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
    icon: CalendarDays,
    visual: "builder",
  },
  {
    title: "Flexible editing",
    desc: "Jump directly to any section while editing and save only that section without being forced through the entire flow again.",
    icon: PencilLine,
    visual: "editing",
  },
  {
    title: "Ticketing and event content",
    desc: "Manage ticket types, sponsors, artists, advisories, attendee questions, and organizer notes in one workflow.",
    icon: Ticket,
    visual: "ticketing",
  },
  {
    title: "Live reception tools",
    desc: "Run live event operations with QR-based and manual check-ins plus real-time visibility into ticket movement.",
    icon: ScanLine,
    visual: "reception",
  },
  {
    title: "Attendee visibility",
    desc: "Review bookings, payment status, check-in progress, and export attendee data when your operations team needs it.",
    icon: UserCheck,
    visual: "attendees",
  },
  {
    title: "Analytics, refunds, and payouts",
    desc: "Track revenue, top events, ticket performance, refund status, payout views, and organizer-side operational reporting.",
    icon: Wallet,
    visual: "analytics",
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
    icon: Rocket,
    points: [
      "Organizer onboarding with profile and bank setup",
      "Draft saving, section-wise editing, review, and publishing",
      "Event details, media uploads, date and time, and venue setup",
    ],
  },
  {
    title: "Event management",
    desc: "Keep event content, pricing, and team-facing details organized without leaving the same workflow.",
    icon: Kanban,
    points: [
      "Multiple ticket types with pricing and event-specific configuration",
      "Sponsors, artists, advisories, attendee questions, and organizer notes",
      "My Events overview with search, statuses, edit access, and cancellation requests",
    ],
  },
  {
    title: "Operations and reporting",
    desc: "Handle live operations and post-event reporting from a single organizer-ready command center.",
    icon: LineChart,
    points: [
      "Live event monitoring, reception desk tools, and QR/manual check-in flows",
      "Attendee management with payment visibility, check-in status, and CSV export",
      "Audience analytics, refunds, payouts, and add-on inventory for published events",
    ],
  },
];

const sectionClass = "host-events__section relative overflow-hidden py-20 sm:py-24 lg:py-32";
const containerClass = "host-events__container relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8";
const sectionIntroClass = "host-events__intro mx-auto mb-10 max-w-3xl space-y-4 text-center lg:mb-12";
const subtlePanelClass = "rounded-2xl border border-white/10 bg-slate-950/35";
const cardClass =
  "host-events__card h-full rounded-2xl border border-white/10 bg-white/[0.055] shadow-[0_24px_80px_-42px_rgba(0,0,0,0.85)] backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-300/35 hover:bg-white/[0.075] hover:shadow-[0_30px_90px_-38px_rgba(201,151,116,0.35)]";
const ctaButtonClass =
  "transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_14px_34px_-18px_rgba(249,168,212,0.85)] active:scale-[0.98]";

const FeatureAccent = ({ type }) => {
  if (type === "builder") {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200/20 bg-amber-200/10 text-[10px] font-semibold text-amber-100">
              {step}
            </span>
            {step < 3 && <span className="h-px w-5 bg-white/15" />}
          </div>
        ))}
      </div>
    );
  }

  if (type === "editing") {
    return (
      <div className="relative h-16 w-24">
        <span className="absolute left-0 top-2 h-10 w-16 rounded-xl border border-white/10 bg-white/[0.08]" />
        <span className="absolute bottom-0 right-0 h-10 w-16 rounded-xl border border-amber-200/20 bg-amber-200/10" />
        <span className="absolute left-5 top-7 h-2 w-12 rounded-full bg-pink-200/35" />
      </div>
    );
  }

  if (type === "ticketing") {
    return (
      <div className="grid gap-2">
        <span className="relative h-8 w-24 rounded-xl border border-pink-200/20 bg-pink-200/10">
          <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-slate-950" />
          <span className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-slate-950" />
        </span>
        <span className="relative ml-4 h-8 w-20 rounded-xl border border-amber-200/20 bg-amber-200/10">
          <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-slate-950" />
          <span className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-slate-950" />
        </span>
      </div>
    );
  }

  if (type === "reception") {
    return (
      <div className="relative h-16 w-20">
        <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-lg border-l border-t border-amber-100/60" />
        <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-lg border-r border-t border-amber-100/60" />
        <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-lg border-b border-l border-amber-100/60" />
        <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-lg border-b border-r border-amber-100/60" />
        <span className="absolute left-3 top-1/2 h-px w-14 bg-pink-200/60 shadow-[0_0_14px_rgba(249,168,212,0.7)]" />
      </div>
    );
  }

  if (type === "attendees") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {[0, 1, 2].map((item) => (
            <span key={item} className="h-8 w-8 rounded-full border border-white/15 bg-white/10" />
          ))}
        </div>
        <Eye className="h-8 w-8 text-amber-100/70" />
      </div>
    );
  }

  return (
    <div className="relative h-16 w-24">
      <span className="absolute bottom-1 left-1 h-10 w-10 rounded-full border border-amber-200/25 bg-amber-200/10" />
      <span className="absolute right-2 top-1 h-8 w-8 rounded-full border border-pink-200/25 bg-pink-200/10" />
      <span className="absolute bottom-4 left-8 h-px w-12 -rotate-12 bg-amber-100/55 shadow-[0_0_14px_rgba(201,151,116,0.65)]" />
    </div>
  );
};

const FeatureVisual = ({ type, icon: Icon }) => {
  return (
    <div className="host-events__feature-visual group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition-all duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(249,168,212,0.18),transparent_34%),radial-gradient(circle_at_78%_78%,rgba(201,151,116,0.14),transparent_34%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="host-events__feature-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.14] to-white/5 text-pink-100 shadow-[0_18px_44px_-24px_rgba(249,168,212,0.8)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-amber-300/35 group-hover:text-amber-100 group-hover:shadow-[0_20px_54px_-20px_rgba(201,151,116,0.75)]">
          <Icon className="h-7 w-7" />
        </div>
        <div className="flex min-h-16 flex-1 items-center justify-end">
          <FeatureAccent type={type} />
        </div>
      </div>
    </div>
  );
};

const HostEvents = () => {
  return (
    <div className="host-events-page min-h-screen bg-slate-950 text-slate-50">
      <Header forceMainHeader />

      <section className="relative overflow-hidden bg-[#140a2b] pb-16 pt-8 sm:pb-20 sm:pt-10 lg:pb-28 lg:pt-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,105,180,0.28),transparent_45%),radial-gradient(circle_at_65%_25%,rgba(122,78,255,0.35),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,183,104,0.25),transparent_40%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0619] via-[#1b0c2f] to-[#31154a] opacity-90" />
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute left-16 top-16 h-3 w-3 rounded-full bg-pink-300/70 blur-sm" />
          <div className="absolute left-40 top-28 h-2 w-2 rounded-full bg-purple-200/70 blur-sm" />
          <div className="absolute right-20 top-20 h-4 w-4 rounded-full bg-fuchsia-300/70 blur-sm" />
          <div className="absolute right-36 bottom-24 h-3 w-3 rounded-full bg-rose-200/80 blur-sm" />
          <div className="absolute left-1/2 bottom-14 h-2 w-2 rounded-full bg-amber-200/80 blur-sm" />
        </div>

        <div className={containerClass}>
          <div className="host-events__section-motion grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
            <div className="max-w-2xl space-y-7">
              <div className="space-y-5">
                <Badge className="border border-white/20 bg-white/10 text-white">Host Events</Badge>
                <h1 className="host-events__hero-title font-bold text-white">
                  Everything organizers need to launch, manage, and run events in one place.
                </h1>
                <p className="host-events__lead max-w-xl text-slate-200/80">
                  Map MyParty brings together organizer onboarding, event creation, live check-ins, attendee
                  visibility, analytics, refunds, payouts, and operations tooling so your team can work from one
                  system instead of stitching together multiple tools.
                </p>
              </div>

              <ul className="grid gap-3">
                {organizerBenefits.map((benefit, index) => (
                  <li
                    key={benefit}
                    className="host-events__card flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-slate-200/85"
                    style={{ "--stagger": index }}
                  >
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-pink-300 shadow-[0_0_16px_rgba(249,168,212,0.55)]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button className={ctaButtonClass}>Start Hosting</Button>
                </Link>
                <Link to="/browse-events">
                  <Button
                    variant="outline"
                    className={`border-white/30 text-white hover:bg-white hover:text-slate-900 ${ctaButtonClass}`}
                  >
                    Explore Live Events
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="host-events__card overflow-hidden rounded-3xl border-white/15 bg-white/10 shadow-[0_28px_90px_-38px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              <CardContent className="space-y-7 p-5 sm:p-6 md:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200/60">
                      Organizer command center
                    </div>
                    <h2 className="host-events__panel-title font-semibold text-white">
                      Operate from setup to payout in one place
                    </h2>
                    <p className="max-w-xl text-sm leading-relaxed text-slate-300/80">
                      A single view for organizer setup, event editing, live reception, attendee visibility, and
                      reporting.
                    </p>
                  </div>
                  <Badge className="w-fit border border-white/15 bg-white/10 text-slate-100">Live dashboard</Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {highlights.map(({ title, value, icon: Icon }, index) => (
                    <div
                      key={title}
                      className="host-events__card space-y-3 rounded-2xl border border-white/10 bg-white/10 p-4"
                      style={{ "--stagger": index }}
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-200/75">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-pink-200">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span>{title}</span>
                      </div>
                      <div className="host-events__metric font-bold text-white">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {workflow.map(({ title, desc, icon: Icon }, index) => (
                    <div key={title} className={`${subtlePanelClass} host-events__card p-4`} style={{ "--stagger": index }}>
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

      <section className={`${sectionClass} bg-slate-950`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className={containerClass}>
          <div className={sectionIntroClass}>
            <Badge className="border border-white/15 bg-white/5 text-slate-100">Why host with us</Badge>
            <h2 className="host-events__section-title font-bold text-white">Why Host Your Event with MapMyParty</h2>
            <p className="mx-auto max-w-2xl text-slate-300/80">
              Every part of the host experience is organized around real organizer needs, from structured event setup
              to smoother live operations and clearer post-event visibility.
            </p>
          </div>

          <div className="host-events__stagger grid items-stretch gap-5 md:grid-cols-2 lg:gap-6 xl:grid-cols-3">
            {features.map(({ title, desc, icon: Icon, visual }, index) => (
              <Card key={title} className={cardClass} style={{ "--stagger": index }}>
                <CardContent className="flex h-full flex-col gap-5 p-6">
                  <FeatureVisual type={visual} icon={Icon} index={index} />

                  <div className="space-y-3">
                    <h3 className="host-events__card-title font-semibold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-300/80">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionClass} bg-slate-900/60`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(119,34,86,0.18),transparent_34%),radial-gradient(circle_at_88%_74%,rgba(201,151,116,0.13),transparent_32%)]" />
        <div className={containerClass}>
          <div className={`${sectionIntroClass} lg:mx-0 lg:text-left`}>
            <Badge className="border border-amber-300/30 bg-amber-400/15 text-amber-100">Organizer-ready</Badge>
            <h2 className="host-events__section-title font-bold text-white">Tools Tailored for Event Hosts</h2>
            <p className="max-w-2xl text-slate-300/80 lg:mx-0">
              The platform already covers the full organizer journey: setup, publishing, attendee operations, live
              event handling, analytics, refunds, payouts, and inventory-style add-ons for published events.
            </p>
          </div>

          <div className="host-events__stagger grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
            {capabilityGroups.map(({ title, desc, points, icon: Icon }, index) => (
              <Card key={title} className={cardClass} style={{ "--stagger": index }}>
                <CardContent className="flex h-full flex-col gap-5 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200/75">
                      {points.length} focus areas
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="host-events__card-title font-semibold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-300/80">{desc}</p>
                  </div>

                  <div className={`${subtlePanelClass} mt-auto space-y-3 p-4 text-sm leading-relaxed text-slate-200/80`}>
                    {points.map((point) => (
                      <div key={point} className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pink-300" />
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

      <section className={`${sectionClass} bg-gradient-to-br from-amber-400/10 via-rose-400/10 to-blue-400/10`}>
        <div className={containerClass}>
          <div className="host-events__section-motion mx-auto max-w-4xl rounded-3xl border border-white/15 bg-white/10 px-5 py-9 text-center shadow-[0_30px_90px_-44px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:px-8 md:px-10 md:py-12">
            <Badge className="border border-amber-300/30 bg-amber-400/15 text-amber-100">Start hosting</Badge>
            <h2 className="host-events__section-title mt-4 font-bold text-white">Host your next event with MapMyParty</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200/80">
              Create, manage, and run events from one organizer-ready workspace built for launch day and everything
              after.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth">
                <Button className={ctaButtonClass}>Get Started for Free</Button>
              </Link>
              <Link to="/browse-events">
                <Button
                  variant="outline"
                  className={`border-white/30 text-white hover:bg-white hover:text-slate-900 ${ctaButtonClass}`}
                >
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
