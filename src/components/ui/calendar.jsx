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
        "relative w-[280px] md:w-[300px] p-3 bg-card rounded-2xl border border-border shadow-[var(--shadow-elegant)] text-foreground overflow-hidden",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3 px-2",
        caption: "relative flex items-center justify-center px-6 pt-1 text-foreground",
        caption_label: "text-base font-semibold tracking-[0.08em] uppercase whitespace-nowrap",
        nav: "absolute inset-0 flex items-center justify-between px-2 pointer-events-none",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "pointer-events-auto h-8 w-8 bg-muted border-border text-foreground hover:bg-muted/80 hover:border-border p-0 rounded-lg transition shadow-sm"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1 mt-2",
        head_row: "grid grid-cols-7 text-muted-foreground",
        head_cell:
          "text-muted-foreground rounded-md text-center font-semibold text-[0.8rem] uppercase tracking-[0.08em] py-1",
        row: "grid grid-cols-7 mt-2 gap-2",
        cell: "aspect-square min-h-[48px] text-center text-base p-0 relative rounded-xl overflow-hidden [&:has([aria-selected].day-range-end)]:rounded-r-xl [&:has([aria-selected].day-outside)]:bg-muted/55 [&:has([aria-selected])]:bg-primary/8 focus-within:relative focus-within:z-20 border border-transparent hover:border-border transition-all duration-150",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "w-full h-full p-0 font-semibold text-foreground hover:bg-muted hover:text-foreground transition aria-selected:opacity-100 flex items-center justify-center"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primaryCTA-hover ring-2 ring-ring/25",
        day_today: "border border-ring/40 text-foreground font-bold",
        day_outside:
          "day-outside text-muted-foreground opacity-60 aria-selected:bg-muted aria-selected:text-muted-foreground aria-selected:opacity-50",
        day_disabled: "text-muted-foreground opacity-30 line-through",
        day_range_middle:
          "aria-selected:bg-primary/10 aria-selected:text-foreground",
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
