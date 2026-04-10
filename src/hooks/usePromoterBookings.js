import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/config/api";

const DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;
const PAGE_LIMIT = 20;

export const usePromoterBookings = () => {
  const [summary, setSummary] = useState(null);
  const [eventHighlights, setEventHighlights] = useState([]);
  const [bookings, setBookings] = useState([]);
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

  const filtersRef = useRef({ status: "ALL", search: "" });
  const [filters, setFilters] = useState(filtersRef.current);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchBookings = useCallback(async (pageNum = 1) => {
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

      if (currentFilters.status && currentFilters.status !== "ALL") {
        params.set("status", currentFilters.status);
      }
      if (currentFilters.search && currentFilters.search.length >= MIN_SEARCH_LENGTH) {
        params.set("search", currentFilters.search);
      }

      const response = await apiFetch(`/admin/bookings?${params.toString()}`, {
        method: "GET",
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current) return;

      setSummary(response.data?.summary || null);
      setEventHighlights(response.data?.eventHighlights || []);
      setBookings(response.data?.bookings || []);
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
      console.error("Error fetching promoter bookings:", err);
      setError(err.message || "Failed to fetch bookings");
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
        debounceRef.current = setTimeout(() => fetchBookings(1), DEBOUNCE_MS);
        return;
      }

      fetchBookings(1);
    },
    [fetchBookings]
  );

  const changePage = useCallback(
    (pageNum) => {
      fetchBookings(pageNum);
    },
    [fetchBookings]
  );

  const refresh = useCallback(() => {
    fetchBookings(pagination.page || 1);
  }, [fetchBookings, pagination.page]);

  useEffect(() => {
    fetchBookings(1);

    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchBookings]);

  const statistics = useMemo(
    () => ({
      totalBookedAmount: bookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0),
      totalTickets: bookings.reduce((sum, booking) => sum + Number(booking.tickets || 0), 0),
    }),
    [bookings]
  );

  return {
    summary,
    eventHighlights,
    bookings,
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
