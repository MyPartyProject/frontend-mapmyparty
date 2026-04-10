import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiFetch } from '@/config/api';

const DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;

export const usePromoterEvents = (initialFilters = {}) => {
  const [events, setEvents] = useState([]);
  const [isFetching, setIsFetching] = useState(false); // subtle indicator, NOT a full blocker
  const [initialLoading, setInitialLoading] = useState(true); // only true until first response
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Use refs for filters/page to break the useCallback dependency chains
  const filtersRef = useRef({
    eventStatus: initialFilters.eventStatus || 'ALL',
    publishStatus: initialFilters.publishStatus || 'ALL',
    search: initialFilters.search || '',
    organizerId: initialFilters.organizerId || null,
  });
  const [filters, setFilters] = useState(filtersRef.current);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0); // monotonic counter to detect stale responses

  // Core fetch — reads from refs, cancels previous in-flight request
  const fetchEvents = useCallback(async (pageNum = 1) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const id = ++requestIdRef.current;
    const currentFilters = filtersRef.current;

    setIsFetching(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', pageNum);
      params.set('limit', '12');

      if (currentFilters.eventStatus && currentFilters.eventStatus !== 'ALL') {
        params.set('status', currentFilters.eventStatus);
      }
      if (currentFilters.publishStatus && currentFilters.publishStatus !== 'ALL') {
        params.set('publishStatus', currentFilters.publishStatus);
      }
      if (currentFilters.search && currentFilters.search.length >= MIN_SEARCH_LENGTH) {
        params.set('search', currentFilters.search);
      }
      if (currentFilters.organizerId) {
        params.set('organizerId', currentFilters.organizerId);
      }

      const response = await apiFetch(`/admin/events?${params}`, {
        method: 'GET',
        signal: controller.signal,
      });

      // Discard if a newer request has been fired while this one was in-flight
      if (id !== requestIdRef.current) return;

      if (response.data) {
        setEvents(response.data.events || []);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      if (err.name === 'AbortError' || id !== requestIdRef.current) return;
      console.error('Error fetching promoter events:', err);
      setError(err.message || 'Failed to fetch events');
    } finally {
      if (id === requestIdRef.current) {
        setIsFetching(false);
        setInitialLoading(false);
      }
    }
  }, []); // no dependencies — reads from refs

  // Update filters — debounces search, fires immediately for everything else
  const updateFilters = useCallback((newFilters) => {
    const merged = { ...filtersRef.current, ...newFilters };
    filtersRef.current = merged;
    setFilters(merged);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (newFilters.search !== undefined) {
      // Skip API call if search is too short (but not empty — empty = clear search)
      if (merged.search.length > 0 && merged.search.length < MIN_SEARCH_LENGTH) return;

      debounceRef.current = setTimeout(() => fetchEvents(1), DEBOUNCE_MS);
    } else {
      fetchEvents(1);
    }
  }, [fetchEvents]);

  const changePage = useCallback((pageNum) => {
    fetchEvents(pageNum);
  }, [fetchEvents]);

  const clearFilters = useCallback(() => {
    const cleared = { eventStatus: 'ALL', publishStatus: 'ALL', search: '', organizerId: null };
    filtersRef.current = cleared;
    setFilters(cleared);
    fetchEvents(1);
  }, [fetchEvents]);

  const refresh = useCallback(() => {
    fetchEvents(pagination.page);
  }, [fetchEvents, pagination.page]);

  // Fetch on mount
  useEffect(() => {
    fetchEvents(1);
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchEvents]);

  const statistics = useMemo(() => ({
    totalTickets: events.reduce(
      (sum, event) => sum + event.tickets.reduce((s, t) => s + t.soldQty, 0), 0
    ),
    totalBookings: events.reduce((sum, event) => sum + event._count.bookings, 0),
  }), [events]);

  return {
    events,
    loading: initialLoading, // true only until first data arrives
    isFetching,              // true during any request (for subtle indicator)
    error,
    pagination,
    filters,
    updateFilters,
    changePage,
    clearFilters,
    refresh,
    statistics,
  };
};
