import { Link } from "react-router-dom";
import logo from "../assets/MMP logo.svg";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/70">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="MapMyParty" className="h-10 w-auto" />
            <span className="text-2xl font-semibold">MapMyParty</span>
          </Link>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-12" />

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Title Section */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-semibold mb-3">Terms & Conditions</h1>
        </div>

        {/* Content */}
        <div className="space-y-8 text-muted-foreground leading-relaxed text-sm">
          <p className="font-semibold text-foreground">
            IMPORTANT: Clause 12 contains exclusions of warranties and limitations of liability.
          </p>

          {/* Section 1 */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">1. Introduction</h2>
            <p className="mb-3">
              1.1 To use the Service, Users must accept these Terms, which should be read carefully prior to using the Service. These Terms constitute a legally binding agreement between MapMyParty and the User. If the User does not agree to be bound by these Terms, the User must not access or use the Service.
            </p>
          </div>

          {/* Section 2 */}
          <div className="pt-6 border-t border-border/70">
            <h2 className="text-lg font-semibold text-foreground mb-4">2. Definitions</h2>
            <p className="mb-4">In these Terms, unless the context otherwise requires, the following expressions shall have the meanings set out below:</p>
            
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-foreground">Accept:</strong> means either (i) registering to use the Service; or (ii) using the Service, and thereby agreeing to be bound by these Terms.</li>
              <li><strong className="text-foreground">App:</strong> means any mobile application developed and made available by MapMyParty.</li>
              <li><strong className="text-foreground">Content:</strong> means all information, software, text, images, graphics, audio, video or other material available on the Website or through the Service.</li>
              <li><strong className="text-foreground">Customer:</strong> means any User who purchases Tickets, Vouchers, or registers for Events or Offers.</li>
              <li><strong className="text-foreground">Event:</strong> means any event for which Tickets are sold or registrations are accepted through the Service.</li>
              <li><strong className="text-foreground">MapMyParty:</strong> means Bespoke Web Pvt Ltd, a company incorporated under the laws of India.</li>
              <li><strong className="text-foreground">Offer / Voucher:</strong> means a prepaid item exchangeable for goods or services within a defined validity period.</li>
              <li><strong className="text-foreground">Service:</strong> means ticketing, event listings, advertisements, promotions, payment facilitation, and related services provided through the Website, App, or SMS.</li>
              <li><strong className="text-foreground">Ticket:</strong> means a digital or physical entry pass purchased for an Event.</li>
              <li><strong className="text-foreground">User:</strong> means any individual or legal entity using the Service, including Customers, Promoters, Partners, Reps, and Resellers.</li>
              <li><strong className="text-foreground">Website:</strong> means www.mapmyparty.com or any successor domain.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">3. Commencement</h2>
            <p>These Terms take effect from the moment the User accepts them and remain in force unless terminated in accordance with these Terms.</p>
          </div>

          {/* Section 4 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">4. Applicability & Modifications</h2>
            <p className="mb-3">4.1 Use of the Service constitutes acceptance of these Terms.</p>
            <p>4.2 MapMyParty may amend these Terms at any time. Continued use of the Service after publication of updated Terms constitutes acceptance.</p>
          </div>

          {/* Section 5 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">5. Use of the Service</h2>
            
            <p className="mb-3 font-semibold text-white">5.1 General Use</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>The Service is provided on a limited, revocable, non-exclusive basis.</li>
              <li>Users are responsible for maintaining their own equipment and credentials.</li>
              <li>Users must comply with all applicable laws and regulations.</li>
              <li>Passwords must be kept confidential.</li>
              <li>MapMyParty may suspend or terminate access at its sole discretion.</li>
            </ul>

            <p className="mb-3 font-semibold text-white">5.2 Promoters</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Promoters are solely responsible for Event and Offer details.</li>
              <li>MapMyParty does not endorse or verify Events or Offers.</li>
              <li>Promoters must process refunds where applicable.</li>
              <li>Removal or migration of Events after ticket sales may attract penalties up to ₹25,00,000, without prejudice to other remedies.</li>
              <li>Commission, booking fees, taxes, GST, TDS, and TCS apply as per invoicing terms.</li>
              <li>Cashless infrastructure liabilities rest fully with the Event Organiser.</li>
            </ul>

            <p className="mb-3 font-semibold text-white">5.3 Partners & Reps</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Commissions are set and paid by Promoters or Partners.</li>
              <li>MapMyParty is not liable for unpaid commissions.</li>
              <li>Partners and Reps act independently and must comply with tax obligations.</li>
            </ul>

            <p className="mb-3 font-semibold text-white">5.4 Resellers</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Resellers earn commissions from booking fees.</li>
              <li>Commission eligibility applies only through approved referral mechanisms.</li>
            </ul>

            <p className="mb-3 font-semibold text-white">5.5 Customers</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>MapMyParty is a platform only and not responsible for Event quality.</li>
              <li>Refunds depend on Promoter policies.</li>
              <li>Offline ticket purchases are governed directly by Organizers.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">6. Payments & Refunds</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Payments operate through Normal Pay or Direct Pay.</li>
              <li>MapMyParty processes refunds only where legally and contractually required.</li>
              <li>Convenience fees are non-refundable unless mandated by law.</li>
              <li>Offline ticket purchases are outside MapMyParty's liability.</li>
            </ul>
          </div>

          {/* Section 7 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">7. Platform Status</h2>
            <p>MapMyParty acts solely as a ticketing intermediary and does not host or produce Events.</p>
          </div>

          {/* Section 8 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">8. Intellectual Property</h2>
            <p>All Intellectual Property Rights remain with MapMyParty or its licensors. Unauthorized reproduction or commercial use is prohibited.</p>
          </div>

          {/* Section 9 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">9. User Representations</h2>
            <p>Users warrant lawful use, accuracy of information, and non-infringement of third-party rights.</p>
          </div>

          {/* Section 10 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">10. Security, Bugs & Viruses</h2>
            <p>MapMyParty does not guarantee uninterrupted or virus-free access. Users are responsible for safeguarding their systems.</p>
          </div>

          {/* Section 11 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">11. Data Protection & Privacy</h2>
            <p className="mb-3">11.1 Personal Data is processed in accordance with the Privacy Policy.</p>
            <p className="mb-3">11.2 Users agree to comply with all applicable Data Protection Laws.</p>
            <p className="mb-3 font-semibold text-white">11.2A India-Specific Compliance</p>
            <p className="ml-4">Processing of Personal Data shall also comply with the Digital Personal Data Protection Act, 2023. References to "Data Controller" and "Data Processor" shall, where applicable, be construed as "Data Fiduciary" and "Data Processor" under Indian law.</p>
          </div>

          {/* Section 12 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">12. Exclusion of Warranties & Limitation of Liability</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Services are provided "as is".</li>
              <li>Liability is capped at the amount paid or received in the preceding 12 months.</li>
              <li>No liability for indirect, incidental, or consequential losses.</li>
              <li>Statutory non-excludable liabilities remain unaffected.</li>
            </ul>
          </div>

          {/* Sections 13-22 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">13. Indemnity</h2>
            <p>Users indemnify MapMyParty against claims arising from misuse, breach, or unlawful activity.</p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">14. External Links</h2>
            <p>MapMyParty is not responsible for third-party websites or content.</p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">15. Force Majeure</h2>
            <p>Performance delays due to events beyond reasonable control are excused.</p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">16. Termination</h2>
            <p>Either party may terminate immediately. Certain obligations survive termination.</p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">17. Waiver</h2>
            <p>Failure to enforce rights does not constitute waiver.</p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">18. Assignment</h2>
            <p>Users may not assign rights without consent. MapMyParty may assign freely.</p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">19. Notices</h2>
            <p>All notices shall be in writing and sent to MapMyParty at the registered address.</p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">20. Severability</h2>
            <p>Invalid provisions do not affect remaining Terms.</p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">21. Entire Agreement</h2>
            <p>These Terms constitute the entire agreement between the parties.</p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">22. Governing Law & Jurisdiction</h2>
            <p>These Terms are governed by Indian law, and courts in India shall have exclusive jurisdiction.</p>
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default TermsConditions;
