import { Link } from "react-router-dom";
import logo from "../assets/MMP logo.svg";

const CookiePolicy = () => {
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
          <h1 className="text-5xl font-semibold mb-3">Cookie Policy</h1>
        </div>

        {/* Content */}
        <div className="space-y-8 text-muted-foreground leading-relaxed text-sm">
          <p>
            This Cookie Policy explains how MapMyParty ("MapMyParty", "we", "our", "us") uses cookies and similar technologies when you visit our website, mobile application, or use our services (collectively, the "Platform").
          </p>

          <p className="text-muted-foreground">
            <strong className="text-foreground">Note:</strong> This policy should be read together with our{" "}
            <Link to="/privacy-policy" className="text-[#D60024] hover:underline">
              Privacy Policy
            </Link>.
          </p>

          {/* Section 1 */}
          <div className="pt-6 border-t border-border/70">
            <h2 className="text-lg font-semibold text-foreground mb-4">1. What Are Cookies?</h2>
            <p className="mb-4">
              Cookies are small text files that are placed on your device (computer, smartphone, tablet) when you visit a website. They help websites recognise your device, remember preferences, improve functionality, and analyse usage.
            </p>
            <p className="mb-2">Cookies may be:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-foreground">Session cookies</strong> (deleted when you close your browser)</li>
              <li><strong className="text-foreground">Persistent cookies</strong> (stored on your device for a defined period or until deleted)</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">2. Why We Use Cookies</h2>
            <p className="mb-4">MapMyParty uses cookies to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Ensure the Platform functions correctly</li>
              <li>Secure user accounts and prevent fraud</li>
              <li>Improve performance and user experience</li>
              <li>Understand how Users interact with our Platform</li>
              <li>Deliver relevant content and communications (where permitted)</li>
            </ul>
            <p className="text-sm text-white/60 italic mt-4">We do not use cookies to sell or trade your Personal Data.</p>
          </div>

          {/* Section 3 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">3. Types of Cookies We Use</h2>
            
            <p className="mb-3 font-semibold text-white">a. Strictly Necessary Cookies</p>
            <p className="mb-2 text-sm text-white/60">Cannot be disabled</p>
            <p className="mb-2">These cookies are essential for the operation of our Platform and cannot be switched off. They are used to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Enable secure login and authentication (OTP, sessions)</li>
              <li>Maintain account security</li>
              <li>Prevent fraudulent activity</li>
              <li>Ensure proper load balancing and system stability</li>
            </ul>
            <p className="text-sm text-white/50 mb-6">Legal basis: Legitimate interest / contractual necessity (GDPR Article 6(1)(b), 6(1)(f))</p>

            <p className="mb-3 font-semibold text-white">b. Performance & Analytics Cookies</p>
            <p className="mb-2 text-sm text-white/60">Optional</p>
            <p className="mb-2">These cookies help us understand how Users interact with our Platform so we can improve performance and usability. They collect information such as:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Pages visited</li>
              <li>Time spent on pages</li>
              <li>Error messages</li>
              <li>Device and browser type (anonymised)</li>
            </ul>
            <p className="text-sm text-white/50 mb-6">Analytics data is aggregated and anonymised wherever possible. Legal basis: Consent (GDPR Article 6(1)(a))</p>

            <p className="mb-3 font-semibold text-white">c. Functional Cookies</p>
            <p className="mb-2 text-sm text-white/60">Optional</p>
            <p className="mb-2">These cookies enable enhanced functionality and personalisation. They may remember:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Language preferences</li>
              <li>Region or location</li>
              <li>Previously selected settings</li>
            </ul>
            <p className="text-sm text-white/50 mb-6">Without these cookies, some features may not function properly. Legal basis: Consent (GDPR Article 6(1)(a))</p>

            <p className="mb-3 font-semibold text-white">d. Marketing & Communication Cookies (Optional)</p>
            <p className="mb-2 text-sm text-white/60">Optional</p>
            <p className="mb-2">These cookies may be used to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Measure the effectiveness of campaigns</li>
              <li>Deliver relevant event-related content</li>
              <li>Limit the number of times you see a message</li>
            </ul>
            <p className="text-sm text-white/50">We do not use cookies for third-party behavioural advertising without your explicit consent. Legal basis: Explicit consent (GDPR Article 6(1)(a))</p>
          </div>

          {/* Section 4 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">4. Third-Party Cookies</h2>
            <p className="mb-4">Some cookies may be placed by trusted third-party service providers who help us operate our Platform, such as:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Analytics providers</li>
              <li>Payment gateways</li>
              <li>Cloud hosting and security services</li>
            </ul>
            <p className="mt-4">These third parties may process data outside your country of residence. We ensure appropriate safeguards and contractual protections are in place in accordance with GDPR.</p>
          </div>

          {/* Section 5 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">5. Cookie Consent</h2>
            <p className="mb-4">When you first visit MapMyParty, you will see a cookie consent banner that allows you to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Accept all cookies</li>
              <li>Reject non-essential cookies</li>
              <li>Manage cookie preferences</li>
            </ul>
            <p className="mt-4">Non-essential cookies are not activated unless you provide consent. You may withdraw or change your consent at any time.</p>
          </div>

          {/* Section 6 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">6. Managing Cookies</h2>
            <p className="mb-4">You can manage or delete cookies through:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Your browser settings</li>
              <li>Our cookie preference centre (if enabled)</li>
            </ul>
            <p className="text-sm text-white/60 italic mt-4">Please note that disabling certain cookies may affect the functionality of the Platform.</p>
          </div>

          {/* Section 7 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">7. How Long Cookies Are Stored</h2>
            <p>Cookies are retained only for as long as necessary to fulfil their purpose, after which they are automatically deleted or anonymised.</p>
          </div>

          {/* Section 8 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">8. Updates to This Cookie Policy</h2>
            <p>We may update this Cookie Policy from time to time to reflect legal, technical, or operational changes. Updates will be posted on this page, and continued use of the Platform constitutes acceptance of the revised policy.</p>
          </div>

          {/* Section 9 */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">9. Contact Us</h2>
            <p className="mb-2">If you have any questions about our use of cookies or your privacy rights, please contact us:</p>
            <a href="mailto:support@mapmyparty.com" className="text-[#D60024] hover:underline">support@mapmyparty.com</a>
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default CookiePolicy;
