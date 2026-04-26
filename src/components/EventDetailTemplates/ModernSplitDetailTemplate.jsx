import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Image as ImageIcon, MapPin, Share2, Star, Users } from "lucide-react";

const ModernSplitDetailTemplate = ({
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
  const visibleGallery = galleryImages.filter((image) => image && image !== event.image).slice(0, 5);

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090b0f]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">MapMyParty</p>
            <p className="text-sm font-semibold text-white">Event Experience</p>
          </div>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <img src={event.image} alt={event.title} className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#090b0f_0%,rgba(9,11,15,0.88)_36%,rgba(9,11,15,0.36)_100%)]" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-end gap-10 px-5 pb-12 pt-24 lg:grid-cols-[1.15fr,0.85fr] lg:px-10">
          <div className="max-w-3xl space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              {event.category && <Badge className="rounded-full bg-white text-[#111827] hover:bg-white">{event.category}</Badge>}
              {event.subCategory && <Badge variant="outline" className="rounded-full border-white/25 text-white">{event.subCategory}</Badge>}
            </div>

            <div className="space-y-5">
              <h1 className="max-w-[12ch] text-5xl font-black leading-[0.95] text-white md:text-7xl lg:text-8xl">
                {event.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                {event.about}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/15 bg-white/[0.08] p-4 backdrop-blur">
                <Calendar className="mb-3 h-5 w-5 text-[#f97316]" />
                <p className="text-sm font-semibold">{formatDate(event.startDate)}</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/[0.08] p-4 backdrop-blur">
                <Clock className="mb-3 h-5 w-5 text-[#f97316]" />
                <p className="text-sm font-semibold">{formatTime(event.startDate)}</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/[0.08] p-4 backdrop-blur">
                <MapPin className="mb-3 h-5 w-5 text-[#f97316]" />
                <p className="line-clamp-2 text-sm font-semibold">{event.venue}</p>
              </div>
            </div>
          </div>

          <aside className="lg:pb-4">
            {renderTicketPanel("glass")}
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[0.85fr,1.15fr] lg:px-10">
        <div className="space-y-8">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-2xl font-bold">Venue</h2>
            <p className="text-lg font-semibold">{event.venue}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{event.address}</p>
          </div>

          {event.advisoryItems?.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <h2 className="mb-4 text-2xl font-bold">Event Guide</h2>
              <div className="flex flex-wrap gap-2">
                {event.advisoryItems.map((item, index) => (
                  <span key={`${item}-${index}`} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-white/72">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {primarySponsor && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <p className="mb-4 text-xs uppercase tracking-[0.18em] text-white/45">Presenting Partner</p>
              <div className="flex items-center gap-4">
                <img src={primarySponsor.logo} alt={primarySponsor.name} className="h-16 w-16 rounded-lg bg-white object-contain p-2" />
                <div>
                  <p className="font-bold">{primarySponsor.name}</p>
                  {primarySponsor.website && (
                    <a href={primarySponsor.website} className="text-sm text-[#f97316]" target="_blank" rel="noreferrer">
                      Visit website
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-bold">Gallery</h2>
              <span className="flex items-center gap-2 text-sm text-white/50">
                <ImageIcon className="h-4 w-4" />
                {galleryImages.length} photos
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[event.image, ...visibleGallery].slice(0, 6).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => onOpenImage(image)}
                  className={`overflow-hidden rounded-lg border border-white/10 bg-white/5 ${index === 0 ? "col-span-2 row-span-2" : ""}`}
                >
                  <img src={image} alt={`${event.title} gallery ${index + 1}`} className="h-full min-h-36 w-full object-cover transition duration-300 hover:scale-105" />
                </button>
              ))}
            </div>
          </div>

          {Array.isArray(event.artists) && event.artists.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
                <Star className="h-5 w-5 text-[#f97316]" />
                Artists
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {event.artists.map((artist) => (
                  <div key={artist.id || artist.name} className="flex items-center gap-3 rounded-lg bg-white/[0.04] p-3">
                    <img src={artist.image || event.image} alt={artist.name} className="h-12 w-12 rounded-full object-cover" />
                    <p className="font-semibold">{artist.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {secondarySponsors.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
                <Users className="h-5 w-5 text-[#f97316]" />
                Sponsors
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {secondarySponsors.map((sponsor) => (
                  <div key={sponsor.id || sponsor.name} className="rounded-lg bg-white/[0.04] p-4 text-center">
                    <img src={sponsor.logo} alt={sponsor.name} className="mx-auto h-12 w-12 object-contain" />
                    <p className="mt-3 text-sm font-semibold">{sponsor.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderFaqTcBlock()}
        </div>
      </section>
    </main>
  );
};

export default ModernSplitDetailTemplate;
