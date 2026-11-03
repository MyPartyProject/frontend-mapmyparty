import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  FLYER_ASPECT_RATIO,
  FLYER_STANDARD_HEIGHT,
  FLYER_STANDARD_WIDTH,
} from "@/utils/flyerImageCrop";

const FlyerCropDialog = ({
  open,
  imageSrc,
  imageName,
  imageDimensions,
  processing = false,
  onCancel,
  onConfirm,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [imageSrc, open]);

  const handleCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen && !processing) {
      onCancel?.();
    }
  };

  const handleConfirm = () => {
    if (!croppedAreaPixels || processing) return;
    onConfirm?.(croppedAreaPixels);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88dvh] w-[calc(100%-2rem)] max-w-2xl gap-3 overflow-y-auto border-border/60 bg-[#101010] p-4 text-foreground sm:rounded-2xl sm:p-5 light:border-border light:bg-background">
        <div className="flex flex-wrap items-start justify-between gap-4 pr-4">
          <DialogHeader className="text-left">
            <DialogTitle>Crop event flyer</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Output will be saved as {FLYER_STANDARD_WIDTH}x{FLYER_STANDARD_HEIGHT}.
            </DialogDescription>
          </DialogHeader>
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={processing || !croppedAreaPixels}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing
                </>
              ) : (
                "Crop and upload"
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="max-w-full truncate">{imageName || "Selected image"}</span>
            {imageDimensions?.width && imageDimensions?.height && (
              <span>
                Original: {imageDimensions.width}x{imageDimensions.height}
              </span>
            )}
          </div>

          <div className="relative h-[min(200px,35dvh)] overflow-hidden rounded-xl border border-border/60 bg-black sm:h-[min(300px,40dvh)]">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={FLYER_ASPECT_RATIO}
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
                showGrid={false}
                restrictPosition
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">Zoom</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-2 border-border/60"
                onClick={handleReset}
                disabled={processing}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={(value) => setZoom(value[0] || 1)}
              disabled={processing}
            />
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default FlyerCropDialog;
