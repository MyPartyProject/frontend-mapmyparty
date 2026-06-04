import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const sectionClass = "host-events__section relative overflow-hidden py-16 sm:py-20 lg:py-24";
const containerClass = "relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8";
const eyebrowClass = "w-fit border-border/60 bg-card/80 text-foreground shadow-[var(--shadow-card)]";
const panelClass =
  "rounded-[8px] border border-border/50 bg-card/70 shadow-[var(--shadow-card)] backdrop-blur";
const elevatedPanelClass =
  "host-events__card rounded-[8px] border border-border/50 bg-card/70 shadow-[var(--shadow-card)] transition-all duration-200 hover:border-accent/60";
const iconBoxClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-border/50 bg-muted/45 text-accent";
const ctaButtonClass = "transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0";

const HostEvents = () => {
  return (
    <div className="host-events-page min-h-screen bg-background text-foreground">
      <Header forceMainHeader />

      <section className="host-events__hero relative overflow-hidden border-b border-border/35 bg-background py-14 sm:py-16 lg:py-20">
        <div className={containerClass}>
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-14">
            <div className="max-w-2xl space-y-6">
              <div className="space-y-4">
                <Badge className={eyebrowClass}>Host Events</Badge>
                <h1 className="host-events__hero-title font-bold text-foreground">
                  Everything organizers need to launch, manage, and run events in one place.
                </h1>
                <p className="host-events__lead max-w-xl text-muted-foreground">
                  Map MyParty brings together organizer onboarding, event creation, live check-ins, attendee
                  visibility, analytics, refunds, payouts, and operations tooling so your team can work from one
                  system instead of stitching together multiple tools.
                </p>
              </div>

              <ul className="space-y-3">
                {organizerBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link to="/auth">
                  <Button className={ctaButtonClass}>Start Hosting</Button>
                </Link>
                <Link to="/browse-events">
                  <Button variant="outline" className={ctaButtonClass}>
                    Explore Live Events
                  </Button>
                </Link>
              </div>
            </div>

            <div className={`${panelClass} host-events__dashboard-preview p-4 sm:p-5 lg:p-6`}>
              <div className="mb-5 flex flex-col gap-4 border-b border-border/35 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Organizer command center
                  </div>
                  <h2 className="host-events__panel-title font-semibold text-foreground">
                    Operate from setup to payout in one place
                  </h2>
                  <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                    A single view for organizer setup, event editing, live reception, attendee visibility, and
                    reporting.
                  </p>
                </div>
                <Badge className={`${eyebrowClass} shrink-0`}>Live dashboard</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {highlights.map(({ title, value, icon: Icon }) => (
                  <div key={title} className="rounded-[8px] border border-border/45 bg-background/45 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] leading-tight text-muted-foreground">{title}</span>
                      <Icon className="h-4 w-4 shrink-0 text-accent" />
                    </div>
                    <div className="host-events__metric font-semibold text-foreground">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {workflow.map(({ title, desc, icon: Icon }, index) => (
                  <div key={title} className="rounded-[8px] border border-border/45 bg-muted/25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className={iconBoxClass}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold leading-snug text-foreground">{title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionClass} bg-background`}>
        <div className={containerClass}>
          <div className="host-events__intro mx-auto mb-10 max-w-3xl space-y-4 text-center">
            <Badge className={eyebrowClass}>Why host with us</Badge>
            <h2 className="host-events__section-title font-bold text-foreground">Why Host Your Event with MapMyParty</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Every part of the host experience is organized around real organizer needs, from structured event setup
              to smoother live operations and clearer post-event visibility.
            </p>
          </div>

          <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, desc, icon: Icon }) => (
              <Card key={title} className={elevatedPanelClass}>
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className={iconBoxClass}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="host-events__card-title font-semibold text-foreground">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionClass} bg-card/25`}>
        <div className={containerClass}>
          <div className="host-events__intro mb-10 max-w-2xl space-y-4">
            <Badge className={eyebrowClass}>Organizer-ready</Badge>
            <h2 className="host-events__section-title font-bold text-foreground">Tools Tailored for Event Hosts</h2>
            <p className="text-muted-foreground">
              The platform already covers the full organizer journey: setup, publishing, attendee operations, live
              event handling, analytics, refunds, payouts, and inventory-style add-ons for published events.
            </p>
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            {capabilityGroups.map(({ title, desc, points, icon: Icon }) => (
              <article key={title} className={`${elevatedPanelClass} flex h-full flex-col p-5`}>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className={iconBoxClass}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="rounded-full border border-border/45 bg-background/45 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {points.length} focus areas
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="host-events__card-title font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>

                <ul className="mt-5 space-y-3 border-t border-border/35 pt-5 text-sm leading-relaxed text-muted-foreground">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionClass} bg-background`}>
        <div className={containerClass}>
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <Badge className={eyebrowClass}>Start hosting</Badge>
            <h2 className="host-events__section-title font-bold text-foreground">Host your next event with MapMyParty</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Create, manage, and run events from one organizer-ready workspace built for launch day and everything
              after.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Link to="/auth">
                <Button className={ctaButtonClass}>Get Started for Free</Button>
              </Link>
              <Link to="/browse-events">
                <Button variant="outline" className={ctaButtonClass}>
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
