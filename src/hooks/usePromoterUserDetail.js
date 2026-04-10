import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/config/api";

const PAGE_LIMIT = 10;

export const usePromoterUserDetail = (userId) => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const abortRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchUserDetails = useCallback(
    async (pageNum = 1) => {
      if (!userId) {
        setUser(null);
        setBookings([]);
        setLoading(false);
        return;
      }

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const requestId = ++requestIdRef.current;

      setIsFetching(true);
      setError(null);
      setNotFound(false);

      try {
        const params = new URLSearchParams();
        params.set("page", pageNum);
        params.set("limit", PAGE_LIMIT);

        const response = await apiFetch(`/admin/users/${userId}?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
        });

        if (requestId !== requestIdRef.current) return;

        setUser(response.data?.user || null);
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
        if (err.status === 404) {
          setNotFound(true);
          setUser(null);
          setBookings([]);
        } else {
          console.error("Error fetching promoter user details:", err);
          setError(err.message || "Failed to fetch user details");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsFetching(false);
          setLoading(false);
        }
      }
    },
    [userId]
  );

  const changePage = useCallback(
    (pageNum) => {
      fetchUserDetails(pageNum);
    },
    [fetchUserDetails]
  );

  const refresh = useCallback(() => {
    fetchUserDetails(pagination.page || 1);
  }, [fetchUserDetails, pagination.page]);

  useEffect(() => {
    setLoading(true);
    fetchUserDetails(1);

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchUserDetails]);

  return {
    user,
    bookings,
    loading,
    isFetching,
    error,
    notFound,
    pagination,
    changePage,
    refresh,
  };
};
