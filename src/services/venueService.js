import { apiFetch } from "@/config/api";
export const venueRequest = async (path, method = "GET", body, token, options = {}) => {
  const result = await apiFetch(`/api/${path}`, {
    ...options,
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(token ? { headers: { "x-venue-token": token } } : {}),
  });
  return result.data;
};
export const venuePath = (venue) =>
  `/venues/${venue.organizer.slug}/${venue.slug}`;
export const venueMoney = (paise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
export const venueToday = () =>
  new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
export const venueDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
