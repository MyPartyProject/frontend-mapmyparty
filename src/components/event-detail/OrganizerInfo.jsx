 import { User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const OrganizerInfo = ({ name, logo, bio, organizerId }) => {
  return (
    <Card className="shadow-elegant animate-fade-in hover-scale transition-all">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Logo/Avatar */}
          <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex-shrink-0">
            {logo ? (
              <img
                src={logo}
                alt={name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-accent-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Organized by</p>
              <h3 className="text-2xl font-bold">{name}</h3>
            </div>

            {bio && <p className="text-muted-foreground">{bio}</p>}

            <Link to={`/organizer/${organizerId || "1"}/events`}>
              <Button variant="outline" className="hover-scale">
                <ExternalLink className="w-4 h-4" />
                View More Events by {name}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizerInfo;
