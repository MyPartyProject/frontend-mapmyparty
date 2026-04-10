import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminAuditLogs } from "@/services/adminService";

export const useAdminAuditLogs = (initialFilters = {}) => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    type: initialFilters.type || "ALL",
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
      const data = await fetchAdminAuditLogs({
        page: nextPage,
        limit: pagination.limit || 30,
        type: overrideFilters.type === "ALL" ? "" : overrideFilters.type,
        search: overrideFilters.search,
      });
      if (mountedRef.current) {
        setItems(data?.items || []);
        setPagination(
          data?.pagination || {
            page: nextPage,
            limit: 30,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
      }
    } catch (fetchError) {
      if (mountedRef.current) {
        setError(fetchError.message || "Failed to fetch audit logs");
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

  return {
    items,
    pagination,
    filters,
    loading,
    isFetching,
    error,
    updateFilters: (updates) => {
      setFilters((current) => ({ ...current, ...updates }));
      setLoading(true);
    },
    changePage: (page) => load(page, filters),
    refresh: () => load(pagination.page || 1, filters),
  };
};
