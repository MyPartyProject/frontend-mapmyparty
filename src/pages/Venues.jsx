import { useEffect, useState } from "react";
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
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <h1 className="font-display text-5xl mt-5">
          Find your next favourite place.
        </h1>
        <p className="text-muted-foreground mt-3">
          Explore local venues. Request a table with no booking fee.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 my-8">
          {[
            ["q", "Search venue or area"],
            ["city", "City"],
            ["type", "Venue type"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm">
              {label}
              <Input
                className="mt-1"
                value={filters[key]}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, [key]: e.target.value }))
                }
              />
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
              className="theme-card rounded-2xl overflow-hidden"
            >
              <img
                src={venue.media.find((m) => m.kind === "DESKTOP")?.url}
                alt={venue.name}
                className="aspect-[16/9] w-full object-cover"
                loading="lazy"
              />
              <div className="p-5 space-y-2">
                <span className="text-xs text-gold">{venue.type}</span>
                <h2 className="text-xl font-semibold">{venue.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {[venue.area, venue.city].filter(Boolean).join(", ")}
                </p>
                <span className="text-xs">₹0 booking fee</span>
              </div>
            </Link>
          ))}
        </div>
        {!isFetching && data?.total === 0 && (
          <p>No venues match your search.</p>
        )}
        <div className="flex items-center gap-3 my-8">
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
