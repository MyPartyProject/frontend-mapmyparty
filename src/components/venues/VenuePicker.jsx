import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { venueRequest } from "@/services/venueService";
import { useVenuesEnabled } from "@/hooks/useVenuesEnabled";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VenuePicker({ value, name, onSelect }) {
  const enabled = useVenuesEnabled();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const { data, isFetching, error } = useQuery({
    queryKey: ["venue-picker", query, page],
    queryFn: () =>
      venueRequest(
        `public/venues?q=${encodeURIComponent(query)}&page=${page}&limit=8`,
      ),
    enabled,
  });
  if (!enabled) return null;
  return (
    <div className="mb-6 space-y-3 rounded-xl border border-border p-4">
      <label htmlFor="catalogue-venue-search" className="font-medium">
        Select a registered venue
      </label>
      <Input
        id="catalogue-venue-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search venue name, area or city"
      />
      {value && (
        <p className="text-sm">
          Selected: {name}. Editing its details below switches to Other.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {data?.items.map((venue) => (
          <Button
            key={venue.id}
            type="button"
            variant={value === venue.id ? "secondary" : "outline"}
            className="h-auto justify-start whitespace-normal text-left"
            onClick={() => onSelect(venue)}
          >
            <span>
              {venue.name}
              <small className="block text-muted-foreground">
                {venue.city} · {venue.organizer.name}
              </small>
            </span>
          </Button>
        ))}
      </div>
      {isFetching && (
        <p className="text-sm" role="status">
          Searching…
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive">
          Search unavailable. You can still enter a custom venue.
        </p>
      )}
      {!isFetching && !data?.items.length && (
        <p className="text-sm text-muted-foreground">
          No matching venues. Use Other below.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={!value ? "secondary" : "outline"}
          onClick={() => onSelect(null)}
        >
          Other — enter venue details
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!data || page * 8 >= data.total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
