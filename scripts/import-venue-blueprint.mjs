import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const reference = path.join(
  root,
  "docs/design/mapmyparty_brownstone_cafe_venue_page.html",
);
fs.mkdirSync(path.dirname(reference), { recursive: true });
if (!fs.existsSync(reference))
  fs.copyFileSync(
    path.join(root, "dist/mapmyparty_brownstone_cafe_venue_page.html"),
    reference,
  );
const html = fs.readFileSync(reference, "utf8");
const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
// Scope the supplied design to the venue surface; never replace global theme tokens.
let css = style
  .replace(/:root/g, ".venue-page")
  .replace(/html\.light/g, "html.light .venue-page")
  .replace(/html\.dark/g, "html.dark .venue-page")
  .replace(/\bbody/g, ".venue-page");
css = css.replace(/\.venue-page \.venue-page/g, ".venue-page");
for (const selector of ["cta-primary", "theme-card", "luxury-grain"])
  css = css.replace(
    new RegExp(`(?<![\\w-])\\.${selector}`, "g"),
    `.venue-page .${selector}`,
  );
css = css.replace(/\.venue-page \.venue-page/g, ".venue-page");
css = css.replace(
  /(?<![\w-])::(-webkit-scrollbar[^\s{]*)/g,
  ".venue-page ::$1",
);
css +=
  '\n.venue-page { font-family: "Plus Jakarta Sans", sans-serif; }\n.venue-page .font-display { font-family: "Cormorant Garamond", Georgia, serif; }\n.venue-page .font-mono { font-family: "JetBrains Mono", monospace; }\n.venue-page .text-gold { color: hsl(var(--accent)); }\n';
fs.mkdirSync(path.join(root, "src/styles"), { recursive: true });
fs.writeFileSync(path.join(root, "src/styles/venue-page.css"), css);
