 import { useState, useEffect } from "react";
import { Calendar, MapPin, Share2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate, useParams } from "react-router-dom";

const EventHero = ({ title, date, location, image, onLocationClick }) => {
  const { organizerSlug, eventSlug } = useParams();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shareUrl = window.location.href;
  const shareText = `Check out ${title}!`;

  const socialLinks = [
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: "hover:bg-blue-500",
      icon: "f",
    },
    {
      name: "X",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      color: "hover:bg-gray-800",
      icon: "𝕏",
    },
    {
      name: "Instagram",
      url: "#",
      color: "hover:bg-primaryCTA-hover",
      icon: "IG",
    },
    {
      name: "Reddit",
      url: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
      color: "hover:bg-orange-500",
      icon: "r",
    },
    {
      name: "Pinterest",
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`,
      color: "hover:bg-red-500",
      icon: "P",
    },
  ];

  return (
    <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
      {/* Parallax Image */}
      <div
        className="absolute inset-0 transition-transform duration-100"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover scale-110"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Content */}
      <div className="relative h-full container flex flex-col justify-end pb-16 pt-32">
        <div className="space-y-6 animate-fade-in">
          <div className="inline-block">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
              {title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-6 text-white/90 text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              <span>{date}</span>
            </div>
            <button
              onClick={onLocationClick}
              className="flex items-center gap-2 hover:text-accent transition-colors cursor-pointer"
            >
              <MapPin className="w-6 h-6" />
              <span className="underline decoration-dotted">{location}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="secondary"
              size="lg"
              className="bg-background/95 hover:bg-muted text-foreground border-border hover-scale"
              onClick={() => navigate(`/events/${organizerSlug}/${eventSlug}/overview`)}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Overview
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-background/95 hover:bg-muted text-foreground border-border hover-scale"
                >
<Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold mb-3">Share on social media</p>
                  <div className="flex gap-2">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center transition-all hover:scale-110 text-white font-bold ${social.color}`}
                        aria-label={`Share on ${social.name}`}
                        onClick={(e) => {
                          if (social.name === "Instagram") {
                            e.preventDefault();
                            alert("Instagram sharing is available through the Instagram app");
                          }
                        }}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Direct Social Icons */}
            <div className="hidden md:flex gap-2">
              {socialLinks.slice(0, 3).map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background/95 border border-border flex items-center justify-center transition-all hover:scale-110 hover:bg-muted text-foreground font-semibold"
                  aria-label={`Share on ${social.name}`}
                  onClick={(e) => {
                    if (social.name === "Instagram") {
                      e.preventDefault();
                      alert("Instagram sharing is available through the Instagram app");
                    }
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventHero;
