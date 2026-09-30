import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function ThemeToggle({ className = "", compact = false, presentation = "button" }) {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  const navbar = presentation === "navbar";
  if (presentation === "switch") {
    return (
      <label className={`flex items-center gap-3 cursor-pointer text-sm text-foreground ${compact ? "justify-center" : "justify-between"} ${className}`}>
        <span className={compact ? "sr-only" : "flex items-center gap-3"}>
          <Moon className="h-4 w-4" aria-hidden="true" />Dark mode
        </span>
        <Switch data-theme-toggle aria-label="Dark mode" title="Dark mode"
          checked={dark} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
      </label>
    );
  }
  return (
    <Button
      type="button"
      variant="outline"
      size={compact || navbar ? "icon" : "default"}
      className={`shrink-0 text-foreground ${navbar ? "h-8 w-8 [&_svg]:size-3.5" : ""} ${className}`}
      data-theme-toggle
      data-theme-navbar={navbar || undefined}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      title={`Switch to ${dark ? "light" : "dark"} theme`}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      {!compact && !navbar && <span className="ml-2">{dark ? "Light" : "Dark"} theme</span>}
    </Button>
  );
}
