import { Loader2 } from "lucide-react";

const LoadingOverlay = ({ message = "Loading...", show = false }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[300px]">
        <Loader2 className="h-16 w-16 animate-spin text-accent-foreground" />
        <p className="text-lg font-semibold text-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;






