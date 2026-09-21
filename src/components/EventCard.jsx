import { useState } from "react";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import eventFallback from "@/assets/event-music.jpg";

// Template 1: Classic Card (Original design)
const ClassicCardTemplate = ({ organizerSlug, eventSlug, title, date, location, imageSrc, category, attendees, price, handleImageError }) => {
  return (
    <Link to={`/events/${organizerSlug}/${eventSlug}`} target="_blank" rel="noopener noreferrer">
      <Card className="group overflow-hidden border-border hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
        <div className="relative overflow-hidden aspect-[16/9]">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={handleImageError}
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              {category}
            </Badge>
          </div>
        </div>
        <CardContent className="p-5">
          <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-accent-foreground transition-colors">
            {title}
          </h3>

          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{date}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{location}</span>
            </div>

            {attendees && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{attendees} attending</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            {price && (
              <span className="text-lg font-bold text-accent-foreground">{price}</span>
            )}
            <Button variant="accent" size="sm" className="ml-auto">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

// Template 2: Modern Horizontal
const ModernHorizontalTemplate = ({ organizerSlug, eventSlug, title, date, location, imageSrc, category, attendees, price, handleImageError }) => {
  return (
    <Link to={`/events/${organizerSlug}/${eventSlug}`} target="_blank" rel="noopener noreferrer">
      <Card className="group overflow-hidden border-border hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
        <div className="flex flex-col md:flex-row h-full">
          <div className="relative w-full md:w-2/5 h-48 md:h-auto overflow-hidden">
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={handleImageError}
            />
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs">
                {category}
              </Badge>
            </div>
          </div>
          <CardContent className="flex-1 p-4 md:p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg md:text-xl mb-2 line-clamp-2 group-hover:text-accent-foreground transition-colors">
                {title}
              </h3>

              <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="line-clamp-1">{date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="line-clamp-1">{location}</span>
                </div>

                {attendees && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{attendees} attending</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              {price && (
                <span className="text-lg font-bold text-accent-foreground">{price}</span>
              )}
              <Button variant="accent" size="sm" className="ml-auto">
                View Details
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
};

// Template 3: Minimalist Banner
const MinimalistBannerTemplate = ({ organizerSlug, eventSlug, title, date, location, imageSrc, category, attendees, price, handleImageError }) => {
  return (
    <Link to={`/events/${organizerSlug}/${eventSlug}`} target="_blank" rel="noopener noreferrer">
      <Card className="group overflow-hidden border-border hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
        <div className="relative overflow-hidden aspect-[16/9]">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm mb-2 text-xs">
                  {category}
                </Badge>
                <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-accent-foreground transition-colors text-foreground">
                  {title}
                </h3>
              </div>
              {price && (
                <span className="text-2xl font-bold text-accent-foreground flex-shrink-0">{price}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="line-clamp-1">{location}</span>
              </div>
              {attendees && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{attendees} attending</span>
                </div>
              )}
            </div>

            <Button variant="accent" size="sm" className="w-full">
              View Details
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};

const EventCard = ({
  id,
  organizerSlug,
  eventSlug,
  title,
  date,
  location,
  image,
  category,
  attendees,
  price,
  template = "template1", // Default to template1
}) => {
  const [imageSrc, setImageSrc] = useState(image || eventFallback);
  const handleImageError = () => {
    if (imageSrc !== eventFallback) {
      setImageSrc(eventFallback);
    }
  };

  const props = {
    organizerSlug,
    eventSlug,
    title,
    date,
    location,
    imageSrc,
    category,
    attendees,
    price,
    handleImageError,
  };

  // Render based on selected template
  switch (template) {
    case "template2":
      return <ModernHorizontalTemplate {...props} />;
    case "template3":
      return <MinimalistBannerTemplate {...props} />;
    case "template1":
    default:
      return <ClassicCardTemplate {...props} />;
  }
};

export default EventCard;
