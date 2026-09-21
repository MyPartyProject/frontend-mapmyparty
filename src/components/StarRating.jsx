import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const StarRating = ({ rating, onRatingChange, readonly = false, size = "default" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readonly) {
      // Optional: Add hover effect
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          disabled={readonly}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
            sizeClasses[size]
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= rating
                ? "fill-yellow-400 text-warning"
                : "fill-transparent text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;

