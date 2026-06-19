import { Link } from "react-router-dom";
import logo from "../assets/MMP logo.svg";

const PrivacyPolicy = () => {
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
          <h1 className="text-5xl font-semibold mb-3">Privacy Policy</h1>
        </div>

        {/* Content */}
        <div className="space-y-8 text-muted-foreground leading-relaxed text-sm">
          <p>
            MapMyParty ("MapMyParty", "we", "our") respect your privacy and are committed to protecting your Personal Data. This policy describes:
          </p>
          
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>The types of information that MapMyParty may collect from you when you access or use its websites, applications and other online services (collectively, referred as "Services"); and</li>
            <li>Its practices for collecting, using, maintaining, protecting and disclosing that information.</li>
          </ul>

          <p>
            This policy applies only to the information MapMyParty collects through its Services, in email, text and other electronic communications sent through or in connection with its Services.
          </p>

          <p>
            This policy does not apply to information that you provide to, or that is collected by, any third-party, such as Curators at which you make reservations and/or pay through MapMyParty Services and social networks that you use in connection with its Services. MapMyParty encourages you to consult directly with such third-parties for information about their privacy practices.
          </p>

          <p>
            Please read this policy carefully to understand MapMyParty's policies and practices regarding processing of your information. By accessing or using MapMyParty's Services and/or registering for an account with MapMyParty or any of its affiliates, you agree to this privacy policy and you provide your informed consent to the collection, use, disclosure, retention, and protection of your personal information as described here. If you do not provide the information MapMyParty requires, MapMyParty and its platforms may decline to provide Services to you.
          </p>

          {/* Definitions */}
          <div className="pt-6 border-t border-border/70">
            <h2 className="text-lg font-semibold text-foreground mb-4">Definitions</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-foreground">"Curator":</strong> Event organisers or creators using MapMyParty's SaaS platform.</li>
              <li><strong className="text-foreground">"Customer":</strong> Individuals attending events or interacting with event-related content.</li>
              <li><strong className="text-foreground">"User / You":</strong> Curators, Customers, and any individual using our services.</li>
              <li><strong className="text-foreground">"Personal Data":</strong> Any data that identifies or relates to an identifiable individual, as defined under the DPDP Act and GDPR.</li>
            </ul>
          </div>

          {/* Our Role */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Our Role: Data Controller & Data Processor</h2>
            <p className="mb-4">Depending on how you use our services, MapMyParty may act as:</p>
            
            <p className="mb-2"><strong className="text-white">1. Data Controller</strong></p>
            <p className="mb-4 ml-4">
              MapMyParty acts as a Data Controller when you create an account with us, you explore or interact with our platform, or we analyse platform usage, security, or performance data. In these cases, we determine the purpose and means of processing your Personal Data.
            </p>
            
            <p className="mb-2"><strong className="text-white">2. Data Processor</strong></p>
            <p className="ml-4">
              MapMyParty acts as a Data Processor when you register for an event organised by a Curator, or a Curator uploads or imports your data to manage invitations or communications. In such cases, the Curator is the Data Controller, and MapMyParty processes data strictly on their instructions.
            </p>
          </div>

          {/* Information We Collect */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="mb-4">We collect Personal Data only when it is necessary, lawful, and proportionate.</p>
            
            <p className="mb-2 font-semibold text-white">Personal Data You Provide</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Name, age, date of birth, gender</li>
              <li>Email address, phone number, postal address</li>
              <li>Social media identifiers (if connected voluntarily)</li>
              <li>Preferences, feedback, survey responses</li>
            </ul>
            
            <p className="mb-2 font-semibold text-white">Financial Information</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Payment details are processed via secure third-party payment gateways</li>
              <li>MapMyParty does not store card or banking details beyond transaction completion</li>
            </ul>
            
            <p className="mb-2 font-semibold text-white">Automatically Collected Data</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>IP address, device type, browser details</li>
              <li>Log data, cookies, usage analytics</li>
            </ul>
          </div>

          {/* Lawful Basis */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">2. Lawful Basis for Processing</h2>
            <p className="mb-4">We process Personal Data only on lawful grounds permitted under the DPDP Act and GDPR, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Consent (explicit, informed, and revocable)</li>
              <li>Contractual necessity</li>
              <li>Legal obligation</li>
              <li>Legitimate interest, where your rights are not overridden</li>
              <li>Prevention of fraud and misuse</li>
            </ul>
          </div>

          {/* How We Use */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">3. How We Use Your Personal Data</h2>
            <p className="mb-4">Your data is used strictly for legitimate purposes, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Account creation and authentication (OTP-based login)</li>
              <li>Event registration, ticketing, and payments</li>
              <li>Customer support and grievance handling</li>
              <li>Fraud prevention and platform security</li>
              <li>Legal, tax, and regulatory compliance</li>
              <li>Improving platform functionality and user experience</li>
            </ul>
            <p className="text-sm text-white/60 italic">
              We do not sell or trade Personal Data. We do not broadcast unsolicited promotional messages. Any suspicious message claiming to be from MapMyParty should be reported to support@mapmyparty.com.
            </p>
          </div>

          {/* Sharing */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">4. Sharing of Personal Data</h2>
            <p className="mb-4">We may share Personal Data only with:</p>
            
            <p className="mb-2 font-semibold text-white">Curators</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Event-related communications</li>
              <li>Attendance and registration details</li>
            </ul>
            <p className="text-sm text-white/60 ml-4 mb-4">Customers may opt out of Curator communications at any time.</p>
            
            <p className="mb-2 font-semibold text-white">Trusted Service Providers</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Payment processors</li>
              <li>Hosting and cloud infrastructure providers</li>
              <li>Analytics and security vendors</li>
            </ul>
            <p className="text-sm text-white/60 ml-4 mb-4">All third parties are bound by strict confidentiality and data-protection obligations.</p>
            
            <p className="mb-2 font-semibold text-white">Legal Authorities</p>
            <p className="ml-4">Where required to comply with law, court orders, or regulatory requirements.</p>
          </div>

          {/* Cross-Border */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">5. Cross-Border Data Transfers</h2>
            <p className="mb-4">Your Personal Data may be stored or processed outside India or the European Economic Area (EEA). MapMyParty ensures:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Adequate technical and organisational safeguards</li>
              <li>Contractual data-protection clauses</li>
              <li>Compliance with DPDP Act transfer rules and GDPR Chapter V requirements</li>
            </ul>
          </div>

          {/* Security */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">6. Data Security</h2>
            <p className="mb-4">We implement reasonable security safeguards as required under the DPDP Act and GDPR, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>SSL encryption</li>
              <li>Secure servers and restricted access</li>
              <li>Regular monitoring and security reviews</li>
            </ul>
            <p className="text-sm text-white/60 italic">While no system is completely secure, we take all reasonable steps to protect your data.</p>
          </div>

          {/* Retention */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">7. Data Retention</h2>
            <p className="mb-4">We retain Personal Data only for as long as necessary to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Fulfil the purpose for which it was collected</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes or enforce agreements</li>
            </ul>
            <p className="text-sm text-white/60">Thereafter, data is securely deleted or anonymised.</p>
          </div>

          {/* Rights */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">8. Your Rights Under DPDP Act & GDPR</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Access your Personal Data</li>
              <li>Correction of inaccurate or incomplete data</li>
              <li>Erasure / Right to be Forgotten</li>
              <li>Withdraw consent at any time</li>
              <li>Restrict or object to processing</li>
              <li>Data portability (where applicable)</li>
              <li>Grievance redressal</li>
            </ul>
            <p>Requests can be made by contacting: <a href="mailto:support@mapmyparty.com" className="text-[#D60024] hover:underline">support@mapmyparty.com</a>. We will respond within statutory timelines.</p>
          </div>

          {/* Grievance */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">9. Grievance Redressal & Complaints</h2>
            <p className="mb-4">If you believe your data is being misused or your rights are violated:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Contact us at <a href="mailto:support@mapmyparty.com" className="text-[#D60024] hover:underline">support@mapmyparty.com</a></li>
              <li>If unresolved, you may approach the appropriate Data Protection Authority under the DPDP Act or GDPR.</li>
            </ol>
          </div>

          {/* Changes */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">10. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy to reflect changes in law or our services. Updates will be published on this page and, where required, notified to Users. Continued use of MapMyParty signifies acceptance of the updated policy.</p>
          </div>

          {/* Contact */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">11. Contact Information</h2>
            <p className="mb-2">For privacy-related queries, requests, or complaints:</p>
            <a href="mailto:support@mapmyparty.com" className="text-[#D60024] hover:underline">support@mapmyparty.com</a>
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default PrivacyPolicy;
