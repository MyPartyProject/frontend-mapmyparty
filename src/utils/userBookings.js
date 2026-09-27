export async function loadAllBookings(apiFetch, signal) {
  const items = [];
  let page = 1;
  let totalPages = 1;
  do {
    signal.throwIfAborted();
    const response = await apiFetch(`/api/user/bookings?page=${page}&limit=100`, {
      method: "GET", cache: "no-store", signal,
    });
    signal.throwIfAborted();
    if (!response?.success || !Array.isArray(response?.data?.items)) {
      throw new Error("Failed to load your bookings.");
    }
    items.push(...response.data.items);
    totalPages = response.data.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return items;
}

export function getUpcomingBookings(bookings, now = Date.now()) {
  return bookings
    .filter((booking) => booking.status === "confirmed" && booking.eventDate && new Date(booking.eventDate).getTime() > now)
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
}
