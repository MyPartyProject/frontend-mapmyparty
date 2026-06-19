 import { MapPin, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const EventLocation = ({ venue, address, phone }) => {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  return (
    <div id="location-section" className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-foreground">
        Location & Venue
      </h2>

      <Card className="overflow-hidden shadow-elegant">
        <CardContent className="p-0">
          {/* Map */}
          <div className="relative h-[400px] bg-muted">
            <div className="absolute inset-0 flex items-center justify-center bg-muted/65">
              <div className="text-center space-y-3 p-6">
                <MapPin className="w-16 h-16 mx-auto text-primary animate-pulse" />
                <div>
                  <p className="text-lg font-semibold mb-1">Interactive Map</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Map integration showing exact event location
                  </p>
                </div>
                <div className="text-xs text-muted-foreground bg-background px-3 py-2 rounded-md border border-border/60">
                  {address}
                </div>
              </div>
            </div>
          </div>

          {/* Venue Details */}
          <div className="p-6 space-y-4 bg-card border-t border-border/60">
            <div>
              <h3 className="text-2xl font-bold mb-2">{venue}</h3>
              <p className="text-muted-foreground flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                {address}
              </p>
            </div>

            {phone && (
              <p className="text-muted-foreground flex items-center gap-2">
                <Phone className="w-5 h-5 text-accent" />
                {phone}
              </p>
            )}

            <Button
              variant="accent"
              size="lg"
              asChild
              className="w-full sm:w-auto hover-scale"
            >
              <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventLocation;
