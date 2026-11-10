import { useEffect, useMemo, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';

export default function MobileGalleryViewer({ images, selectedImage, onSelect }) {
  const [api, setApi] = useState(null);
  const [startIndex] = useState(() => Math.max(0, images.indexOf(selectedImage)));
  const [index, setIndex] = useState(startIndex);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const options = useMemo(() => ({
    startIndex, loop: images.length > 1, watchDrag: images.length > 1,
    duration: reducedMotion ? 0 : 25,
  }), [startIndex, images.length, reducedMotion]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!api) return;
    const update = () => {
      const current = api.selectedScrollSnap();
      setIndex(current);
      onSelect(images[current]);
    };
    update();
    api.on('select', update);
    return () => { api.off('select', update); };
  }, [api, images, onSelect]);

  return (
    <Carousel opts={options} setApi={setApi} aria-label="Event gallery"
      className="w-full min-w-0" onClick={event => event.stopPropagation()}>
      <CarouselContent className="ml-0 [touch-action:pan-y_pinch-zoom]">
        {images.map((image, position) => (
          <CarouselItem key={`${image}-${position}`} className="flex h-[calc(100dvh-8rem)] items-center justify-center pl-0" aria-label={`Image ${position + 1} of ${images.length}`}>
            <img src={image} alt={`Gallery ${position + 1}`} draggable={false}
              className="max-h-full max-w-full select-none rounded-xl object-contain" />
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && <>
        <CarouselPrevious aria-label="Previous image" className="left-0 z-10 h-11 w-11 border-white/30 bg-black/60 text-white hover:bg-black/80 hover:text-white" />
        <CarouselNext aria-label="Next image" className="right-0 z-10 h-11 w-11 border-white/30 bg-black/60 text-white hover:bg-black/80 hover:text-white" />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs tabular-nums text-white" aria-live="polite">
          {index + 1} / {images.length}
        </div>
      </>}
    </Carousel>
  );
}
