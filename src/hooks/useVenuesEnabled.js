import { useQuery } from "@tanstack/react-query";
import { venueRequest } from "@/services/venueService";
export function useVenuesEnabled() {
  const { data } = useQuery({
    queryKey: ["venue-feature"],
    queryFn: () => venueRequest("public/venue-feature"),
    staleTime: 60000,
    retry: false,
  });
  return data?.enabled === true;
}
