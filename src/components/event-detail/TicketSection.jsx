import { Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return INR_FORMATTER.format(0);
  }
  return INR_FORMATTER.format(numericValue);
};

const TicketSection = ({ tickets = [] }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-foreground">
        Get Your Tickets
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((ticket, index) => (
          <Card
            key={ticket.id}
            className={`group hover:shadow-elegant transition-all hover-scale ${
              ticket.soldOut ? "opacity-60" : ""
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-lg border border-border/60 bg-muted/60 group-hover:scale-110 transition-transform">
                  <Ticket className="w-6 h-6 text-primary" />
                </div>
                {ticket.comingSoon ? (
                  <Badge variant="outline" className="border-dashed text-muted-foreground">
                    Coming Soon
                  </Badge>
                ) : ticket.soldOut ? (
                  <Badge variant="secondary">Sold Out</Badge>
                ) : (
                  <Badge variant="default" className="bg-primary/10 text-primary">
                    {Number.isFinite(ticket.available) && ticket.available !== null
                      ? ticket.available
                      : ticket.raw?.availableQty ??
                        ticket.raw?.availableQuantity ??
                        ticket.raw?.quantityAvailable ??
                        ticket.raw?.remainingQty ??
                        ticket.raw?.remainingQuantity ??
                        "—"}{" "}
                    left
                  </Badge>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xl font-bold mb-2">{ticket.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {ticket.description}
                </p>
                <div className="text-3xl font-bold text-primary">{formatCurrency(ticket.price)}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {ticket.maxPerOrder
                    ? `Maximum ${ticket.maxPerOrder} per order`
                    : "Unlimited per order"}
                </p>
              </div>
              <div className="pt-2 text-sm text-muted-foreground">
                <p>Tickets booked through the main booking flow.</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TicketSection;
