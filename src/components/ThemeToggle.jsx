import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeToggle({ className = "", compact = false, presentation = "button" }) {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  const navbar = presentation === "navbar";
  const sidebarSwitch = presentation === "switch";
  const toggle = (
    <Button
      type="button"
      variant="ghost"
      size={compact || navbar ? "icon" : "default"}
      className={`shrink-0 bg-transparent text-foreground hover:bg-transparent hover:text-foreground ${navbar ? "h-8 w-8 [&_svg]:size-3.5" : ""} ${sidebarSwitch ? "w-full px-0" : className}`}
      data-theme-toggle
      data-theme-navbar={navbar || undefined}
      role={sidebarSwitch ? "switch" : undefined}
      aria-checked={sidebarSwitch ? dark : undefined}
      aria-label={sidebarSwitch ? "Dark mode" : `Switch to ${dark ? "light" : "dark"} theme`}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </Button>
  );

  return sidebarSwitch ? <label className={`flex items-center ${className}`}>{toggle}</label> : toggle;
}
