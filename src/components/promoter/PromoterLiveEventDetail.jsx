import { useMemo } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Users,
  Wallet2,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const PromoterLiveEventDetail = () => {
  const { id } = useParams();
  const { data, currency } = useOutletContext();

  const event = useMemo(() => data.events.find((item) => item.id === id), [data.events, id]);
  const organizer = event
    ? data.organizers.find((org) => org.name === event.organizer)
    : null;

  const tickets = useMemo(() => {
    if (!event) return [];
    return event.tickets || [
      { name: "General", price: 1500, soldQty: event.ticketsSold || 0, totalQty: event.totalTickets || 0 },
    ];
  }, [event]);

  if (!event) {
    return (
      <div className="space-y-6">
        <Link to="/promoter/live" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to live events
        </Link>
        <Card className="bg-card/70 border-border/60">
          <CardContent className="py-16 text-center">
            <p className="text-lg font-semibold">Live event not found</p>
            <p className="text-sm text-muted-foreground mt-2">Select another live event from the list.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCapacity = tickets.reduce((acc, t) => acc + (t.totalQty || 0), 0);
  const soldQty = tickets.reduce((acc, t) => acc + (t.soldQty || 0), 0);
  const gross = tickets.reduce((acc, t) => acc + (t.soldQty || 0) * (t.price || 0), 0);
  const remaining = Math.max(totalCapacity - soldQty, 0);
  const platformFee = event.platformFee || Math.round(gross * 0.09);
  const profit = gross - platformFee;

  return (
    <div className="space-y-6">
      <Link to="/promoter/live" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to live events
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  <CardDescription className="text-muted-foreground flex flex-wrap items-center gap-2">
                    <Badge className="bg-red-600">LIVE</Badge>
                    <span className="text-muted-foreground/60">•</span>
                    {event.category} • {event.subCategory}
                  </CardDescription>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-2">
                  <p className="text-xs text-muted-foreground">Event ID</p>
                  <p className="text-sm">{event.id}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" /> {event.startDate} • {event.endDate}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {event.venue} • {event.city}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                  <p className="text-xs text-muted-foreground">Sold</p>
                  <p className="text-lg font-semibold">{soldQty}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-lg font-semibold">{remaining}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                  <p className="text-xs text-muted-foreground">Capacity</p>
                  <p className="text-lg font-semibold">{totalCapacity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <CardTitle>Ticket types</CardTitle>
              <CardDescription className="text-muted-foreground">Price, sold, and capacity by tier.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {tickets.map((ticket) => (
                <div key={ticket.name} className="rounded-lg border border-border/60 bg-card/80 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{ticket.name}</p>
                    <p className="font-semibold text-accent">{currency(ticket.price)}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>{ticket.soldQty} sold</span>
                    <span>{ticket.totalQty} total</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{organizer?.name || event.organizer}</p>
                  <p className="text-muted-foreground">{organizer?.address || event.location}</p>
                </div>
                {organizer?.isVerified && (
                  <Badge variant="success">
                    <ShieldCheck className="w-4 h-4 mr-1" /> Verified
                  </Badge>
                )}
              </div>
              {organizer && (
                <div className="grid sm:grid-cols-2 gap-3 text-muted-foreground">
                  <div>Owner: {organizer.owner.name}</div>
                  <div>Contact: {organizer.contact}</div>
                  <div>Email: {organizer.email}</div>
                  <div>Managers: {organizer.managers?.length || 0}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
              <CardDescription className="text-muted-foreground">Gross and fee breakdown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gross revenue</span>
                <span className="font-semibold text-accent">{currency(gross)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Platform fee</span>
                <span className="font-semibold">{currency(platformFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated profit</span>
                <span className="font-semibold">{currency(profit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg ticket price</span>
                <span className="font-semibold">{currency(soldQty ? Math.round(gross / soldQty) : 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <CardTitle>Live health</CardTitle>
              <CardDescription className="text-muted-foreground">Real-time occupancy snapshot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tickets sold</span>
                <span className="font-semibold">{soldQty}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold">{remaining}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Capacity usage</span>
                <span className="font-semibold">{totalCapacity ? Math.round((soldQty / totalCapacity) * 100) : 0}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PromoterLiveEventDetail;
