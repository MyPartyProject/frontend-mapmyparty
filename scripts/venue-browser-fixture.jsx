import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../src/contexts/AuthContext";
import { VenueSurface } from "../src/pages/VenuePage";
import OrganizerVenues from "../src/components/venues/OrganizerVenues";
import OrganizerMobile from '../src/components/organizer/OrganizerMobile';
import VenuePicker from '../src/components/venues/VenuePicker';
import Venues from '../src/pages/Venues';
import "../src/index.css";

const mobile = location.search.includes('mobile');
const Router = mobile ? MemoryRouter : BrowserRouter;
function PickerFixture() {
  const [venue, setVenue] = useState(null);
  return <main className="p-6"><VenuePicker value={venue?.id} name={venue?.name} onSelect={setVenue} /><output id="picked-venue">{venue?.id || 'Other'}</output></main>;
}

createRoot(document.getElementById("root")).render(
  <ThemeProvider
    attribute="class"
    storageKey="mapmyparty-theme"
    defaultTheme="dark"
  >
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Router {...(mobile ? { initialEntries: ['/organizer/venues'] } : {})}>
        <AuthProvider>
          {mobile ? <OrganizerMobile /> : location.search.includes('picker') ? <PickerFixture /> : location.search.includes('directory') ? <Venues /> : location.search.includes("organizer") ? (
            <div className="p-5">
              <OrganizerVenues />
            </div>
          ) : (
            <VenueSurface venue={window.__venueFixture} />
          )}
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  </ThemeProvider>,
);
