import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const GalleryModal = ({ images = [], isOpen, currentIndex = 0, onClose, onChangeIndex }) => {
  const totalImages = images.length;
  const safeIndex = totalImages > 0 ? Math.min(Math.max(currentIndex, 0), totalImages - 1) : 0;
  const activeImage = images[safeIndex];

  const showPrevious = () => {
    if (totalImages <= 1) return;
    onChangeIndex((safeIndex - 1 + totalImages) % totalImages);
  };

  const showNext = () => {
    if (totalImages <= 1) return;
    onChangeIndex((safeIndex + 1) % totalImages);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (totalImages > 1) {
          onChangeIndex((safeIndex - 1 + totalImages) % totalImages);
        }
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (totalImages > 1) {
          onChangeIndex((safeIndex + 1) % totalImages);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, safeIndex, totalImages, onClose, onChangeIndex]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || totalImages === 0 || !activeImage) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/90 px-4 py-5 text-white backdrop-blur-md md:px-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Event gallery image preview"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:right-6 md:top-6"
        aria-label="Close gallery preview"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex min-h-0 flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {totalImages > 1 && (
          <button
            type="button"
            onClick={showPrevious}
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition hover:bg-white/15 md:left-2 md:h-14 md:w-14"
            aria-label="Show previous gallery image"
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
          </button>
        )}

        <div className="flex h-full w-full max-w-6xl flex-col items-center justify-center">
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            <img
              src={activeImage}
              alt={`Gallery preview ${safeIndex + 1}`}
              className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            />
          </div>
        </div>

        {totalImages > 1 && (
          <button
            type="button"
            onClick={showNext}
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition hover:bg-white/15 md:right-2 md:h-14 md:w-14"
            aria-label="Show next gallery image"
          >
            <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
          </button>
        )}
      </div>

      {totalImages > 1 && (
        <div
          className="mx-auto mt-4 flex w-full max-w-5xl gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
          style={{
            scrollbarWidth: "thin",
          }}
        >
          {images.map((image, index) => {
            const isActive = index === safeIndex;
            return (
              <button
                key={`${image}-thumbnail-${index}`}
                type="button"
                onClick={() => onChangeIndex(index)}
                className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border transition md:h-20 md:w-32 ${
                  isActive
                    ? "border-red-500 ring-2 ring-red-500/70 ring-offset-2 ring-offset-black"
                    : "border-white/10 opacity-65 hover:opacity-100"
                }`}
                aria-label={`Show gallery image ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
              >
                <img src={image} alt={`Gallery thumbnail ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GalleryModal;
