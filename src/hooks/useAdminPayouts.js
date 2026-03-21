import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminPayouts } from "@/services/adminService";

export const useAdminPayouts = (initialFilters = {}) => {
  const [items, setItems] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    status: initialFilters.status || "ALL",
    search: initialFilters.search || "",
  });
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const load = useCallback(async (nextPage = 1, overrideFilters = filters) => {
    if (!mountedRef.current) return;

    setIsFetching(true);
    setError(null);

    try {
      const data = await fetchAdminPayouts({
        page: nextPage,
        limit: pagination.limit || 20,
        status: overrideFilters.status === "ALL" ? "" : overrideFilters.status,
        search: overrideFilters.search,
      });

      if (mountedRef.current) {
        setItems(data?.items || []);
        setStatistics(data?.statistics || []);
        setPagination(
          data?.pagination || {
            page: nextPage,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
      }
    } catch (fetchError) {
      if (mountedRef.current) {
        setError(fetchError.message || "Failed to fetch payouts");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    mountedRef.current = true;
    load(1, filters);
    return () => {
      mountedRef.current = false;
    };
  }, [filters, load]);

  const updateFilters = useCallback((updates) => {
    setFilters((current) => ({ ...current, ...updates }));
    setLoading(true);
  }, []);

  return {
    items,
    statistics,
    pagination,
    filters,
    loading,
    isFetching,
    error,
    updateFilters,
    changePage: (page) => load(page, filters),
    refresh: () => load(pagination.page || 1, filters),
  };
};
