import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/config/api";

export const dashboardMonths = (now = new Date()) => {
  const india = new Date(now.getTime() + 330 * 60000);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(india.getUTCFullYear(), india.getUTCMonth() - index, 1));
    const label = date.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
    return { value: date.toISOString().slice(0, 7), label: index === 0 ? `Current month (${label})` : label };
  });
};

export const usePromoterDashboard = () => {
  const [filter, setFilter] = useState(() => ({ month: dashboardMonths()[0].value }));
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestRef = useRef(0);
  const fetchDashboard = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    setDashboard(null);
    try {
      const response = await apiFetch("admin/dashboard?" + new URLSearchParams(filter), { method: "GET", credentials: "include" });
      if (!response.success) throw new Error(response.message || "Failed to fetch dashboard data");
      if (request === requestRef.current) setDashboard(response.data || {});
    } catch (apiError) {
      if (request === requestRef.current) setError(apiError.message || "Failed to fetch dashboard data");
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [filter]);
  useEffect(() => {
    fetchDashboard();
    return () => { requestRef.current++; };
  }, [fetchDashboard]);
  const applyFilter = useCallback(next => {
    requestRef.current++;
    setDashboard(null);
    setLoading(true);
    setError(null);
    setFilter(next);
  }, []);
  return { dashboard, loading, error, refresh: fetchDashboard, filter, applyFilter };
};
