import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Image as ImageIcon, MapPin, Share2 } from "lucide-react";

const MinimalFocusDetailTemplate = ({
  event,
  galleryImages,
  primarySponsor,
  secondarySponsors,
  renderTicketPanel,
  renderFaqTcBlock,
  formatDate,
  formatTime,
  onShare,
  onOpenImage,
}) => {
  const visibleGallery = galleryImages.filter(Boolean).slice(0, 6);

  return (
    <main className="min-h-screen bg-[#f7f3eb] text-[#171410]">
      <header className="border-b border-[#171410]/10 bg-[#f7f3eb]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#7a5a35]">MapMyParty</p>
            <p className="text-sm font-semibold">Event Details</p>
          </div>
          <Button variant="outline" className="border-[#171410]/20 bg-transparent hover:bg-[#171410]/5" onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <div className="mb-8 flex flex-wrap gap-2">
          {event.category && <Badge className="rounded-full bg-[#171410] text-white hover:bg-[#171410]">{event.category}</Badge>}
          {event.subCategory && <Badge variant="outline" className="rounded-full border-[#171410]/25 text-[#171410]">{event.subCategory}</Badge>}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr,340px] lg:items-start">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="max-w-4xl text-5xl font-black leading-none md:text-7xl">
                {event.title}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[#4e463c]">
                {event.about}
              </p>
            </div>

            <div className="grid gap-3 border-y border-[#171410]/12 py-5 sm:grid-cols-3">
              <div className="flex gap-3">
                <CalendarDays className="mt-1 h-5 w-5 text-[#b8402a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7a5a35]">Date</p>
                  <p className="font-semibold">{formatDate(event.startDate)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-1 h-5 w-5 text-[#b8402a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7a5a35]">Time</p>
                  <p className="font-semibold">{formatTime(event.startDate)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-1 h-5 w-5 text-[#b8402a]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7a5a35]">Venue</p>
                  <p className="font-semibold">{event.venue}</p>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => onOpenImage(event.image)} className="block w-full overflow-hidden rounded-lg border border-[#171410]/10">
              <img src={event.image} alt={event.title} className="max-h-[620px] w-full object-cover" />
            </button>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Location</h2>
              <div className="rounded-lg border border-[#171410]/12 bg-white/45 p-5">
                <p className="font-semibold">{event.venue}</p>
                <p className="mt-2 text-sm leading-6 text-[#5b5147]">{event.address}</p>
              </div>
            </section>

            {event.advisoryItems?.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold">Event Guide</h2>
                <div className="flex flex-wrap gap-2">
                  {event.advisoryItems.map((item, index) => (
                    <span key={`${item}-${index}`} className="rounded-full border border-[#171410]/12 bg-white/55 px-3 py-1.5 text-sm text-[#4e463c]">
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {visibleGallery.length > 1 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-2xl font-bold">
                  <ImageIcon className="h-5 w-5 text-[#b8402a]" />
                  Gallery
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {visibleGallery.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => onOpenImage(image)}
                      className="aspect-[4/3] overflow-hidden rounded-lg border border-[#171410]/10 bg-white/50"
                    >
                      <img src={image} alt={`${event.title} ${index + 1}`} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {primarySponsor && (
              <section className="rounded-lg border border-[#171410]/12 bg-white/45 p-5">
                <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[#7a5a35]">Presented by</p>
                <div className="flex items-center gap-4">
                  <img src={primarySponsor.logo} alt={primarySponsor.name} className="h-14 w-14 rounded-lg bg-white object-contain p-2" />
                  <div>
                    <p className="font-bold">{primarySponsor.name}</p>
                    {primarySponsor.website && (
                      <a href={primarySponsor.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#b8402a]">
                        Visit website
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}

            {secondarySponsors.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold">Sponsors</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {secondarySponsors.map((sponsor) => (
                    <div key={sponsor.id || sponsor.name} className="rounded-lg border border-[#171410]/12 bg-white/45 p-4 text-center">
                      <img src={sponsor.logo} alt={sponsor.name} className="mx-auto h-10 w-10 object-contain" />
                      <p className="mt-3 text-sm font-semibold">{sponsor.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {renderFaqTcBlock()}
          </div>

          <aside className="lg:sticky lg:top-24">
            {renderTicketPanel("paper")}
          </aside>
        </div>
      </section>
    </main>
  );
};

export default MinimalFocusDetailTemplate;
