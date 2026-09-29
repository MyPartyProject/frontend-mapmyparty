import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeToggle({ className = "", compact = false }) {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon" : "default"}
      className={`shrink-0 text-foreground ${className}`}
      data-theme-toggle
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      title={`Switch to ${dark ? "light" : "dark"} theme`}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      {!compact && <span className="ml-2">{dark ? "Light" : "Dark"} theme</span>}
    </Button>
  );
}
