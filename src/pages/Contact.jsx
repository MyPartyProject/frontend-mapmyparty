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

        <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Contact</p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Talk to a real human. We're here to help your event shine.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Whether you're hosting, attending, or partnering, our concierge support team responds fast and with care.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>
                Chat with us
              </Button>
              <Button variant="outline" className="border-border bg-background text-foreground hover:bg-muted hover:text-foreground">
                Book a call
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-3">
          {contactChannels.map(({ title, value, icon: Icon, desc }) => (
            <Card
              key={title}
              className="h-full border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[var(--shadow-card)]"
            >
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{title}</div>
                    <div className="text-sm text-muted-foreground">{desc}</div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-foreground">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#fffaf5] via-[#faf7fc] to-[#f7f2f9] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-8 rounded-3xl border border-border/70 bg-card/95 p-6 shadow-[var(--shadow-elegant)] md:grid-cols-5 md:p-10">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Avg. response time: under 2 hours</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground">Send us a note</h2>
              <p className="text-muted-foreground">
                Share a few details and we'll follow up with exactly what you need - no bots, no fluff.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  Event setup & onboarding
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  Ticketing, payouts, and refunds
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  Partnerships & media
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Full Name</label>
                    <Input placeholder="Your name" className="border-border bg-background text-foreground" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <Input type="email" placeholder="you@example.com" className="border-border bg-background text-foreground" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Phone</label>
                    <Input placeholder="+91" className="border-border bg-background text-foreground" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Topic</label>
                    <Input placeholder="Ticketing, hosting, partnership..." className="border-border bg-background text-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Message</label>
                  <Textarea
                    rows={4}
                    placeholder="Tell us a bit more so we can help fast."
                    className="border-border bg-background text-foreground"
                  />
                </div>
                <Button className="w-full gap-2 md:w-auto">
                  <Send className="h-4 w-4" />
                  Send Message
                </Button>
                <p className="text-xs text-muted-foreground">By submitting, you agree to our Terms and Privacy Policy.</p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
