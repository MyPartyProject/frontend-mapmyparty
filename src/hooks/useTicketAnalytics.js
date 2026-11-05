import { useState, useEffect, useCallback, useRef } from "react";
import {
  connectTicketAnalytics,
  getTicketAnalyticsSocket,
  disconnectTicketAnalytics,
  joinEventRoom,
  leaveEventRoom,
  fetchSocketToken,
} from "@/services/socketService";

/**
 * Hook for real-time ticket, check-in, and food/beverage analytics updates
 * @param {string} eventId - The event ID to subscribe to
 * @param {string} authToken - JWT token for authentication (optional, will try to get from sessionStorage)
 * @returns {{ tickets: Array, checkIns: Object, addOns: Array, connected: boolean, error: string|null, refetch: Function }}
 */
export const useTicketAnalytics = (eventId, authToken = null) => {
  const [tickets, setTickets] = useState(null);
  const [checkIns, setCheckIns] = useState(null);
  const [addOns, setAddOns] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const eventIdRef = useRef(eventId);

  // Get auth token from sessionStorage if not provided
  const getAuthToken = useCallback(() => {
    if (authToken) return authToken;
    return sessionStorage.getItem("authToken") || sessionStorage.getItem("accessToken");
  }, [authToken]);

  // Manual refetch by re-joining the event room
  const refetch = useCallback(async () => {
    const socket = getTicketAnalyticsSocket();
    if (socket?.connected && eventIdRef.current) {
      const response = await joinEventRoom(eventIdRef.current);
      if (response.error) {
        setError(response.error);
      }
    }
  }, []);

  useEffect(() => {
    eventIdRef.current = eventId;
    setConnected(false);
    setError(null);
    setAddOns([]);
    setCheckIns(null);
    setTickets(null);

    if (!eventId) {
      return;
    }

    let isCancelled = false;
    let cleanupFn = null;

    const initSocket = async () => {
      // First try to get token from storage
      let token = getAuthToken();

      // If no token in storage, fetch from server (uses cookies)
      if (!token) {
        token = await fetchSocketToken();
      }

      if (isCancelled) return;

      if (!token) {
        console.error("[useTicketAnalytics] No token available for socket auth");
        setError("Authentication required for real-time updates");
        return;
      }

      // Connect to socket with the token
      console.log("[useTicketAnalytics] Connecting to socket for eventId:", eventId);
      const socket = connectTicketAnalytics(token);
      socketRef.current = socket;

      let joining = false;
      const handleConnect = async () => {
        if (joining) return;
        joining = true;
        if (isCancelled) { joining = false; return; }
        console.log("[useTicketAnalytics] Socket connected, joining event room:", eventId);
        setConnected(false);
        setError(null);

        // Join the event room
        const response = await joinEventRoom(eventId);
        joining = false;
        console.log("[useTicketAnalytics] joinEventRoom response:", response);
        if (isCancelled) return;
        setConnected(Boolean(response.success));
        if (response.error) {
          console.error("[useTicketAnalytics] Failed to join room:", response.error);
          setError(response.error);
        }
      };

      const handleDisconnect = () => {
        setCheckIns(null);
        setTickets(null);
        setError("Realtime connection lost; refreshing periodically");
        setConnected(false);
      };

      const handleConnectError = (err) => {
        setError(err.message);
        setConnected(false);
      };

      const latest = {};
      const accepts = (kind, data) => {
        if (isCancelled || data.eventId !== eventId) return false;
        const time = Date.parse(data.timestamp);
        if (Number.isFinite(time) && time < (latest[kind] || 0)) return false;
        if (Number.isFinite(time)) latest[kind] = time;
        return true;
      };
      // Handle initial ticket stats
      const handleTicketStats = (data) => {
        console.log("[useTicketAnalytics] Received ticket_stats:", data);
        if (accepts('tickets', data)) {
          console.log("[useTicketAnalytics] Updating tickets state");
          setTickets(data.tickets || []);
          setError(null);
        }
      };

      // Handle real-time ticket updates
      const handleTicketUpdate = (data) => {
        console.log("[useTicketAnalytics] Received ticket_update:", data);
        if (accepts('tickets', data)) {
          console.log("[useTicketAnalytics] Updating tickets state");
          setTickets(data.tickets || []);
        }
      };

      // Handle initial check-in stats
      const handleCheckInStats = (data) => {
        console.log("[useTicketAnalytics] Received checkin_stats:", data);
        if (accepts('checkIns', data)) {
          setCheckIns(data.checkIns ?? null);
        }
      };

      // Handle real-time check-in updates
      const handleCheckInUpdate = (data) => {
        console.log("[useTicketAnalytics] Received checkin_update:", data);
        if (accepts('checkIns', data)) {
          setCheckIns(data.checkIns ?? null);
        }
      };

      // Handle initial add-ons stats
      const handleAddOnsStats = (data) => {
        console.log("[useTicketAnalytics] Received addons_stats:", data);
        if (accepts('addOns', data)) {
          setAddOns(data.addOns || []);
        }
      };

      // Handle real-time add-ons updates
      const handleAddOnsUpdate = (data) => {
        console.log("[useTicketAnalytics] Received addons_update:", data);
        if (accepts('addOns', data)) {
          setAddOns(data.addOns || []);
        }
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.on("ticket_stats", handleTicketStats);
      socket.on("ticket_update", handleTicketUpdate);
      socket.on("checkin_stats", handleCheckInStats);
      socket.on("checkin_update", handleCheckInUpdate);
      socket.on("addons_stats", handleAddOnsStats);
      socket.on("addons_update", handleAddOnsUpdate);

      // If already connected, join immediately
      if (socket.connected) {
        handleConnect();
      }

      const reconcile = () => { if (!document.hidden) { if (socket.connected) handleConnect(); else socket.connect(); } };
      const timer = setInterval(reconcile, 30000);
      window.addEventListener('focus', reconcile);
      // Store cleanup function
      cleanupFn = () => {
        clearInterval(timer);
        window.removeEventListener('focus', reconcile);
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error", handleConnectError);
        socket.off("ticket_stats", handleTicketStats);
        socket.off("ticket_update", handleTicketUpdate);
        socket.off("checkin_stats", handleCheckInStats);
        socket.off("checkin_update", handleCheckInUpdate);
        socket.off("addons_stats", handleAddOnsStats);
        socket.off("addons_update", handleAddOnsUpdate);

        if (eventId) {
          leaveEventRoom(eventId);
        }
        disconnectTicketAnalytics();
      };
    };

    initSocket();

    // Cleanup
    return () => {
      isCancelled = true;
      if (cleanupFn) cleanupFn();
    };
  }, [eventId, getAuthToken]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      // The shared transport also serves metadata subscribers.
    };
  }, []);

  return { tickets, checkIns, addOns, connected, error, refetch };
};

export default useTicketAnalytics;
