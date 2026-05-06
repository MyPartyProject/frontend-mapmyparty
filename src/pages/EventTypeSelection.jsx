 import { useNavigate } from "react-router-dom";
import { /* Users, */ Lock, Globe, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EventTypeSelection = () => {
  const navigate = useNavigate();

  const eventTypes = [
    /*
    {
      id: "guest-list",
      title: "Guest List Event",
      description:
        "Invite-only event with a curated guest list. Perfect for private gatherings and exclusive occasions.",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    */
    {
      id: "exclusive",
      title: "Exclusive Event",
      description: "Keep it premium and private with promotion only on MapMyParty.",
      icon: Lock,
      color: "text-accent",
      bgColor: "bg-accent/10",
      fee: "5% platform fee",
      highlights: [
        "Promote only on this platform",
        "Curated, high-intent audience",
      ],
      cta: "Select Exclusive",
    },
    {
      id: "non-exclusive",
      title: "Non-Exclusive Event",
      description: "Reach everywhere: list here and across other platforms.",
      icon: Globe,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      fee: "10% platform fee",
      highlights: [
        "Multi-platform promotion allowed",
        "Visibility-first, broad audience",
      ],
      cta: "Select Non-Exclusive",
    },
  ];

  const handleSelectType = (typeId) => {
    navigate(`/organizer/create-event?type=${typeId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <main className="py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="relative">
            <button
              onClick={() => navigate(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 rounded-xl bg-card/70 border border-border/60 text-sm text-foreground hover:bg-muted transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="text-center space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Organizer Portal</p>
              <h1 className="text-4xl font-extrabold">Choose your event type</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Decide where you’ll promote, then pick the format that fits.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {eventTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className="group relative rounded-2xl overflow-hidden backdrop-blur hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-[var(--shadow-accent)] transition cursor-pointer"
                  onClick={() => handleSelectType(type.id)}
                >
                  <CardHeader className="space-y-4 pt-4">
                    <div className="flex items-center justify-between px-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-muted/60 border border-border/50 text-foreground/80">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {type.id === "exclusive" ? "Platform-only" : "Multi-platform"}
                      </span>
                      <span className="rounded-full px-3 py-1 bg-card/70 border border-border/40 text-muted-foreground">
                        {type.id === "exclusive" ? "Private focus" : "Public reach"}
                      </span>
                    </div>
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 via-secondary/25 to-accent/15 border border-border/50 flex items-center justify-center mx-auto shadow-inner shadow-black/20">
                        <Icon className="w-8 h-8 text-foreground" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-foreground">{type.title}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground px-6 leading-relaxed">
                        {type.description}
                      </CardDescription>
                    </div>
                    {type.highlights && (
                      <div className="grid gap-2 px-4">
                        {type.highlights.map((point) => (
                          <div
                            key={point}
                            className="flex items-center gap-2 text-sm text-foreground/80 bg-muted/40 border border-border/40 rounded-lg px-3 py-2"
                          >
                            <span className="w-2 h-2 rounded-full bg-secondary/80" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4 px-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary/80" />
                        Platform fee
                      </span>
                      <span className="rounded-full px-3 py-1 bg-primary/20 border border-primary/40 text-foreground font-semibold">
                        {type.fee}
                      </span>
                    </div>
                    <Button
                      className="w-full rounded-xl bg-primaryCTA text-primary-foreground font-semibold shadow-[0_12px_32px_-18px_rgba(124,58,237,0.75)] hover:bg-primaryCTA-hover active:bg-primaryCTA-active group-hover:scale-[1.01] transition"
                      variant="ghost"
                    >
                      {type.cta || "Select"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventTypeSelection;
