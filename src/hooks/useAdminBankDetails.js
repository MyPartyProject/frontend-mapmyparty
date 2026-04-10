import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminBankDetails } from "@/services/adminService";

export const useAdminBankDetails = (initialFilters = {}) => {
  const [items, setItems] = useState([]);
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
      const data = await fetchAdminBankDetails({
        page: nextPage,
        limit: pagination.limit || 20,
        status: overrideFilters.status === "ALL" ? "" : overrideFilters.status,
        search: overrideFilters.search,
      });
      if (mountedRef.current) {
        setItems(data?.items || []);
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
        setError(fetchError.message || "Failed to fetch bank details");
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
