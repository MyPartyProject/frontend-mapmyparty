import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchOrganizerStats,
  fetchOrganizerEventsAdmin,
  fetchOrganizerReviews,
} from "@/services/organizerService";
import { fetchAdminOrganizerDetail } from "@/services/adminService";

export function useOrganizerDetail(organizerId) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState(null);
  const [reviews, setReviews] = useState(null);

  const [loading, setLoading] = useState({
    profile: true,
    stats: true,
    events: true,
    reviews: true,
  });

  const [errors, setErrors] = useState({
    profile: null,
    stats: null,
    events: null,
    reviews: null,
  });
  const [reloadToken, setReloadToken] = useState(0);

  const mountedRef = useRef(true);

  const refresh = useCallback(() => {
    if (!organizerId) return;
    setLoading({
      profile: true,
      stats: true,
      events: true,
      reviews: true,
    });
    setErrors({
      profile: null,
      stats: null,
      events: null,
      reviews: null,
    });
    setReloadToken((value) => value + 1);
  }, [organizerId]);

  useEffect(() => {
    mountedRef.current = true;

    if (!organizerId) return;

    const set = (key, value) => {
      if (mountedRef.current) {
        if (key === "profile") setProfile(value);
        else if (key === "stats") setStats(value);
        else if (key === "events") setEvents(value);
        else if (key === "reviews") setReviews(value);
      }
    };

    const setLoadingKey = (key, val) => {
      if (mountedRef.current) {
        setLoading((prev) => ({ ...prev, [key]: val }));
      }
    };

    const setErrorKey = (key, val) => {
      if (mountedRef.current) {
        setErrors((prev) => ({ ...prev, [key]: val }));
      }
    };

    // Fetch all 4 APIs in parallel
    fetchAdminOrganizerDetail(organizerId)
      .then((data) => set("profile", data))
      .catch((err) => setErrorKey("profile", err.message))
      .finally(() => setLoadingKey("profile", false));

    fetchOrganizerStats(organizerId)
      .then((data) => set("stats", data))
      .catch((err) => setErrorKey("stats", err.message))
      .finally(() => setLoadingKey("stats", false));

    fetchOrganizerEventsAdmin(organizerId, { limit: 50 })
      .then((data) => set("events", data))
      .catch((err) => setErrorKey("events", err.message))
      .finally(() => setLoadingKey("events", false));

    fetchOrganizerReviews(organizerId, { limit: 10 })
      .then((data) => set("reviews", data))
      .catch((err) => setErrorKey("reviews", err.message))
      .finally(() => setLoadingKey("reviews", false));

    return () => {
      mountedRef.current = false;
    };
  }, [organizerId, reloadToken]);

  return { profile, stats, events, reviews, loading, errors, refresh };
}
