import { Link } from "react-router-dom";
import logo from "../assets/MMP logo.svg";

const refundStatuses = [
  "REQUESTED",
  "APPROVED",
  "DECLINED",
  "PROCESSED",
  "FAILED",
];

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/70">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="MapMyParty" className="h-10 w-auto" />
            <span className="text-2xl font-semibold">MapMyParty</span>
          </Link>
        </div>
      </header>

      <div className="h-12" />

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold mb-3">Refund Policy</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            This Refund Policy explains how cancellations, refund eligibility, processing responsibilities,
            and refund tracking currently work on MapMyParty.
          </p>
        </div>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section className="pt-6 border-t border-border/70">
            <h2 className="text-lg font-semibold text-foreground mb-4">1. Event Cancellation Refunds</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Refunds are primarily initiated when an event is cancelled by the admin or promoter.</li>
              <li>Successful paid bookings are marked as <span className="text-white font-medium">REFUNDED</span> and corresponding refund records are created.</li>
            </ul>
          </section>

          <section className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">2. Organizer Refund Restrictions</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Organizers cannot directly process refunds.</li>
              <li>Organizers may only submit an event cancellation request.</li>
              <li>Refund initiation and processing are handled by the admin or promoter.</li>
            </ul>
          </section>

          <section className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">3. Completed Event Restriction</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Completed events cannot be cancelled.</li>
              <li>Refunds through event cancellation are blocked once an event is completed.</li>
            </ul>
          </section>

          <section className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">4. Eligible Refund Conditions</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Only confirmed bookings with successful payments qualify for refunds during event cancellation.</li>
              <li>Bookings without successful payment are cancelled instead of refunded.</li>
            </ul>
          </section>

          <section className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">5. Ticket Inventory Handling</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Refunded or cancelled bookings should release ticket inventory back into availability.</li>
              <li>Sold ticket quantity is decremented accordingly when tickets are released.</li>
            </ul>
          </section>

          <section className="pt-6 border-t border-border/70">
            <h2 className="text-lg font-semibold text-foreground mb-4">6. Refund Status Types</h2>
            <p className="mb-4 text-muted-foreground">Supported refund statuses:</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {refundStatuses.map((status) => (
                <li
                  key={status}
                  className="rounded-xl border border-border/70 bg-muted/60 px-4 py-3 font-medium text-foreground"
                >
                  {status}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
