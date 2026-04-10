import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminTaskSummary } from "@/services/adminService";

export const useAdminTaskSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const loadSummary = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAdminTaskSummary();
      if (mountedRef.current) {
        setSummary(data || null);
      }
    } catch (fetchError) {
      if (mountedRef.current) {
        setError(fetchError.message || "Failed to fetch admin task summary");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadSummary();

    return () => {
      mountedRef.current = false;
    };
  }, [loadSummary]);

  return {
    summary,
    loading,
    error,
    refresh: loadSummary,
  };
};
