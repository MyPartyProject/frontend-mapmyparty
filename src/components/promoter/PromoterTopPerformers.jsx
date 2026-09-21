 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react";

const PromoterTopPerformers = () => {
  const topEvents = [
    {
      id: "1",
      title: "Summer Music Festival 2024",
      organizer: "ABC Events",
      ticketsSold: 4850,
      revenue: 285000,
      rank: 1,
    },
    {
      id: "2",
      title: "Food & Wine Festival",
      organizer: "Culinary Dreams",
      ticketsSold: 3200,
      revenue: 224000,
      rank: 2,
    },
    {
      id: "3",
      title: "Tech Innovation Conference",
      organizer: "TechCorp",
      ticketsSold: 1850,
      revenue: 199600,
      rank: 3,
    },
  ];

  const topOrganizers = [
    {
      id: "1",
      name: "ABC Events",
      totalEvents: 8,
      totalRevenue: 425000,
      rank: 1,
    },
    {
      id: "2",
      name: "Culinary Dreams",
      totalEvents: 5,
      totalRevenue: 345000,
      rank: 2,
    },
    {
      id: "3",
      name: "TechCorp",
      totalEvents: 6,
      totalRevenue: 298000,
      rank: 3,
    },
  ];

  const getRankColor = (rank) => {
    if (rank === 1) return "text-yellow-600";
    if (rank === 2) return "text-gray-600";
    if (rank === 3) return "text-amber-700";
    return "text-muted-foreground";
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Top Performing Events */}
      <Card className="hover:shadow-xl transition-all duration-300 animate-in fade-in-0 slide-in-from-right-4 border-2 border-red-200/50 ">
        <CardHeader className="bg-red-50  border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingUp className="w-5 h-5 text-red-600 animate-pulse" />
              Top Performing Events
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {topEvents.map((event, index) => (
            <div
              key={event.id}
              className="flex items-start gap-4 p-4 rounded-xl bg-gray-50  hover:bg-gray-100/70  border border-gray-200/50  transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-in fade-in-0 slide-in-from-left-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`text-3xl font-bold ${getRankColor(event.rank)} transition-transform duration-300 hover:scale-110`}>
                {getRankEmoji(event.rank)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1 text-foreground">{event.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  by {event.organizer}
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-100  text-red-700 ">
                    <Users className="w-3 h-3" />
                    <span>{event.ticketsSold} tickets</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100  text-black  font-semibold">
                    <DollarSign className="w-3 h-3" />
                    <span>₹{event.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Performing Organizers */}
      <Card className="hover:shadow-xl transition-all duration-300 animate-in fade-in-0 slide-in-from-left-4 border-2 border-black/20 ">
        <CardHeader className="bg-secondary text-secondary-foreground border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-foreground animate-pulse" />
              Top Performing Organizers
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {topOrganizers.map((organizer, index) => (
            <div
              key={organizer.id}
              className="flex items-start gap-4 p-4 rounded-xl bg-gray-50  hover:bg-gray-100/70  border border-gray-200/30  transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-in fade-in-0 slide-in-from-right-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`text-3xl font-bold ${getRankColor(organizer.rank)} transition-transform duration-300 hover:scale-110`}>
                {getRankEmoji(organizer.rank)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2 text-foreground">{organizer.name}</h4>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-secondary-foreground ">
                    <Calendar className="w-3 h-3" />
                    <span>{organizer.totalEvents} events</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-100  text-red-700  font-semibold">
                    <DollarSign className="w-3 h-3" />
                    <span>₹{organizer.totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoterTopPerformers;
