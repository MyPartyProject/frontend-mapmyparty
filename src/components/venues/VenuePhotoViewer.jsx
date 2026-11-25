import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

export default function VenuePhotoViewer({ photos, venueName, startIndex, returnFocusRef, gallery = false, onClose }) {
  const [api, setApi] = useState(null);
  const [index, setIndex] = useState(startIndex);
  useEffect(() => {
    if (!api) return;
    const update = () => setIndex(api.selectedScrollSnap());
    api.on("select", update);
    return () => { api.off("select", update); };
  }, [api]);
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className={gallery ? "venue-page venue-photo-viewer venue-gallery-lightbox h-[100dvh] w-full max-w-none gap-0 overflow-hidden border-0 bg-transparent p-0 text-white shadow-none backdrop-blur-none motion-reduce:!animate-none" : "venue-page venue-photo-viewer w-full max-w-none sm:w-[calc(100%-3rem)] sm:max-w-5xl gap-0 p-0 overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border bg-transparent sm:bg-card shadow-none sm:shadow-2xl backdrop-blur-none motion-reduce:!animate-none"}
        onCloseAutoFocus={returnFocusRef ? (event) => {
          event.preventDefault();
          returnFocusRef.current?.focus({ preventScroll: true });
        } : undefined}
        overlayClassName={gallery ? "bg-black/90 backdrop-blur-md" : "bg-black/95 backdrop-blur-sm"}
        onKeyDown={(event) => {
          if (event.defaultPrevented) return;
          if (event.key === "ArrowLeft") { event.preventDefault(); api?.scrollPrev(); }
          if (event.key === "ArrowRight") { event.preventDefault(); api?.scrollNext(); }
        }}
      >
        <DialogTitle className={gallery ? "sr-only" : "sr-only sm:not-sr-only sm:px-6 sm:py-5 sm:pr-16 sm:text-base"}>{venueName} · Photos</DialogTitle>
        <DialogDescription className="sr-only">Swipe left or right to browse venue photos. Use Escape or the close button to exit.</DialogDescription>
        <Carousel
          aria-label={`${venueName} photos`}
          setApi={setApi}
          opts={{
            startIndex,
            loop: photos.length > 1,
            duration: 32,
            watchDrag: gallery && photos.length > 1,
            breakpoints: {
              "(max-width: 639px)": { watchDrag: photos.length > 1 },
              "(prefers-reduced-motion: reduce)": { duration: 0 },
            },
          }}
          className="min-w-0 w-full"
        >
          <CarouselContent className="ml-0 touch-pan-y motion-safe:will-change-transform">
            {photos.map((photo, photoIndex) => (
              <CarouselItem key={photo.id} onClick={(event) => { if (gallery && event.target === event.currentTarget) onClose(); }} className={gallery ? "pl-0 flex h-[100dvh] items-center justify-center px-3 py-16 sm:px-16" : "pl-0 flex h-[100dvh] sm:h-[75dvh] items-center justify-center"} aria-label={`Photo ${photoIndex + 1} of ${photos.length}`}>
                <img
                  src={photo.url}
                  alt={`${venueName} photo ${photoIndex + 1}`}
                  draggable={false}
                  decoding="async"
                  className={`max-h-full max-w-full object-contain select-none motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out ${photoIndex === index ? "opacity-100" : "motion-safe:opacity-85"}`}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {photos.length > 1 && <>
            <CarouselPrevious className="inline-flex left-4 h-11 w-11 bg-black/60 border-white/25 text-white hover:bg-black/80 hover:text-white" />
            <CarouselNext className="inline-flex right-4 h-11 w-11 bg-black/60 border-white/25 text-white hover:bg-black/80 hover:text-white" />
          </>}
        </Carousel>
        <p className={gallery ? "pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-white tabular-nums" : "hidden sm:block py-3 text-center text-xs text-muted-foreground tabular-nums"} aria-live="polite">{gallery ? String(index + 1).padStart(2, "0") : index + 1} / {gallery ? String(photos.length).padStart(2, "0") : photos.length}</p>
      </DialogContent>
    </Dialog>
  );
}
