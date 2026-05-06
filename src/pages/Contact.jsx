import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import { Mail, Phone, MapPin, MessageSquare, Send, Clock } from "lucide-react";

const contactChannels = [
  {
    title: "Email",
    value: "mapmypartybro@gmail.com",
    icon: Mail,
    desc: "We respond within 1 business day.",
  },
  {
    title: "Phone / WhatsApp",
    value: "+91 12345 67890",
    icon: Phone,
    desc: "Support hours: 9 AM - 9 PM IST",
  },
  {
    title: "HQ",
    value: "Delhi, India",
    icon: MapPin,
    desc: "Come say hi at our studio.",
  },
];

const Contact = () => {
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

        <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-200/70">Contact</p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Talk to a real human. We're here to help your event shine.
            </h1>
            <p className="max-w-2xl text-lg text-slate-200/80">
              Whether you're hosting, attending, or partnering, our concierge support team responds fast and with care.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>
                Chat with us
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-slate-900">
                Book a call
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-3">
          {contactChannels.map(({ title, value, icon: Icon, desc }) => (
            <Card
              key={title}
              className="h-full border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-[0_25px_80px_-24px_rgba(0,0,0,0.65)]"
            >
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-pink-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{title}</div>
                    <div className="text-sm text-slate-300/75">{desc}</div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-white">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-amber-400/10 via-rose-400/10 to-blue-400/10 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-8 rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl md:grid-cols-5 md:p-10">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 text-sm text-slate-200/75">
                <Clock className="h-4 w-4" />
                <span>Avg. response time: under 2 hours</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Send us a note</h2>
              <p className="text-slate-200/80">
                Share a few details and we'll follow up with exactly what you need - no bots, no fluff.
              </p>
              <ul className="space-y-2 text-sm text-slate-200/75">
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-200" />
                  Event setup & onboarding
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-200" />
                  Ticketing, payouts, and refunds
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-200" />
                  Partnerships & media
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-200/75">Full Name</label>
                    <Input placeholder="Your name" className="border-white/15 bg-slate-950/40 text-white" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-200/75">Email</label>
                    <Input type="email" placeholder="you@example.com" className="border-white/15 bg-slate-950/40 text-white" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-200/75">Phone</label>
                    <Input placeholder="+91" className="border-white/15 bg-slate-950/40 text-white" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-200/75">Topic</label>
                    <Input placeholder="Ticketing, hosting, partnership..." className="border-white/15 bg-slate-950/40 text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-200/75">Message</label>
                  <Textarea
                    rows={4}
                    placeholder="Tell us a bit more so we can help fast."
                    className="border-white/15 bg-slate-950/40 text-white"
                  />
                </div>
                <Button className="w-full gap-2 md:w-auto">
                  <Send className="h-4 w-4" />
                  Send Message
                </Button>
                <p className="text-xs text-slate-200/70">By submitting, you agree to our Terms and Privacy Policy.</p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
