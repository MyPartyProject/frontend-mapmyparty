import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/config/api";

export const usePromoterDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchDashboard = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("admin/dashboard", {
        method: "GET",
        credentials: "include",
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch dashboard data");
      }

      if (mountedRef.current) {
        setDashboard(response.data || {});
      }
    } catch (apiError) {
      console.error("Error fetching promoter dashboard:", apiError);
      if (mountedRef.current) {
        setError(apiError.message || "Failed to fetch dashboard data");
        setDashboard(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchDashboard();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchDashboard]);

  return {
    dashboard,
    loading,
    error,
    refresh: fetchDashboard,
  };
};
