import { useState, useEffect, useRef, useCallback } from "react";
import { fetchAdminOrganizers } from "@/services/adminService";

export function useOrganizers() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAdminOrganizers();
        if (mountedRef.current) {
          setOrganizers(data.organizers || []);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message || "Failed to fetch organizers");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mountedRef.current = false;
    };
  }, [reloadToken]);

  return { organizers, loading, error, refresh };
}
