import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import "@/styles/venue-management.css";
export default function VenueDatePicker({ value, onChange, label = "Choose date", disabledDays }) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><button type="button" aria-label={label} className="venue-date-trigger"><CalendarDays aria-hidden="true" size={16} /><span>{selected ? format(selected, "dd MMM yyyy") : label}</span></button></PopoverTrigger>
    <PopoverContent align="start" className="venue-calendar w-auto p-3 rounded-xl bg-card border-border shadow-xl">
      <DayPicker disabled={disabledDays} mode="single" selected={selected} defaultMonth={selected} onSelect={(day) => { onChange(day ? format(day, "yyyy-MM-dd") : ""); setOpen(false); }} showOutsideDays classNames={{ months:"venue-calendar-months", caption:"venue-calendar-caption", caption_label:"venue-calendar-title", nav:"venue-calendar-nav", nav_button:"venue-calendar-nav-button", table:"venue-calendar-table", head_cell:"venue-calendar-weekday", cell:"venue-calendar-cell", day:"venue-calendar-day", day_selected:"venue-calendar-selected", day_today:"venue-calendar-today", day_outside:"venue-calendar-outside" }} />
      <button type="button" className="mt-2 w-full rounded-lg py-2 text-xs text-muted-foreground hover:bg-muted" onClick={() => { onChange(""); setOpen(false); }}>Clear date</button>
    </PopoverContent>
  </Popover>;
}
