import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { Calendar, MapPin, Users, Sparkles, ShieldCheck, HeartHandshake, Star } from "lucide-react";

const highlights = [
  { title: "Cities covered", value: "120+", icon: MapPin },
  { title: "Events hosted", value: "48k", icon: Calendar },
  { title: "Happy guests", value: "6.2M", icon: Users },
  { title: "Avg. rating", value: "4.8 / 5", icon: Star },
];

const pillars = [
  {
    title: "Trusted experiences",
    desc: "Curated organizers, verified venues, and transparent pricing so every ticket feels premium.",
    icon: ShieldCheck,
  },
  {
    title: "Human-first support",
    desc: "Concierge-style assistance before, during, and after every event. Real people, real help.",
    icon: HeartHandshake,
  },
  {
    title: "Community-driven",
    desc: "Built for creators, artists, and fans to meet in moments that matter.",
    icon: Sparkles,
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header forceMainHeader />

      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(201,151,116,0.16),transparent_42%),radial-gradient(circle_at_65%_25%,rgba(72,40,93,0.12),transparent_38%),radial-gradient(circle_at_80%_70%,rgba(119,34,86,0.1),transparent_38%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#fbf8fd] to-[#f6effa]" />
        <div className="absolute inset-0 opacity-70">
          <div className="absolute left-16 top-16 h-3 w-3 rounded-full bg-[#C99774]/60 blur-sm" />
          <div className="absolute left-40 top-28 h-2 w-2 rounded-full bg-[#9d7bb3]/55 blur-sm" />
          <div className="absolute right-20 top-20 h-4 w-4 rounded-full bg-[#b78bcb]/55 blur-sm" />
          <div className="absolute right-36 bottom-24 h-3 w-3 rounded-full bg-[#d7b69a]/65 blur-sm" />
          <div className="absolute left-1/2 bottom-14 h-2 w-2 rounded-full bg-[#772256]/25 blur-sm" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
          <Badge className="mb-4 border border-border/70 bg-card text-foreground">About Map MyParty</Badge>
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                We're reimagining how the world meets, celebrates, and discovers.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Map MyParty makes it effortless to create, find, and experience unforgettable events. From intimate
                gigs to city-wide festivals, we connect organizers and guests with tools that feel delightful and fast.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button>
                  Browse Events
                </Button>
                <Button variant="outline" className="border-border bg-background text-foreground hover:bg-muted hover:text-foreground">
                  Host an Event
                </Button>
              </div>
            </div>

            <Card className="border-border/70 bg-card/95 shadow-[var(--shadow-elegant)]">
              <CardContent className="grid grid-cols-2 gap-4 p-6">
                {highlights.map(({ title, value, icon: Icon }) => (
                  <div key={title} className="space-y-2 rounded-xl border border-border/60 bg-muted/70 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{title}</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map(({ title, desc, icon: Icon }) => (
              <Card
                key={title}
                className="border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[var(--shadow-card)]"
              >
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#fffaf5] via-[#faf7fc] to-[#f7f2f9] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-8 rounded-3xl border border-border/70 bg-card/95 p-8 shadow-[var(--shadow-elegant)] md:grid-cols-2 md:p-10">
            <div className="space-y-4">
              <Badge className="border border-accent/35 bg-accent/12 text-foreground">Our promise</Badge>
              <h2 className="text-3xl font-bold text-foreground">Every event feels premium</h2>
              <p className="text-muted-foreground">
                Lightning-fast checkout, transparent fees, curated recommendations, and a team that has your back from
                the first click to the final encore.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button>
                  Get Started
                </Button>
                <Button variant="outline" className="border-border bg-background text-foreground hover:bg-muted hover:text-foreground">
                  Talk to us
                </Button>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/60 bg-muted/70 p-4">
                "We moved our entire festival series to Map MyParty and saw 19% faster sell-outs. The guest experience
                is unmatched."
                <div className="mt-3 font-semibold text-foreground">- Aanya Desai, Festival Director</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/70 p-4">
                "Check-ins are smoother, and refunds are transparent. It just works."
                <div className="mt-3 font-semibold text-foreground">- Rohan Mehta, Venue Partner</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
