import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, CameraOff, Loader2, SwitchCamera } from "lucide-react";

const SCAN_COOLDOWN_MS = 3000;

const buildDecodedPreview = (value, maxLength = 160) => {
  if (typeof value !== "string") return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized;
};

const getQrBoxSize = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const short = Math.min(vw, vh);

  // Mobile: ~65% of short edge, Tablet: ~45%, Desktop: clamp to 280px
  if (short < 640) return Math.floor(short * 0.6);
  if (short < 1024) return Math.floor(short * 0.4);
  return 280;
};

const QRScanner = ({ onScan, onClose, isProcessing, isPaused = false }) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const lastScannedRef = useRef({ text: "", time: 0 });
  const isScanBlockedRef = useRef(false);
  const hadBlockedScanRef = useRef(false);
  const [cameraError, setCameraError] = useState("");
  const [isStarting, setIsStarting] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [activeCameraIdx, setActiveCameraIdx] = useState(-1);

  const stableOnScan = useRef(onScan);
  stableOnScan.current = onScan;
  isScanBlockedRef.current = isProcessing || isPaused;

  useEffect(() => {
    const isBlocked = isProcessing || isPaused;
    if (isBlocked) {
      hadBlockedScanRef.current = true;
      return;
    }

    if (hadBlockedScanRef.current) {
      lastScannedRef.current = {
        ...lastScannedRef.current,
        time: Date.now(),
      };
      hadBlockedScanRef.current = false;
    }
  }, [isPaused, isProcessing]);

  const handleDecoded = useCallback((decodedText) => {
    if (isScanBlockedRef.current) {
      return;
    }

    const now = Date.now();
    const last = lastScannedRef.current;

    if (last.text === decodedText && now - last.time < SCAN_COOLDOWN_MS) {
      return;
    }

    lastScannedRef.current = { text: decodedText, time: now };

    console.log("[QRScanner] QR decoded", {
      length: typeof decodedText === "string" ? decodedText.length : 0,
      preview: buildDecodedPreview(decodedText),
    });

    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    stableOnScan.current(decodedText);
  }, []);

  const startWithCamera = useCallback(
    async (cameraIdOrConfig) => {
      const scannerId = "qr-scanner-region";

      // Stop existing instance if running
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      const qrSize = getQrBoxSize();

      await html5QrCode.start(
        cameraIdOrConfig,
        {
          fps: 10,
          qrbox: { width: qrSize, height: qrSize },
        },
        handleDecoded,
        () => {}
      );
    },
    [handleDecoded]
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Enumerate cameras first
        const deviceList = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (!deviceList || deviceList.length === 0) {
          setCameraError("No camera found on this device. Please use manual code entry instead.");
          setIsStarting(false);
          return;
        }

        setCameras(deviceList);

        // Prefer back camera (labels often contain "back", "rear", "environment")
        let preferredIdx = deviceList.findIndex((c) =>
          /back|rear|environment/i.test(c.label)
        );

        // On laptop/desktop with single camera, just use the first one
        if (preferredIdx === -1) preferredIdx = 0;

        setActiveCameraIdx(preferredIdx);
        await startWithCamera(deviceList[preferredIdx].id);

        if (mounted) setIsStarting(false);
      } catch (err) {
        if (!mounted) return;
        setIsStarting(false);

        const msg = err?.message || err?.toString() || "";
        if (msg.includes("NotAllowedError") || err?.name === "NotAllowedError") {
          setCameraError(
            "Camera permission denied. Please allow camera access in your browser settings and try again."
          );
        } else if (msg.includes("NotFoundError") || err?.name === "NotFoundError") {
          setCameraError("No camera found on this device. Please use manual code entry instead.");
        } else if (msg.includes("NotReadableError") || err?.name === "NotReadableError") {
          setCameraError("Camera is already in use by another app. Close it and try again.");
        } else {
          setCameraError(msg || "Failed to start camera. Please use manual code entry.");
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => html5QrCodeRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [startWithCamera]);

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    const nextIdx = (activeCameraIdx + 1) % cameras.length;
    setActiveCameraIdx(nextIdx);
    setIsStarting(true);
    setCameraError("");

    try {
      await startWithCamera(cameras[nextIdx].id);
      setIsStarting(false);
    } catch {
      setIsStarting(false);
      setCameraError("Failed to switch camera. Try again.");
    }
  };

  // On desktop/tablet: centered modal card. On mobile: fullscreen.
  return (
    <div className="fixed inset-0 z-50 bg-black/90 md:bg-black/70 md:backdrop-blur flex items-center justify-center">
      <div className="w-full h-full md:w-[560px] md:h-auto md:max-h-[90vh] lg:w-[600px] bg-black md:bg-[#0a0f1c] md:rounded-2xl md:border md:border-white/10 md:shadow-2xl md:shadow-black/50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/80 md:bg-transparent backdrop-blur md:backdrop-blur-none border-b border-white/10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-300" />
            <span className="text-sm font-semibold text-white">QR Scanner</span>
          </div>
          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="p-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition"
                title="Switch camera"
              >
                <SwitchCamera className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Scanner area */}
        <div className="flex-1 md:flex-none relative flex items-center justify-center min-h-[300px] md:min-h-[380px] md:aspect-square md:max-h-[60vh]">
          {isStarting && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-300" />
              <p className="mt-3 text-sm text-white/70">Starting camera...</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center">
              <CameraOff className="w-12 h-12 text-red-400 mb-3" />
              <p className="text-sm text-red-300 mb-4">{cameraError}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm text-white"
              >
                Use Manual Entry
              </button>
            </div>
          )}

          <div
            id="qr-scanner-region"
            ref={scannerRef}
            className="w-full h-full"
          />

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-300" />
              <p className="mt-3 text-sm text-white/70">Processing check-in...</p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 bg-black/80 md:bg-transparent backdrop-blur md:backdrop-blur-none border-t border-white/10 text-center">
          <p className="text-xs text-white/50">
            Point the camera at the QR code on the ticket
          </p>
          {cameras.length > 1 && (
            <p className="text-[10px] text-white/30 mt-1">
              Camera: {cameras[activeCameraIdx]?.label || `Camera ${activeCameraIdx + 1}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
