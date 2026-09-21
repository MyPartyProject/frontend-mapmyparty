import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, Calendar, MapPin, Search, Ticket, Users, Wallet2, ChevronRight } from "lucide-react";

const PromoterLiveEvents = () => {
  const { data, currency } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState("");

  const liveEvents = useMemo(() => {
    return data.events
      .filter((event) => event.status === "LIVE")
      .map((event) => {
        const organizer = data.organizers.find((org) => org.name === event.organizer);
        const tickets = event.tickets || [
          { name: "General", price: 1500, soldQty: event.ticketsSold || 0, totalQty: event.totalTickets || 0 },
        ];
        const totalCapacity = tickets.reduce((acc, t) => acc + (t.totalQty || 0), 0);
        const soldQty = tickets.reduce((acc, t) => acc + (t.soldQty || 0), 0);
        const gross = tickets.reduce((acc, t) => acc + (t.soldQty || 0) * (t.price || 0), 0);
        return {
          ...event,
          organizer,
          tickets,
          totalCapacity,
          soldQty,
          gross,
          remaining: Math.max(totalCapacity - soldQty, 0),
        };
      });
  }, [data.events, data.organizers]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return liveEvents.filter((event) =>
      event.title.toLowerCase().includes(query) ||
      event.organizer?.name?.toLowerCase().includes(query)
    );
  }, [liveEvents, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Live Events</h2>
          <p className="text-muted-foreground">Real-time tracking of ongoing events</p>
        </div>
        <Badge variant="outline" className="text-red-600 border-red-600">
          <Activity className="w-3 h-3 mr-1 animate-pulse" />
          {filteredEvents.length} Live Now
        </Badge>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search live events or organizers..."
          className="pl-9"
        />
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="bg-card/70 border-border/60">
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No live events at the moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Events with status "LIVE" will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="bg-card/70 border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription className="text-muted-foreground flex flex-wrap items-center gap-2">
                      <Users className="w-4 h-4" />
                      {event.organizer?.name || event.organizer}
                      <span className="text-muted-foreground/60">•</span>
                      <MapPin className="w-4 h-4" />
                      {event.city}
                      <span className="text-muted-foreground/60">•</span>
                      <Calendar className="w-4 h-4" />
                      {event.startDate}
                    </CardDescription>
                  </div>
                  <Badge className="bg-red-600">LIVE</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                    <p className="text-xs text-muted-foreground">Sold</p>
                    <p className="font-semibold">{event.soldQty}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="font-semibold">{event.remaining}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                    <p className="text-xs text-muted-foreground">Gross</p>
                    <p className="font-semibold text-accent-foreground">{currency(event.gross)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Top ticket</p>
                    <p className="font-medium">{event.tickets[0]?.name || "General"}</p>
                  </div>
                  <Link
                    to={`/promoter/live/${event.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent-foreground hover:text-accent-foreground/80 transition"
                  >
                    View details <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoterLiveEvents;
