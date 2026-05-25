import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/MMP logo.svg";

const navLinks = [
  { label: "Browse Events", to: "/browse-events" },
  { label: "Host Events", to: "/host-events" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const socials = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

const Footer = () => {
  return (
    <footer className="relative mt-0 overflow-hidden border-t border-border/40 bg-background text-foreground">
      <div className="theme-gradient-primary absolute inset-0 opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background to-background" />
      <div className="theme-gradient-primary absolute inset-x-8 top-0 h-px opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-border/50 bg-card/70 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-border/40 bg-muted/40 p-2 shadow-[var(--shadow-card)]">
                <img src={logo} alt="MapMyParty" className="h-12 w-auto" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">Map MyParty</p>
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Discover, manage, and celebrate events with a smooth, modern experience.
                </p>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-6 text-sm sm:grid-cols-3 md:max-w-2xl">
              <div className="space-y-3">
                <p className="font-semibold text-foreground">Explore</p>
                <div className="space-y-2 text-muted-foreground">
                  {navLinks.map((link) => (
                    <Link key={link.to} to={link.to} className="block transition-colors hover:text-accent">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-foreground">Support</p>
                <div className="space-y-2 text-muted-foreground">
                  <Link to="/contact" className="block transition-colors hover:text-accent">
                    Help & Support
                  </Link>
                  <Link to="/privacy-policy" className="block transition-colors hover:text-accent">
                    Privacy Policy
                  </Link>
                  <Link to="/terms-conditions" className="block transition-colors hover:text-accent">
                    Terms & Conditions
                  </Link>
                  <Link to="/cookie-policy" className="block transition-colors hover:text-accent">
                    Cookie Policy
                  </Link>
                  <Link to="/refund-policy" className="block transition-colors hover:text-accent">
                    Refund Policy
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-foreground">Connect</p>
                <div className="flex gap-3">
                  {socials.map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-muted/40 text-muted-foreground shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-border hover:bg-accent hover:text-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start gap-4 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>&copy; {new Date().getFullYear()} Map MyParty. All rights reserved.</p>
            <p className="text-muted-foreground/80">
              Built for seamless event discovery and management.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
