import { useSyncExternalStore } from "react";
import { ORGANIZER_COMPACT_QUERY } from "@/utils/organizerMobile";

const subscribe = (callback) => {
  const media = window.matchMedia(ORGANIZER_COMPACT_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
const getSnapshot = () => window.matchMedia(ORGANIZER_COMPACT_QUERY).matches;

export function useOrganizerCompact() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
