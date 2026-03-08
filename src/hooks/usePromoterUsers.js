import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/config/api";

const DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;
const PAGE_LIMIT = 20;

export const usePromoterUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const filtersRef = useRef({ search: "" });
  const [filters, setFilters] = useState(filtersRef.current);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchUsers = useCallback(async (pageNum = 1) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const requestId = ++requestIdRef.current;
    const currentFilters = filtersRef.current;

    setIsFetching(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", pageNum);
      params.set("limit", PAGE_LIMIT);

      if (currentFilters.search && currentFilters.search.length >= MIN_SEARCH_LENGTH) {
        params.set("search", currentFilters.search);
      }

      const response = await apiFetch(`/admin/users?${params.toString()}`, {
        method: "GET",
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current) return;

      setUsers(response.data?.users || []);
      setPagination(
        response.data?.pagination || {
          page: pageNum,
          limit: PAGE_LIMIT,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (err) {
      if (err.name === "AbortError" || requestId !== requestIdRef.current) return;
      console.error("Error fetching promoter users:", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsFetching(false);
        setLoading(false);
      }
    }
  }, []);

  const updateFilters = useCallback(
    (newFilters) => {
      const merged = { ...filtersRef.current, ...newFilters };
      filtersRef.current = merged;
      setFilters(merged);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (newFilters.search !== undefined) {
        if (merged.search.length > 0 && merged.search.length < MIN_SEARCH_LENGTH) return;
        debounceRef.current = setTimeout(() => fetchUsers(1), DEBOUNCE_MS);
        return;
      }

      fetchUsers(1);
    },
    [fetchUsers]
  );

  const changePage = useCallback(
    (pageNum) => {
      fetchUsers(pageNum);
    },
    [fetchUsers]
  );

  const refresh = useCallback(() => {
    fetchUsers(pagination.page || 1);
  }, [fetchUsers, pagination.page]);

  useEffect(() => {
    fetchUsers(1);

    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchUsers]);

  const statistics = useMemo(
    () => ({
      totalSpent: users.reduce((sum, user) => sum + Number(user.totalSpent || 0), 0),
      totalTickets: users.reduce((sum, user) => sum + Number(user.totalTickets || 0), 0),
    }),
    [users]
  );

  return {
    users,
    loading,
    isFetching,
    error,
    pagination,
    filters,
    statistics,
    updateFilters,
    changePage,
    refresh,
  };
};
