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
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white">About Map MyParty</Badge>
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                We're reimagining how the world meets, celebrates, and discovers.
              </h1>
              <p className="max-w-2xl text-lg text-slate-200/80">
                Map MyParty makes it effortless to create, find, and experience unforgettable events. From intimate
                gigs to city-wide festivals, we connect organizers and guests with tools that feel delightful and fast.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-400 hover:to-fuchsia-400">
                  Browse Events
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-slate-900">
                  Host an Event
                </Button>
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
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map(({ title, desc, icon: Icon }) => (
              <Card
                key={title}
                className="border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-[0_25px_80px_-24px_rgba(0,0,0,0.65)]"
              >
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-pink-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300/80">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-amber-400/10 via-rose-400/10 to-blue-400/10 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-8 rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-xl md:grid-cols-2 md:p-10">
            <div className="space-y-4">
              <Badge className="border border-amber-300/30 bg-amber-400/15 text-amber-100">Our promise</Badge>
              <h2 className="text-3xl font-bold text-white">Every event feels premium</h2>
              <p className="text-slate-200/80">
                Lightning-fast checkout, transparent fees, curated recommendations, and a team that has your back from
                the first click to the final encore.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white hover:from-fuchsia-400 hover:to-pink-400">
                  Get Started
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-slate-900">
                  Talk to us
                </Button>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-200/80">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                "We moved our entire festival series to Map MyParty and saw 19% faster sell-outs. The guest experience
                is unmatched."
                <div className="mt-3 font-semibold text-white">- Aanya Desai, Festival Director</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                "Check-ins are smoother, and refunds are transparent. It just works."
                <div className="mt-3 font-semibold text-white">- Rohan Mehta, Venue Partner</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
