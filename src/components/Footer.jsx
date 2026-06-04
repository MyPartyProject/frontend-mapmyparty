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
      <div className="theme-gradient-primary absolute inset-x-0 top-0 h-px opacity-35" />

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.45fr] lg:items-start">
          <div className="flex max-w-sm items-start gap-4">
            <div className="rounded-[8px] border border-border/40 bg-card/70 p-2 shadow-[var(--shadow-card)]">
              <img src={logo} alt="MapMyParty" className="h-11 w-auto" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">Map MyParty</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Discover, manage, and celebrate events with a smooth, modern experience.
              </p>
            </div>
          </div>

          <div className="grid gap-7 text-sm sm:grid-cols-3 lg:justify-items-end">
            <div className="space-y-3 lg:min-w-32">
              <p className="font-semibold text-foreground">Explore</p>
              <div className="space-y-2 text-muted-foreground">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="block transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-3 lg:min-w-44">
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

            <div className="space-y-3 lg:min-w-32">
              <p className="font-semibold text-foreground">Connect</p>
              <div className="flex gap-2.5">
                {socials.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card/70 text-muted-foreground shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-border hover:bg-accent hover:text-accent-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start gap-3 border-t border-border/40 pt-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Map MyParty. All rights reserved.</p>
          <p className="text-muted-foreground/80">
            Built for seamless event discovery and management.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
