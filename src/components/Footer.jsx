import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/MMP logo.svg";

const navLinks = [
  { label: "Browse Events", to: "/browse-events" },
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
    <footer className="mt-12 border-t border-white/10 bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="flex items-start gap-4">
            <img src={logo} alt="MapMyParty" className="h-12 w-auto" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">Map MyParty</p>
              <p className="text-sm text-white/70 max-w-xs leading-relaxed">
                Discover, manage, and celebrate events with a smooth, modern experience.
              </p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-3">
              <p className="font-semibold text-white">Explore</p>
              <div className="space-y-2 text-white/70">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-white">Support</p>
              <div className="space-y-2 text-white/70">
                <Link to="/contact" className="block hover:text-white transition-colors">
                  Help & Support
                </Link>
                <Link to="/privacy-policy" className="block hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms-conditions" className="block hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
                <Link to="/cookie-policy" className="block hover:text-white transition-colors">
                  Cookie Policy
                </Link>
                <Link to="/refund-policy" className="block hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-white">Connect</p>
              <div className="flex gap-3">
                {socials.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center hover:border-white/40 hover:bg-white/10 transition"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0 md:justify-between text-xs text-white/60">
          <p>&copy; {new Date().getFullYear()} Map MyParty. All rights reserved.</p>
          <p className="text-white/50">
            Built for seamless event discovery and management.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
