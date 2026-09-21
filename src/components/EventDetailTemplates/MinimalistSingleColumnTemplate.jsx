import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Loader2, Clock, Mail, Ticket, ArrowRight } from "lucide-react";
import EventGallery from "@/components/event-detail/EventGallery";
import EventSchedule from "@/components/event-detail/EventSchedule";
import TicketSection from "@/components/event-detail/TicketSection";
import EventLocation from "@/components/event-detail/EventLocation";
import OrganizerInfo from "@/components/event-detail/OrganizerInfo";

const MinimalistSingleColumnTemplate = ({
  eventTitle,
  eventDate,
  eventTime,
  eventImage,
  eventLocation,
  eventVenue,
  eventAddress,
  eventDescription,
  event,
  galleryImages,
  eventGallery,
  ticketDisplayList,
  priceRange,
  hasTicketData,
  bookingTicketsLoading,
  hasPurchasableTickets,
  scrollToTickets,
  scrollToLocation,
  handleBulkModalChange,
}) => {
  return (
    <main className="flex-1 bg-muted/20">
        {/* Minimalist Hero */}
        <div className="bg-background border-b border-border">
          <div className="container py-12">
            <div className="max-w-4xl mx-auto">
              <Badge variant="outline" className="mb-4">
                {event.category || event.mainCategory || "Event"}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {eventTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{eventDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{eventTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{eventLocation}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Image - Full Width */}
        <div className="w-full">
          <img 
            src={eventImage} 
            alt={eventTitle}
            className="w-full h-auto max-h-[60vh] object-cover"
          />
        </div>

        {/* Single Column Content */}
        <div className="container max-w-4xl mx-auto py-16 space-y-16">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="px-8 bg-gradient-to-r from-primary to-accent"
              onClick={() => handleBulkModalChange(true)}
              disabled={!hasPurchasableTickets && !bookingTicketsLoading}
            >
              {bookingTicketsLoading && !hasPurchasableTickets ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                <>
                  <Ticket className="w-4 h-4 mr-2" />
                  Book Tickets
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={scrollToLocation}>
              <MapPin className="w-4 h-4 mr-2" />
              View Location
            </Button>
          </div>

          {/* Description */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">About this Event</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {eventDescription}
              </p>
            </div>
          </section>

          {/* Event Details Grid */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Event Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Calendar className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                      <p className="font-semibold">{eventDate}</p>
                      <p className="text-sm text-muted-foreground">{eventTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <MapPin className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p className="font-semibold">{eventVenue}</p>
                      <p className="text-sm text-muted-foreground">{eventAddress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {event.email && event.email !== "N/A" && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Mail className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Contact</p>
                        <p className="font-semibold">{event.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {priceRange && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Ticket className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Price Range</p>
                        <p className="font-semibold">{priceRange}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* Gallery */}
          {eventGallery && eventGallery.length > 0 && galleryImages.length > 1 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Gallery</h2>
              <EventGallery images={galleryImages} />
            </section>
          )}

          {/* Schedule */}
          {event.schedule && event.schedule.length > 0 && (
            <section>
              <EventSchedule schedule={event.schedule} highlights={event.highlights || []} />
            </section>
          )}

          {/* Tickets */}
          {ticketDisplayList.length > 0 && (
            <section id="tickets-section">
              <h2 className="text-2xl font-bold mb-6">Get Your Tickets</h2>
              <TicketSection tickets={ticketDisplayList} />
            </section>
          )}

          {/* Location */}
          <section id="location-section">
            <h2 className="text-2xl font-bold mb-6">Location</h2>
            <EventLocation 
              venue={eventVenue} 
              address={eventAddress} 
              phone={event.phone || event.venueContact || "N/A"} 
            />
          </section>

          {/* Artists */}
          {event.artists && event.artists.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Artists & Performers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.artists.map((artist, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {artist.photo && (
                          <img
                            src={artist.photo}
                            alt={artist.name}
                            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-2">{artist.name || "Artist"}</h3>
                          <div className="space-y-2">
                            {artist.instagram && (
                              <a
                                href={artist.instagram.startsWith('http') ? artist.instagram : `https://instagram.com/${artist.instagram.replace(/^@/, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-accent-foreground hover:underline flex items-center gap-1"
                              >
                                <span>📷</span>
                                <span>{artist.instagram}</span>
                                <ArrowRight className="w-3 h-3" />
                              </a>
                            )}
                            {artist.spotify && (
                              <a
                                href={artist.spotify.startsWith('http') ? artist.spotify : `https://open.spotify.com/${artist.spotify}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-accent-foreground hover:underline flex items-center gap-1"
                              >
                                <span>🎵</span>
                                <span>Spotify</span>
                                <ArrowRight className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Advisory */}
          {event.advisory && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Event Advisory</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {event.advisory.smokingAllowed && <p className="text-sm">🚬 Smoking allowed</p>}
                    {event.advisory.drinkingAllowed && <p className="text-sm">🍺 Drinking allowed</p>}
                    {event.advisory.petsAllowed && <p className="text-sm">🐾 Pets allowed</p>}
                    {event.advisory.ageRestricted && <p className="text-sm">🔞 Show is 18+</p>}
                    {event.advisory.camerasAllowed && <p className="text-sm">📸 Cameras allowed</p>}
                    {event.advisory.outsideFoodAllowed && <p className="text-sm">🍔 Outside food allowed</p>}
                    {event.advisory.seatingProvided && <p className="text-sm">🪑 Seating provided</p>}
                    {event.advisory.wheelchairAccessible && <p className="text-sm">♿ Wheelchair accessible</p>}
                    {event.advisory.liveMusic && <p className="text-sm">🎵 Live music</p>}
                    {event.advisory.parkingAvailable && <p className="text-sm">🚗 Parking available</p>}
                    {event.advisory.reentryAllowed && <p className="text-sm">🔁 Re-entry allowed</p>}
                    {event.advisory.onsitePayments && <p className="text-sm">💳 On-site payments</p>}
                    {event.advisory.securityCheck && <p className="text-sm">👮 Security check</p>}
                    {event.advisory.cloakroom && <p className="text-sm">🧥 Cloakroom available</p>}
                    {event.advisory.other && event.advisory.customAdvisory && (
                      <p className="col-span-full text-sm">📝 {event.advisory.customAdvisory}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Custom Questions */}
          {event.customQuestions && event.customQuestions.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Event Information</h2>
              <div className="space-y-4">
                {event.customQuestions.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <p className="font-medium mb-2">Q: {item.question}</p>
                      {item.answer && <p className="text-muted-foreground">A: {item.answer}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Terms & Conditions */}
          {event.termsAndConditions && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Terms & Conditions</h2>
              <Card>
                <CardContent className="p-6">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.termsAndConditions }}
                  />
                </CardContent>
              </Card>
            </section>
          )}

          {/* Organizer Info */}
          <section>
            <OrganizerInfo
              name={event.organizer?.name || event.organizerName || "Event Organizer"}
              bio={event.organizer?.bio || event.organizerNote || "Professional event organizer"}
              organizerId={event.organizer?.organizerId || event.organizerId || event.userId || "1"}
            />
          </section>
        </div>
    </main>
  );
};

export default MinimalistSingleColumnTemplate;

