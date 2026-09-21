 import { Calendar, MapPin, Mail, Globe, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const EventDescription = ({
  description,
  date,
  time,
  venue,
  address,
  email,
  website,
  priceRange,
}) => {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left Column - Description */}
      <div className="lg:col-span-2 space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold mb-4 text-red-600">
            About this Event
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>
      </div>

      {/* Right Column - Quick Info Card */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24 shadow-xl animate-fade-in border-2 bg-white hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-xl font-bold mb-4 text-black">Event Details</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3 group p-3 rounded-lg hover:bg-gray-50  transition-all duration-300">
                <div className="p-2 rounded-xl bg-secondary text-secondary-foreground group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium text-foreground">{date}</p>
                  <p className="text-sm text-muted-foreground">{time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group p-3 rounded-lg hover:bg-gray-50  transition-all duration-300">
                <div className="p-2 rounded-xl bg-secondary text-secondary-foreground group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{venue}</p>
                  <p className="text-sm text-muted-foreground">{address}</p>
                </div>
              </div>

              {email && (
                <div className="flex items-start gap-3 group p-3 rounded-lg hover:bg-gray-50  transition-all duration-300">
                  <div className="p-2 rounded-xl bg-secondary text-secondary-foreground group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">Contact</p>
                    <a
                      href={`mailto:${email}`}
                      className="font-medium hover:text-red-600 transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                </div>
              )}

              {website && (
                <div className="flex items-start gap-3 group p-3 rounded-lg hover:bg-gray-50  transition-all duration-300">
                  <div className="p-2 rounded-xl bg-secondary text-secondary-foreground group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">Website</p>
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-black transition-colors break-all"
                    >
                      Visit Website
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 group p-3 rounded-lg hover:bg-red-50  transition-all duration-300">
                <div className="p-2 rounded-xl bg-secondary text-secondary-foreground group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Price Range</p>
                  <p className="font-medium text-xl text-red-600">{priceRange}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventDescription;
