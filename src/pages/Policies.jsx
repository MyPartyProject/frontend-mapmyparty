import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, RefreshCcw, ScrollText } from "lucide-react";

const sections = {
  refund: {
    title: "Refund Policy",
    icon: RefreshCcw,
    items: [
      "Full refunds available up to 48 hours before the event start time unless otherwise stated on the event page.",
      "Inside 48 hours, refunds are subject to organizer approval and venue policies.",
      "If an event is cancelled or rescheduled, you’ll receive an automatic refund or a transfer option at no extra cost.",
      "Processing times: 5–7 business days to the original payment method.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    icon: ScrollText,
    items: [
      "Tickets are non-transferable unless explicitly enabled by the organizer.",
      "Your ticket must match a valid government ID when required by the organizer or venue.",
      "Reselling above face value may lead to cancellation without refund.",
      "By booking, you agree to venue safety rules, age restrictions, and compliance with local laws.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    icon: ShieldCheck,
    items: [
      "We collect only what we need to process your booking and improve your experience.",
      "Payment data is handled by PCI-compliant partners; we never store raw card details.",
      "You control marketing preferences; unsubscribe anytime via email footer or profile settings.",
      "Data removal requests: email privacy@mapmyparty.com and we’ll process within 7 business days.",
    ],
  },
};

const Policies = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <div className="space-y-3 mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Policies</p>
          <h1 className="text-4xl md:text-5xl font-bold">Your trust, protected.</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transparent terms for stress-free bookings. Explore refunds, terms, and privacy in one place.
          </p>
        </div>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid grid-cols-3 bg-muted/70 border border-border/70">
            <TabsTrigger value="terms">Terms &amp; Conditions</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="refund">Refund Policy</TabsTrigger>
          </TabsList>

          {Object.entries(sections).map(([key, section]) => {
            const Icon = section.icon;
            return (
              <TabsContent key={key} value={key} className="mt-6">
                <Card className="bg-card border-border/70">
                  <CardContent className="p-6 md:p-8 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[#D60024]" />
                      </div>
                      <h2 className="text-2xl font-semibold">{section.title}</h2>
                    </div>
                    <ul className="space-y-3 text-muted-foreground leading-relaxed">
                      {section.items.map((item, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="text-[#22c55e] mt-1">●</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default Policies;
