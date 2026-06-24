import { io } from "socket.io-client";
import { API_BASE_URL, apiFetch } from "@/config/api";

// Get the server URL (without /api suffix)
const getServerUrl = () => {
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return baseUrl;
};

let ticketAnalyticsSocket = null;

/**
 * Fetch socket token from the server (uses cookie auth)
 * @returns {Promise<string|null>} - The socket token or null if failed
 */
export const fetchSocketToken = async () => {
  try {
    const response = await apiFetch("auth/socket-token");
    console.log("[socket-token] Fetched token successfully");
    return response.token || null;
  } catch (error) {
    console.error("[socket-token] Failed to fetch token:", error.message);
    return null;
  }
};

/**
 * Connect to the ticket-analytics namespace for real-time ticket updates
 * @param {string} authToken - JWT token for authentication
 * @returns {Socket} - Socket.io socket instance
 */
export const connectTicketAnalytics = (authToken) => {
  // If socket exists and is connected, reuse it
  if (ticketAnalyticsSocket?.connected) {
    console.log("[ticket-analytics] Already connected, reusing socket");
    return ticketAnalyticsSocket;
  }

  // If socket exists but not connected, clean it up first
  if (ticketAnalyticsSocket) {
    console.log("[ticket-analytics] Cleaning up existing disconnected socket");
    ticketAnalyticsSocket.removeAllListeners();
    ticketAnalyticsSocket.disconnect();
    ticketAnalyticsSocket = null;
  }

  const serverUrl = getServerUrl();
  console.log("[ticket-analytics] Connecting to:", `${serverUrl}/ticket-analytics`);
  console.log("[ticket-analytics] Auth token provided:", authToken ? `${authToken.substring(0, 20)}...` : "NONE");
  console.log("[ticket-analytics] Full token length:", authToken ? authToken.length : 0);

  // Build connection options - use cookies (withCredentials) as primary auth
  // Fall back to token if provided
  const connectionOptions = {
    // WebSocket-only avoids sticky-session requirements across API replicas.
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    withCredentials: true, // Send cookies with the connection
  };

  // If token is explicitly provided, include it in auth
  if (authToken) {
    connectionOptions.auth = { token: authToken };
  }

  ticketAnalyticsSocket = io(`${serverUrl}/ticket-analytics`, connectionOptions);

  ticketAnalyticsSocket.on("connect", () => {
    console.log("[ticket-analytics] Connected to server, socket id:", ticketAnalyticsSocket.id);
  });

  ticketAnalyticsSocket.on("connect_error", (err) => {
    console.error("[ticket-analytics] Connection error:", err.message);
    console.error("[ticket-analytics] Full error:", err);
  });

  ticketAnalyticsSocket.on("disconnect", (reason) => {
    console.log("[ticket-analytics] Disconnected:", reason);
  });

  return ticketAnalyticsSocket;
};

/**
 * Get the current ticket analytics socket instance
 * @returns {Socket|null}
 */
export const getTicketAnalyticsSocket = () => ticketAnalyticsSocket;

/**
 * Disconnect from ticket analytics
 */
export const disconnectTicketAnalytics = () => {
  if (ticketAnalyticsSocket) {
    ticketAnalyticsSocket.disconnect();
    ticketAnalyticsSocket = null;
  }
};

/**
 * Join an event room to receive real-time ticket updates
 * @param {string} eventId - The event ID to join
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const joinEventRoom = (eventId) => {
  return new Promise((resolve) => {
    console.log("[ticket-analytics] joinEventRoom called with eventId:", eventId);

    if (!ticketAnalyticsSocket?.connected) {
      console.error("[ticket-analytics] joinEventRoom failed: Socket not connected");
      resolve({ error: "Socket not connected" });
      return;
    }

    console.log("[ticket-analytics] Emitting join_event for eventId:", eventId);
    ticketAnalyticsSocket.emit("join_event", { eventId }, (response) => {
      console.log("[ticket-analytics] join_event response:", response);
      resolve(response);
    });
  });
};

/**
 * Leave an event room
 * @param {string} eventId - The event ID to leave
 * @returns {Promise<{success: boolean}>}
 */
export const leaveEventRoom = (eventId) => {
  return new Promise((resolve) => {
    if (!ticketAnalyticsSocket?.connected) {
      resolve({ success: false });
      return;
    }

    ticketAnalyticsSocket.emit("leave_event", { eventId }, (response) => {
      resolve(response);
    });
  });
};
