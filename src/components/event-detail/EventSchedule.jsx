 import { Clock, CheckCircle2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const EventSchedule = ({ schedule, highlights }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Highlights Section */}
      {highlights && highlights.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            Event Highlights
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg border border-border/60 bg-muted/55 transition-all group hover-scale"
              >
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-muted-foreground">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Timeline */}
      {schedule && schedule.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            Event Schedule
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            {schedule.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline group">
                  <div className="flex items-center gap-4 text-left w-full">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-primary text-lg">{item.time}</p>
                      <p className="font-semibold mt-1">{item.activity}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                {item.description && (
                  <AccordionContent className="px-6 pb-4">
                    <div className="pl-16 text-muted-foreground">
                      {item.description}
                    </div>
                  </AccordionContent>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default EventSchedule;
