import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import {
  BarChart3,
  CalendarDays,
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
  },
  {
    title: "Flexible editing",
    desc: "Jump directly to any section while editing and save only that section without being forced through the entire flow again.",
    icon: PencilLine,
  },
  {
    title: "Ticketing and event content",
    desc: "Manage ticket types, sponsors, artists, advisories, attendee questions, and organizer notes in one workflow.",
    icon: Ticket,
  },
  {
    title: "Live reception tools",
    desc: "Run live event operations with QR-based and manual check-ins plus real-time visibility into ticket movement.",
    icon: ScanLine,
  },
  {
    title: "Attendee visibility",
    desc: "Review bookings, payment status, check-in progress, and export attendee data when your operations team needs it.",
    icon: UserCheck,
  },
  {
    title: "Analytics, refunds, and payouts",
    desc: "Track revenue, top events, ticket performance, refund status, payout views, and organizer-side operational reporting.",
    icon: Wallet,
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

const HostEvents = () => {
  useEffect(() => {
    const nodes = document.querySelectorAll(".host-events-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="host-events-page min-h-screen bg-background text-foreground">
      <Header forceMainHeader />

      <section className="host-events__hero relative overflow-hidden pt-6 pb-16 sm:pt-8 sm:pb-20 lg:pt-10 lg:pb-24">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16 xl:gap-20">
            <div className="host-events-reveal max-w-xl space-y-8">
              <div className="space-y-5">
                <h1 className="host-events__hero-title font-bold text-foreground">
                  Everything organizers need to launch, manage, and run events in one place.
                </h1>
                <p className="host-events__lead max-w-lg text-muted-foreground">
                  Map MyParty brings together organizer onboarding, event creation, live check-ins, attendee
                  visibility, analytics, refunds, payouts, and operations tooling so your team can work from one
                  system instead of stitching together multiple tools.
                </p>
              </div>

              <ul className="space-y-4">
                {organizerBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primaryCTA" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/auth">
                  <Button className="h-11 rounded-full px-6 shadow-[var(--shadow-accent)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-16px_rgba(168,85,247,0.75)]">
                    Start Hosting
                  </Button>
                </Link>
                <Link to="/browse-events">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full px-6 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Explore Live Events
                  </Button>
                </Link>
              </div>
            </div>

            <div
              className="host-events-reveal host-events__dashboard-preview relative rounded-[1.75rem] border border-border/40 bg-card/55 p-6 shadow-[var(--shadow-elegant)] backdrop-blur-md sm:p-8"
              style={{ "--host-events-delay": "120ms" }}
            >
              <div className="relative z-10 mb-8 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-foreground">
                  Organizer command center
                </div>
                <h2 className="host-events__panel-title max-w-md font-semibold text-foreground">
                  Operate from setup to payout in one place
                </h2>
                <p className="max-w-md text-sm leading-7 text-muted-foreground">
                  A single view for organizer setup, event editing, live reception, attendee visibility, and
                  reporting.
                </p>
              </div>

              <div className="relative z-10 grid gap-4 sm:grid-cols-2">
                {highlights.map(({ title, value, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-border/40 bg-background/40 px-4 py-5 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/25 bg-primaryCTA/10 text-accent-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs text-muted-foreground">{title}</div>
                    <div className="host-events__metric mt-1.5 font-semibold text-foreground">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="host-events__section relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="host-events-reveal mx-auto mb-14 max-w-2xl space-y-4 text-center">
            <Badge className="w-fit rounded-full border border-border/50 bg-card/70 px-3 py-1.5 text-xs text-foreground">
              How it works
            </Badge>
            <h2 className="host-events__section-title font-bold text-foreground">From setup to live results</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Create your organizer profile, build and publish with control, then run check-ins, attendees, and
              reporting from the same workspace.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
            {workflow.map(({ title, desc, icon: Icon }, index) => (
              <article
                key={title}
                className="host-events-reveal relative space-y-5 rounded-[1.75rem] border border-border/35 bg-card/40 p-7 sm:p-8"
                style={{ "--host-events-delay": `${index * 90}ms` }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primaryCTA/10 text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold tracking-[0.18em] text-muted-foreground/80">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="host-events__card-title font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="host-events__section relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="host-events-reveal mx-auto mb-14 max-w-2xl space-y-4 text-center">
            <Badge className="w-fit rounded-full border border-border/50 bg-card/70 px-3 py-1.5 text-xs text-foreground">
              Why host with us
            </Badge>
            <h2 className="host-events__section-title font-bold text-foreground">Why Host Your Event with MapMyParty</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Every part of the host experience is organized around real organizer needs, from structured event setup
              to smoother live operations and clearer post-event visibility.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {features.map(({ title, desc, icon: Icon }, index) => (
              <article
                key={title}
                className="host-events-reveal host-events__card group rounded-[1.75rem] border border-border/40 bg-card/50 p-7 shadow-[var(--shadow-card)]"
                style={{ "--host-events-delay": `${index * 70}ms` }}
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primaryCTA/10 text-accent-foreground transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="host-events__card-title font-semibold text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="host-events__section relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="host-events-reveal mb-14 max-w-2xl space-y-4">
            <Badge className="w-fit rounded-full border border-border/50 bg-card/70 px-3 py-1.5 text-xs text-foreground">
              Organizer-ready
            </Badge>
            <h2 className="host-events__section-title font-bold text-foreground">Tools Tailored for Event Hosts</h2>
            <p className="max-w-xl text-muted-foreground">
              The platform already covers the full organizer journey: setup, publishing, attendee operations, live
              event handling, analytics, refunds, payouts, and inventory-style add-ons for published events.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {capabilityGroups.map(({ title, desc, points, icon: Icon }, index) => (
              <article
                key={title}
                className="host-events-reveal host-events__card flex h-full flex-col rounded-[1.75rem] border border-border/40 bg-card/45 p-7 sm:p-8"
                style={{ "--host-events-delay": `${index * 90}ms` }}
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primaryCTA/10 text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="host-events__card-title font-semibold text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{desc}</p>
                <div className="mt-7 space-y-3">
                  {points.map((point) => (
                    <p
                      key={point}
                      className="rounded-2xl border border-border/35 bg-background/35 px-4 py-3.5 text-sm leading-6 text-muted-foreground"
                    >
                      {point}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="host-events__section relative overflow-hidden pb-24 pt-8 sm:pb-28 lg:pb-32">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="host-events-reveal mx-auto max-w-3xl rounded-[2rem] border border-primary/25 bg-card/40 px-6 py-14 text-center shadow-[var(--shadow-elegant)] sm:px-10 sm:py-16">
            <Badge className="w-fit rounded-full border border-border/50 bg-background/50 px-3 py-1.5 text-xs text-foreground">
              Start hosting
            </Badge>
            <h2 className="host-events__section-title mt-5 font-bold text-foreground">
              Host your next event with MapMyParty
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Create, manage, and run events from one organizer-ready workspace built for launch day and everything
              after.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth">
                <Button className="h-11 rounded-full px-6 shadow-[var(--shadow-accent)] transition-all duration-300 hover:-translate-y-0.5">
                  Get Started for Free
                </Button>
              </Link>
              <Link to="/browse-events">
                <Button variant="outline" className="h-11 rounded-full px-6 transition-all duration-300 hover:-translate-y-0.5">
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
