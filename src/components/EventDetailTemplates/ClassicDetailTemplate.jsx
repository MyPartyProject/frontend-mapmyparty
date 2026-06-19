import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import EventDescription from "@/components/event-detail/EventDescription";
import EventOverview from "@/components/event-detail/EventOverview";
import EventGallery from "@/components/event-detail/EventGallery";
import EventSchedule from "@/components/event-detail/EventSchedule";
import TicketSection from "@/components/event-detail/TicketSection";
import EventLocation from "@/components/event-detail/EventLocation";
import OrganizerInfo from "@/components/event-detail/OrganizerInfo";

const ClassicDetailTemplate = ({
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
        {/* Hero Section - Full width starting from top */}
        <div className="w-full">
          <img 
            src={eventImage} 
            alt={eventTitle}
            className="w-full h-auto max-h-[80vh] object-cover"
          />
        </div>
        
        {/* Event Info */}
        <div className="container -mt-16 relative z-10">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-8">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{eventTitle}</h1>
                  <div className="flex items-center text-muted-foreground gap-4 mb-4">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {eventDate}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {eventLocation}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={scrollToTickets} className="bg-primary hover:bg-primary/90">
                      Get Tickets
                    </Button>
                    <Button variant="outline" onClick={scrollToLocation}>
                      <MapPin className="w-4 h-4 mr-2" />
                      View Location
                    </Button>
                  </div>
                </div>
                {(hasTicketData || bookingTicketsLoading) && (
                  <Button
                    size="lg"
                    className="mt-6 md:mt-0 px-8 py-6 text-base font-semibold"
                    onClick={() => handleBulkModalChange(true)}
                    disabled={!hasPurchasableTickets && !bookingTicketsLoading}
                  >
                    {bookingTicketsLoading && !hasPurchasableTickets ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading Tickets...
                      </span>
                    ) : (
                      "Book Tickets"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="container py-16 space-y-24">
          {/* Overview */}
          <EventOverview event={{
            ...event,
            date: eventDate,
            time: eventTime,
            venue: eventVenue,
            address: eventAddress,
            description: eventDescription,
            id: event.id || '',
            organizerName: event.organizer?.name || event.organizerName,
            organizerContact: event.organizer?.email || event.organizerEmail
          }} />

          {/* Description */}
          <EventDescription
            description={eventDescription}
            date={eventDate}
            time={eventTime}
            venue={eventVenue}
            address={eventAddress}
            email={event.email || "N/A"}
            website={event.website || ""}
            priceRange={priceRange}
          />

          {/* Gallery */}
          {eventGallery && eventGallery.length > 0 && galleryImages.length > 1 && (
            <div className="pt-8">
              <EventGallery images={galleryImages} />
            </div>
          )}

          {/* Schedule */}
          {event.schedule && event.schedule.length > 0 && (
            <EventSchedule schedule={event.schedule} highlights={event.highlights || []} />
          )}

          {/* Tickets */}
          {ticketDisplayList.length > 0 && (
            <div id="tickets-section">
              <TicketSection tickets={ticketDisplayList} />
            </div>
          )}

          {/* Location */}
          <div id="location-section">
            <EventLocation 
              venue={eventVenue} 
              address={eventAddress} 
              phone={event.phone || event.venueContact || "N/A"} 
            />
          </div>

          {/* Artists */}
          {event.artists && event.artists.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-3xl font-bold">Artists & Performers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {event.artists.map((artist, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {artist.photo && (
                          <img
                            src={artist.photo}
                            alt={artist.name}
                            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-2">{artist.name || "Artist"}</h3>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {artist.instagram && (
                              <a
                                href={artist.instagram.startsWith('http') ? artist.instagram : `https://instagram.com/${artist.instagram.replace(/^@/, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <span>📷</span>
                                <span>{artist.instagram}</span>
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
            <section className="space-y-6">
              <h2 className="text-3xl font-bold">Event Advisory</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {event.advisory.smokingAllowed && <p>🚬 Smoking allowed</p>}
                    {event.advisory.drinkingAllowed && <p>🍺 Drinking allowed</p>}
                    {event.advisory.petsAllowed && <p>🐾 Pets allowed</p>}
                    {event.advisory.ageRestricted && <p>🔞 Show is 18+</p>}
                    {event.advisory.camerasAllowed && <p>📸 Cameras and photos allowed</p>}
                    {event.advisory.outsideFoodAllowed && <p>🍔 Outside food & drinks allowed</p>}
                    {event.advisory.seatingProvided && <p>🪑 Seating provided</p>}
                    {event.advisory.wheelchairAccessible && <p>♿ Wheelchair accessible venue</p>}
                    {event.advisory.liveMusic && <p>🎵 Live music</p>}
                    {event.advisory.parkingAvailable && <p>🚗 Parking available</p>}
                    {event.advisory.reentryAllowed && <p>🔁 Re-entry allowed</p>}
                    {event.advisory.onsitePayments && <p>💳 On-site payments available</p>}
                    {event.advisory.securityCheck && <p>👮 Security check at entry</p>}
                    {event.advisory.cloakroom && <p>🧥 Cloakroom available</p>}
                    {event.advisory.other && event.advisory.customAdvisory && (
                      <p className="col-span-2">📝 {event.advisory.customAdvisory}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Custom Questions */}
          {event.customQuestions && event.customQuestions.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-3xl font-bold">Event Information</h2>
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
            <section className="space-y-6">
              <h2 className="text-3xl font-bold">Terms & Conditions</h2>
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
          <OrganizerInfo
            name={event.organizer?.name || event.organizerName || "Event Organizer"}
            bio={event.organizer?.bio || event.organizerNote || "Professional event organizer"}
            organizerId={event.organizer?.organizerId || event.organizerId || event.userId || "1"}
          />
        </div>
    </main>
  );
};

export default ClassicDetailTemplate;

