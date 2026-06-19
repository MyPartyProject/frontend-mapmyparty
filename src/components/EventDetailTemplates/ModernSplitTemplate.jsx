import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Loader2, Clock, Mail, Ticket } from "lucide-react";
import EventGallery from "@/components/event-detail/EventGallery";
import EventSchedule from "@/components/event-detail/EventSchedule";
import TicketSection from "@/components/event-detail/TicketSection";
import EventLocation from "@/components/event-detail/EventLocation";
import OrganizerInfo from "@/components/event-detail/OrganizerInfo";

const ModernSplitTemplate = ({
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
    <main className="flex-1 bg-background">
        {/* Hero Section with Overlay */}
        <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
          <img 
            src={eventImage} 
            alt={eventTitle}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/72" />
          
          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="container pb-12 relative z-10">
              <div className="max-w-3xl">
                <Badge variant="secondary" className="mb-4 text-sm">
                  {event.category || event.mainCategory || "Event"}
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
                  {eventTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-lg text-muted-foreground mb-8">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{eventDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{eventTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{eventLocation}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="px-8 py-6 text-base font-semibold"
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
                        <Ticket className="w-5 h-5 mr-2" />
                        Book Tickets Now
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="lg" onClick={scrollToLocation}>
                    <MapPin className="w-4 h-4 mr-2" />
                    View Location
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Split Layout: Main Content + Sidebar */}
        <div className="container py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              <section>
                <h2 className="text-3xl font-bold mb-6 text-primary">About this Event</h2>
                <Card className="border-2">
                  <CardContent className="p-8">
                    <div className="prose prose-lg max-w-none">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {eventDescription}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Gallery */}
              {eventGallery && eventGallery.length > 0 && galleryImages.length > 1 && (
                <section>
                  <h2 className="text-3xl font-bold mb-6 text-primary">Gallery</h2>
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
                  <h2 className="text-3xl font-bold mb-6 text-primary">Get Your Tickets</h2>
                  <TicketSection tickets={ticketDisplayList} />
                </section>
              )}

              {/* Artists */}
              {event.artists && event.artists.length > 0 && (
                <section>
                  <h2 className="text-3xl font-bold mb-6 text-primary">Artists & Performers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.artists.map((artist, index) => (
                      <Card key={index} className="hover:shadow-lg transition-shadow">
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
                              <div className="flex flex-col gap-2">
                                {artist.instagram && (
                                  <a
                                    href={artist.instagram.startsWith('http') ? artist.instagram : `https://instagram.com/${artist.instagram.replace(/^@/, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                  >
                                    <span>📷</span>
                                    <span className="truncate">{artist.instagram}</span>
                                  </a>
                                )}
                                {artist.spotify && (
                                  <a
                                    href={artist.spotify.startsWith('http') ? artist.spotify : `https://open.spotify.com/${artist.spotify}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                  >
                                    <span>🎵</span>
                                    <span>Spotify</span>
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
                  <h2 className="text-3xl font-bold mb-6 text-primary">Event Advisory</h2>
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  <h2 className="text-3xl font-bold mb-6 text-primary">Event Information</h2>
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
                  <h2 className="text-3xl font-bold mb-6 text-primary">Terms & Conditions</h2>
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
            </div>

            {/* Sidebar - 1 column */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Event Details Card */}
                <Card className="border-2 border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl mb-6 text-primary">Event Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{eventDate}</p>
                          <p className="text-sm text-muted-foreground">{eventTime}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{eventVenue}</p>
                          <p className="text-sm text-muted-foreground">{eventAddress}</p>
                        </div>
                      </div>
                      {event.email && event.email !== "N/A" && (
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Contact</p>
                            <p className="text-sm text-muted-foreground">{event.email}</p>
                          </div>
                        </div>
                      )}
                      {priceRange && (
                        <div className="flex items-start gap-3">
                          <Ticket className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Price Range</p>
                            <p className="text-sm text-muted-foreground">{priceRange}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Location Card */}
                <div id="location-section">
                  <EventLocation 
                    venue={eventVenue} 
                    address={eventAddress} 
                    phone={event.phone || event.venueContact || "N/A"} 
                  />
                </div>

                {/* Organizer Info */}
                <OrganizerInfo
                  name={event.organizer?.name || event.organizerName || "Event Organizer"}
                  bio={event.organizer?.bio || event.organizerNote || "Professional event organizer"}
                  organizerId={event.organizer?.organizerId || event.organizerId || event.userId || "1"}
                />
              </div>
            </aside>
          </div>
        </div>
    </main>
  );
};

export default ModernSplitTemplate;

