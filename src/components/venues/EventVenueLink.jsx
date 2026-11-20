import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { venueRequest, venuePath } from "@/services/venueService";
import { useVenuesEnabled } from "@/hooks/useVenuesEnabled";
export default function EventVenueLink({ venueId }) {
  const enabled = useVenuesEnabled();
  const { data } = useQuery({
    queryKey: ["venue-link", venueId],
    queryFn: () => venueRequest(`public/venues/${venueId}`),
    enabled: enabled && !!venueId,
    retry: false,
  });
  return data && enabled ? (
    <Link
      to={venuePath(data)}
      className="inline-block text-sm text-[#EC4899] mt-2"
    >
      Explore venue & request a table →
    </Link>
  ) : null;
}
