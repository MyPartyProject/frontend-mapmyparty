import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/config/api";

/**
 * Hook for fetching promoter dashboard overview data
 * Fetches comprehensive dashboard metrics from /api/admin/dashboard
 */
export const usePromoterDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch dashboard data from API
   */
  const fetchDashboard = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const url = "api/admin/dashboard";

      console.log("🌐 Fetching promoter dashboard from:", url);

      const response = await apiFetch(url, {
        method: "GET",
        credentials: "include",
      });

      console.log("✅ Promoter Dashboard API Response:", response);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch dashboard data");
      }

      const dashboardData = response.data || {};

      if (isMountedRef.current) {
        setDashboard(dashboardData);
        setError(null);
      }
    } catch (apiError) {
      console.error("❌ Error fetching promoter dashboard:", apiError);

      const errorMessage = apiError.message || apiError.data?.message || "Failed to fetch dashboard data";

      if (isMountedRef.current) {
        setError(errorMessage);
        setDashboard(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Refresh dashboard (force refetch)
   */
  const refresh = useCallback(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Fetch on mount
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    loading,
    error,
    refresh,
  };
};
