 import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";

function ValidateTheme() {
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    if (theme !== "light" && theme !== "dark") setTheme("light");
  }, [theme, setTheme]);
  return null;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange storageKey="mapmyparty-theme">
      <ValidateTheme />
      <App />
    </ThemeProvider>,
  );
}
