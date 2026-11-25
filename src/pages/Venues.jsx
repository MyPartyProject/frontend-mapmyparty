import { useEffect, useState } from "react";
import { Search, MapPin, Store, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { venueRequest, venuePath } from "@/services/venueService";
import { VenueHeader } from "./VenuePage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Venues() {
  const [filters, setFilters] = useState({ q: "", city: "", type: "" });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(new URLSearchParams(filters).toString());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);
  const { data, error, isFetching } = useQuery({
    queryKey: ["venue-directory", query, page],
    queryFn: () => venueRequest(`public/venues?${query}&page=${page}`),
    retry: false,
  });
  return (
    <div className="venue-page min-h-screen bg-background text-foreground">
      <VenueHeader />
      <main className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-8 lg:px-12">
        <header className="py-8 sm:py-12 lg:pt-16">
          <h1 className="max-w-4xl text-balance font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Find your next favourite place.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            Explore local venues. Request a table with no booking fee.
          </p>
        </header>
        <div className="theme-card mb-7 grid grid-cols-2 gap-3 rounded-2xl p-4 sm:mb-10 sm:grid-cols-[2fr_1fr_1fr] sm:gap-5 sm:p-6">
          {[
            ["q", "Search venue or area", Search],
            ["city", "City", MapPin],
            ["type", "Venue type", Store],
          ].map(([key, label, Icon]) => (
            <label key={key} className={`min-w-0 text-sm font-medium ${key === "q" ? "col-span-2 sm:col-span-1" : ""}`}>
              {label}
              <span className="relative mt-2 block">
                <Icon aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 rounded-xl pl-10 text-base"
                  value={filters[key]}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </span>
            </label>
          ))}
        </div>
        {isFetching && <p role="status">Loading venues…</p>}
        {error && <p role="alert">{error.message}</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.items.map((venue) => (
            <Link
              key={venue.id}
              to={venuePath(venue)}
              className="theme-card group min-w-0 overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:transition-shadow hover:shadow-lg"
            >
              <img
                src={(venue.media.find((m) => m.kind === "DESKTOP") || venue.media.find((m) => m.kind === "MOBILE" || m.kind === "TABLET"))?.url}
                alt={venue.name}
                className="aspect-[16/9] w-full object-cover"
                loading="lazy"
              />
              <div className="space-y-2 break-words p-5 sm:p-6">
                <span className="text-xs text-gold">{venue.type}</span>
                <h2 className="font-display text-2xl font-semibold leading-tight">{venue.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {[venue.area, venue.city].filter(Boolean).join(", ")}
                </p>
                <div className="!mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">₹0 booking fee <ArrowUpRight size={16} aria-hidden="true" /></div>
              </div>
            </Link>
          ))}
        </div>
        {!isFetching && data?.total === 0 && (
          <p>No venues match your search.</p>
        )}
        <div className="my-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span>Page {page}</span>
          <Button
            variant="outline"
            disabled={!data || page * data.limit >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </main>
    </div>
  );
}
