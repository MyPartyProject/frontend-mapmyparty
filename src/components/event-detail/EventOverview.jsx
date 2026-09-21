import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const EventOverview = ({ event }) => {
  if (!event) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Event Overview</h2>
        <Button 
          asChild 
          variant="outline" 
          className="group flex items-center gap-1 hover:bg-primaryCTA hover:text-primary-foreground transition-colors"
        >
          <Link to={`/event/${event.id}/overview`} target="_blank" rel="noopener noreferrer">
            View Full Overview <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-4">About This Event</h3>
            <p className="text-muted-foreground">
              {event.overview || 
               event.description?.substring(0, 300) + (event.description?.length > 300 ? '...' : '') ||
               'No overview available for this event.'}
            </p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.date && (
                <div>
                  <h4 className="font-medium mb-2">Date & Time</h4>
                  <p className="text-muted-foreground">
                    {event.date} {event.time && `• ${event.time}`}
                  </p>
                </div>
              )}
              
              {event.venue && (
                <div>
                  <h4 className="font-medium mb-2">Venue</h4>
                  <p className="text-muted-foreground">{event.venue}</p>
                  {event.address && (
                    <p className="text-muted-foreground text-sm mt-1">{event.address}</p>
                  )}
                </div>
              )}
              
              {event.category && (
                <div>
                  <h4 className="font-medium mb-2">Category</h4>
                  <p className="text-muted-foreground capitalize">{event.category}</p>
                </div>
              )}
              
              {event.organizerName && (
                <div>
                  <h4 className="font-medium mb-2">Organizer</h4>
                  <p className="text-muted-foreground">{event.organizerName}</p>
                </div>
              )}
            </div>
            
            {event.tags?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default EventOverview;
