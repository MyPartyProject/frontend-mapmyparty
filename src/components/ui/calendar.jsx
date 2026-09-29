 import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "relative w-[280px] md:w-[300px] p-3 bg-[#0b1224]/95 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_18px_90px_rgba(0,0,0,0.65)] text-white overflow-hidden light:bg-card/95 light:border-border light:shadow-[var(--shadow-card)] light:text-foreground",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3 px-2",
        caption: "relative flex items-center justify-center px-6 pt-1 text-white light:text-foreground",
        caption_label: "text-base font-semibold tracking-[0.08em] uppercase whitespace-nowrap",
        nav: "absolute inset-0 flex items-center justify-between px-2 pointer-events-none",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "pointer-events-auto h-8 w-8 bg-white/10 border-white/25 text-white hover:bg-white/20 hover:border-white/40 p-0 rounded-lg transition shadow-sm light:bg-muted light:border-border light:text-foreground light:hover:bg-muted light:hover:border-border"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1 mt-2",
        head_row: "grid grid-cols-7 text-white/80 light:text-muted-foreground",
        head_cell:
          "text-white/70 rounded-md text-center font-semibold text-[0.8rem] uppercase tracking-[0.08em] py-1 light:text-muted-foreground",
        row: "grid grid-cols-7 mt-2 gap-2.5",
        cell: "aspect-square min-h-[48px] text-center text-base p-0 relative rounded-xl overflow-hidden [&:has([aria-selected].day-range-end)]:rounded-r-xl [&:has([aria-selected].day-outside)]:bg-white/5 [&:has([aria-selected])]:bg-gradient-to-br from-[#2563eb]/80 via-[#2b60d6]/70 to-[#e11d48]/80 focus-within:relative focus-within:z-20 border border-transparent hover:border-white/10 transition-all duration-150 light:[&:has([aria-selected].day-outside)]:bg-muted light:[&:has([aria-selected])]:bg-secondary light:hover:border-border light:bg-none",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "w-full h-full p-0 font-semibold text-white/90 hover:bg-white/10 hover:text-white transition aria-selected:opacity-100 flex items-center justify-center light:text-muted-foreground light:hover:bg-muted light:hover:text-foreground"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-gradient-to-br from-[#2563eb] via-[#4759ff] to-[#e11d48] text-white shadow-lg shadow-[#2563eb]/35 hover:brightness-110 ring-2 ring-white/30 light:bg-none light:bg-primaryCTA light:text-inverse light:hover:bg-primaryCTA-hover light:hover:text-inverse light:focus:bg-primaryCTA light:focus:text-inverse light:ring-ring light:shadow-none",
        day_today: "border border-white/40 text-white font-bold light:border-border light:text-foreground",
        day_outside:
          "day-outside text-white/40 opacity-60 aria-selected:bg-white/10 aria-selected:text-white/70 aria-selected:opacity-50 light:text-muted-foreground light:aria-selected:bg-muted light:aria-selected:text-muted-foreground",
        day_disabled: "text-white/25 opacity-30 line-through light:text-muted-foreground",
        day_range_middle:
          "aria-selected:bg-white/10 aria-selected:text-white light:aria-selected:bg-muted light:aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
