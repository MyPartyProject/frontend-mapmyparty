//  import { useParams, useNavigate } from "react-router-dom";
// import { useState, useEffect, useMemo, useCallback } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { ChevronLeft, Loader2, Calendar, MapPin, Plus, Minus, ShoppingCart, Download } from "lucide-react";
// import FloatingCTA from "@/components/event-detail/FloatingCTA";
// import ClassicDetailTemplate from "@/components/EventDetailTemplates/ClassicDetailTemplate";
// import ModernSplitTemplate from "@/components/EventDetailTemplates/ModernSplitTemplate";
// import MinimalistSingleColumnTemplate from "@/components/EventDetailTemplates/MinimalistSingleColumnTemplate";
// import { getTemplateConfig, mapTemplateId } from "@/config/templates";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { toast } from "sonner";
// import { apiFetch } from "@/config/api";
// import { isAuthenticated } from "@/utils/auth";

// const FALLBACK_IMAGE = "https://via.placeholder.com/1200x600?text=Event";

// const getStoredBookingDetails = () => ({
//   name: sessionStorage.getItem("userName") || "",
//   email: sessionStorage.getItem("userEmail") || "",
//   phone: sessionStorage.getItem("userPhone") || "",
//   address: sessionStorage.getItem("userAddress") || "",
//   city: sessionStorage.getItem("userCity") || sessionStorage.getItem("userDistrict") || "",
//   addressLine2: sessionStorage.getItem("userAddressLine2") || "",
//   state: sessionStorage.getItem("userState") || "",
//   pincode: sessionStorage.getItem("userPincode") || "",
// });

// const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
//   style: "currency",
//   currency: "INR",
//   minimumFractionDigits: 0,
//   maximumFractionDigits: 2,
// });

// const formatCurrencyValue = (amount) => {
//   const numericValue = Number(amount);
//   if (!Number.isFinite(numericValue)) {
//     return INR_FORMATTER.format(0);
//   }
//   return INR_FORMATTER.format(numericValue);
// };

// const prettifyLabel = (key) =>
//   String(key || "")
//     .replace(/_/g, " ")
//     .replace(/([a-z])([A-Z])/g, "$1 $2")
//     .split(" ")
//     .filter(Boolean)
//     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(" ");

// const getFirstFiniteNumber = (...values) => {
//   for (const value of values) {
//     if (value === null || value === undefined) continue;
//     const numeric = Number(value);
//     if (Number.isFinite(numeric)) {
//       return numeric;
//     }
//   }
//   return undefined;
// };

// const normalizeTicketData = (ticket) => {
//   if (!ticket) {
//     return null;
//   }

//   const rawId =
//     ticket.id ||
//     ticket.ticketId ||
//     ticket._id ||
//     ticket.uuid ||
//     ticket.slug ||
//     (ticket.name ? `${ticket.name}-${ticket.price ?? ""}` : null);

//   const normalizedId =
//     rawId ||
//     (typeof crypto !== "undefined" && crypto.randomUUID
//       ? crypto.randomUUID()
//       : `ticket-${Math.random().toString(36).slice(2, 9)}`);

//   const name = ticket.name || ticket.title || ticket.ticketName || "Ticket";
//   const description = ticket.description || ticket.details || "";
//   const priceRaw = ticket.price ?? ticket.amount ?? ticket.cost ?? 0;
//   const price = Number(priceRaw);

//   const totalQuantity = getFirstFiniteNumber(
//     ticket.totalQty,
//     ticket.totalQuantity,
//     ticket.totalTickets,
//     ticket.capacity,
//     ticket.maxCapacity,
//     ticket.quota,
//     ticket.limit,
//     ticket.quantity
//   );

//   const soldQuantity = getFirstFiniteNumber(
//     ticket.soldQty,
//     ticket.soldQuantity,
//     ticket.bookedQty,
//     ticket.bookedQuantity,
//     ticket.reservedQty,
//     ticket.reservedQuantity,
//     ticket.ticketsSold
//   );

//   let available = getFirstFiniteNumber(
//     ticket.availableQty,
//     ticket.availableQuantity,
//     ticket.quantityAvailable,
//     ticket.remainingQty,
//     ticket.remainingQuantity,
//     ticket.ticketsAvailable,
//     ticket.ticketsRemaining,
//     ticket.availableTickets,
//     ticket.availableSeats,
//     ticket.remainingTickets,
//     ticket.seatsRemaining,
//     ticket.inventory,
//     ticket.stock,
//     ticket.slots
//   );

//   if (!Number.isFinite(available) && Number.isFinite(totalQuantity)) {
//     const remaining = Number.isFinite(soldQuantity)
//       ? totalQuantity - soldQuantity
//       : totalQuantity;
//     available = remaining;
//   }

//   if (!Number.isFinite(available)) {
//     const numericAvailable = Number(ticket.available);
//     if (Number.isFinite(numericAvailable)) {
//       available = numericAvailable;
//     }
//   }

//   if (!Number.isFinite(available) && typeof ticket.available === "boolean") {
//     const fallbackCapacity = getFirstFiniteNumber(
//       ticket.capacity,
//       ticket.quantity,
//       ticket.maxCapacity,
//       ticket.totalTickets
//     );
//     available = ticket.available ? fallbackCapacity ?? 1 : 0;
//   }

//   if (!Number.isFinite(available)) {
//     available = 0;
//   }

//   available = Math.max(0, available);

//   const maxPerOrderRaw =
//     ticket.maxPerOrder ??
//     ticket.maxPerUser ??
//     ticket.perUserLimit ??
//     ticket.limit ??
//     ticket.maxTickets ??
//     null;
//   const maxPerOrder =
//     maxPerOrderRaw === null || maxPerOrderRaw === undefined
//       ? null
//       : Math.max(0, Number(maxPerOrderRaw));

//   const comingSoon = Boolean(ticket.comingSoon);
//   const soldOutExplicit =
//     (typeof ticket.soldOut === "string"
//       ? ticket.soldOut.toLowerCase() === "true"
//       : ticket.soldOut) ??
//     ticket.isSoldOut ??
//     (typeof ticket.status === "string" && ticket.status.toLowerCase() === "sold_out");

//   let soldOut = false;
//   if (!comingSoon) {
//     if (soldOutExplicit === true) {
//       soldOut = true;
//     } else if (soldOutExplicit !== false && available <= 0) {
//       soldOut = true;
//     }
//   }
//   const category = ticket.category || ticket.type || "Ticket";

//   return {
//     id: String(normalizedId),
//     name,
//     description,
//     price: Number.isFinite(price) ? price : 0,
//     available,
//     maxPerOrder,
//     soldOut,
//     comingSoon,
//     category,
//     raw: ticket,
//   };
// };

// const transformTicketList = (tickets = []) => {
//   const seenIds = new Set();
//   const normalized = [];

//   tickets.forEach((ticket) => {
//     const normalizedTicket = normalizeTicketData(ticket);
//     if (normalizedTicket && !seenIds.has(normalizedTicket.id)) {
//       seenIds.add(normalizedTicket.id);
//       normalized.push(normalizedTicket);
//     }
//   });

//   return normalized;
// };

// const EventDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const userIsAuthenticated = isAuthenticated();
//   const [event, setEvent] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
//   const [bulkStep, setBulkStep] = useState("select");
//   const [bulkSelections, setBulkSelections] = useState({});
//   const defaultBookingDetails = useMemo(
//     () =>
//       userIsAuthenticated
//         ? getStoredBookingDetails()
//         : {
//             name: "",
//             email: "",
//             phone: "",
//             address: "",
//             city: "",
//             addressLine2: "",
//             state: "",
//             pincode: "",
//           },
//     [userIsAuthenticated]
//   );
//   const [bulkDetails, setBulkDetails] = useState(defaultBookingDetails);
//   const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
//   const [bookingTickets, setBookingTickets] = useState([]);
//   const [bookingTicketsLoading, setBookingTicketsLoading] = useState(false);
//   const [bookingTicketsError, setBookingTicketsError] = useState(null);
//   const [bookingResponse, setBookingResponse] = useState(null);

//   const eventTickets = useMemo(
//     () => transformTicketList(event?.tickets || []),
//     [event]
//   );

//   const ticketDisplayList = useMemo(
//     () => (bookingTickets.length > 0 ? bookingTickets : eventTickets),
//     [bookingTickets, eventTickets]
//   );

//   const priceRange =
//     ticketDisplayList.length > 0
//       ? (() => {
//           const activePrices = ticketDisplayList
//             .filter((t) => !t.soldOut && !t.comingSoon)
//             .map((t) => t.price ?? 0);
//           const fallbackPrices = ticketDisplayList.map((t) => t.price ?? 0);
//           const priceCollection = activePrices.length > 0 ? activePrices : fallbackPrices;
//           const numericPrices = priceCollection
//             .map((value) => Number(value))
//             .filter((value) => Number.isFinite(value));

//           if (!numericPrices.length) {
//             return "Free";
//           }

//           const minPrice = Math.min(...numericPrices);
//           const maxPrice = Math.max(...numericPrices);

//           if (minPrice === maxPrice) {
//             return formatCurrencyValue(minPrice);
//           }

//           return `${formatCurrencyValue(minPrice)} - ${formatCurrencyValue(maxPrice)}`;
//         })()
//       : "Free";

//   const availableTickets = useMemo(
//     () =>
//       ticketDisplayList.filter(
//         (ticket) =>
//           !ticket.comingSoon &&
//           !ticket.soldOut &&
//           (Number.isFinite(ticket.available) ? ticket.available > 0 : true)
//       ),
//     [ticketDisplayList]
//   );
//   const hasPurchasableTickets = availableTickets.length > 0;
//   const hasTicketData = ticketDisplayList.length > 0;

//   const selectionList = useMemo(
//     () =>
//       availableTickets.map((ticket) => ({
//         ticket,
//         quantity: bulkSelections[ticket.id] || 0,
//       })),
//     [availableTickets, bulkSelections]
//   );

//   const totalSelectedTickets = useMemo(
//     () => selectionList.reduce((sum, item) => sum + item.quantity, 0),
//     [selectionList]
//   );

//   const baseAmount = useMemo(
//     () =>
//       selectionList.reduce(
//         (sum, item) => sum + item.quantity * (item.ticket.price || 0),
//         0
//       ),
//     [selectionList]
//   );

//   const convenienceFee = useMemo(() => baseAmount * 0.2, [baseAmount]);
//   const igstOnConvenience = useMemo(() => convenienceFee * 0.09, [convenienceFee]);
//   const cgstOnConvenience = useMemo(() => convenienceFee * 0.09, [convenienceFee]);
//   const totalSelectedAmount = useMemo(
//     () => baseAmount + convenienceFee + igstOnConvenience + cgstOnConvenience,
//     [baseAmount, convenienceFee, igstOnConvenience, cgstOnConvenience]
//   );

//   const summaryItems = useMemo(
//     () => selectionList.filter((item) => item.quantity > 0),
//     [selectionList]
//   );

//   const confirmationItems = useMemo(() => {
//     const mapItems = (input) => {
//       if (!Array.isArray(input) || input.length === 0) return null;
//       return input.map((item, index) => {
//         const quantity =
//           Number(
//             item?.quantity ??
//               item?.qty ??
//               item?.count ??
//               item?.units ??
//               item?.tickets ??
//               item?.ticketQuantity
//           ) || 0;
//         const unitPrice =
//           Number(
//             item?.unitPrice ??
//               item?.price ??
//               item?.amount ??
//               item?.rate ??
//               item?.ticketPrice
//           ) || 0;
//         const total =
//           Number(
//             item?.totalPrice ??
//               item?.total ??
//               item?.lineTotal ??
//               item?.amountTotal ??
//               unitPrice * quantity
//           ) || unitPrice * quantity;

//         return {
//           id:
//             item?.ticketId ||
//             item?.id ||
//             item?.ticket?.id ||
//             item?.sku ||
//             `item-${index}`,
//           name: item?.ticketName || item?.name || item?.label || item?.ticket?.name || "Ticket",
//           quantity,
//           unitPrice,
//           total,
//         };
//       });
//     };

//     const candidateSources = [
//       bookingResponse?.items,
//       bookingResponse?.tickets,
//       bookingResponse?.orderItems,
//       bookingResponse?.lineItems,
//       bookingResponse?.data?.items,
//     ];

//     for (const source of candidateSources) {
//       const mapped = mapItems(source);
//       if (mapped && mapped.length > 0) {
//         return mapped;
//       }
//     }

//     if (summaryItems.length > 0) {
//       return summaryItems.map((item) => ({
//         id: item.ticket.id,
//         name: item.ticket.name,
//         quantity: item.quantity,
//         unitPrice: item.ticket.price || 0,
//         total: (item.ticket.price || 0) * item.quantity,
//       }));
//     }

//     return [];
//   }, [bookingResponse, summaryItems]);

//   const bookingTotalsEntries = useMemo(() => {
//     if (!bookingResponse || typeof bookingResponse !== "object") {
//       return [];
//     }

//     const totalsSource =
//       bookingResponse.totals ||
//       bookingResponse.summary ||
//       bookingResponse.pricing ||
//       bookingResponse.priceBreakdown ||
//       null;

//     if (!totalsSource || typeof totalsSource !== "object") {
//       return [];
//     }

//     const entries = [];
//     const seen = new Set();

//     const addEntry = (label, value) => {
//       const numeric = Number(value);
//       if (!Number.isFinite(numeric)) return;
//       const key = label.toLowerCase();
//       if (seen.has(key)) return;
//       seen.add(key);
//       entries.push({
//         label: prettifyLabel(label),
//         value: numeric,
//       });
//     };

//     const traverse = (obj, parentLabel = "") => {
//       Object.entries(obj).forEach(([key, value]) => {
//         const label = parentLabel ? `${parentLabel} ${prettifyLabel(key)}` : prettifyLabel(key);
//         if (value && typeof value === "object" && !Array.isArray(value)) {
//           traverse(value, label);
//         } else {
//           addEntry(label, value);
//         }
//       });
//     };

//     traverse(totalsSource);

//     return entries;
//   }, [bookingResponse]);

//   const bookingGrandTotal = useMemo(
//     () =>
//       getFirstFiniteNumber(
//         bookingResponse?.totals?.grandTotal,
//         bookingResponse?.totals?.totalPayable,
//         bookingResponse?.totals?.payableAmount,
//         bookingResponse?.totals?.totalAmount,
//         bookingResponse?.grandTotal,
//         bookingResponse?.totalPayable,
//         bookingResponse?.totalAmount,
//         bookingResponse?.amount,
//         totalSelectedAmount
//       ),
//     [bookingResponse, totalSelectedAmount]
//   );

//   const bookingId =
//     bookingResponse?.bookingId ||
//     bookingResponse?.id ||
//     bookingResponse?.reservationId ||
//     bookingResponse?.referenceId ||
//     bookingResponse?.data?.bookingId ||
//     null;

//   const bookingStatus =
//     bookingResponse?.status ||
//     bookingResponse?.bookingStatus ||
//     bookingResponse?.currentStatus ||
//     null;

//   const handleBulkQuantityChange = useCallback(
//     (ticketId, nextQty, max) => {
//       setBulkSelections((prev) => {
//         const allowed = typeof max === "number" ? Math.min(nextQty, max) : nextQty;
//         return {
//           ...prev,
//           [ticketId]: Math.max(0, allowed),
//         };
//       });
//     },
//     [setBulkSelections]
//   );

//   const resetBulkFlow = useCallback(() => {
//     setBulkStep("select");
//     setBulkSelections({});
//     setBulkDetails(defaultBookingDetails);
//     setBookingResponse(null);
//     setIsBulkSubmitting(false);
//   }, [defaultBookingDetails]);

//   const handleBulkModalChange = useCallback(
//     (open) => {
//       setIsBulkModalOpen(open);
//       if (!open) {
//         resetBulkFlow();
//       } else {
//         setBulkDetails(defaultBookingDetails);
//         setBookingResponse(null);
//         setBookingTicketsError(null);
//       }
//     },
//     [defaultBookingDetails, resetBulkFlow]
//   );

//   const handleBulkProceed = useCallback(() => {
//     if (totalSelectedTickets === 0) {
//       toast.error("Please choose at least one ticket to continue.");
//       return;
//     }
//     setBulkStep("checkout");
//   }, [totalSelectedTickets]);

//   const handleBulkBack = useCallback(() => {
//     setBulkStep("select");
//   }, []);

//   const handleBulkSubmit = useCallback(
//     async () => {
//       if (isBulkSubmitting) {
//         return;
//       }
//       if (totalSelectedTickets === 0) {
//         toast.error("No tickets selected.");
//         return;
//       }

//       const trimmedName = (bulkDetails.name || defaultBookingDetails.name || "").trim();
//       const trimmedEmail = (bulkDetails.email || defaultBookingDetails.email || "").trim();
//       const trimmedPhone = (bulkDetails.phone || defaultBookingDetails.phone || "").trim();
//       const trimmedAddress = (bulkDetails.address || defaultBookingDetails.address || "").trim();
//       const trimmedCity = (bulkDetails.city || defaultBookingDetails.city || "").trim();
//       const trimmedAddressLine2 = (
//         bulkDetails.addressLine2 ||
//         defaultBookingDetails.addressLine2 ||
//         ""
//       ).trim();
//       const trimmedState = (bulkDetails.state || defaultBookingDetails.state || "").trim();
//       const trimmedPincode = (bulkDetails.pincode || defaultBookingDetails.pincode || "").trim();

//       if (!trimmedName) {
//         toast.error("Please enter your full name.");
//         return;
//       }
//       if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
//         toast.error("Please enter a valid email address.");
//         return;
//       }
//       if (!trimmedPhone || trimmedPhone.length < 6) {
//         toast.error("Please enter a valid phone number.");
//         return;
//       }
//       if (!trimmedAddress) {
//         toast.error("Please enter your address.");
//         return;
//       }
//       if (!trimmedCity) {
//         toast.error("Please enter your city.");
//         return;
//       }
//       if (!trimmedState) {
//         toast.error("Please enter your state.");
//         return;
//       }
//       if (!trimmedPincode || trimmedPincode.length < 4) {
//         toast.error("Please enter a valid pincode.");
//         return;
//       }

//       const itemsToBook = selectionList.filter((item) => item.quantity > 0);
//       if (itemsToBook.length === 0) {
//         toast.error("Please select at least one ticket.");
//         return;
//       }

//       const payload = {
//         eventId: event?.id || id,
//         tickets: itemsToBook.map((item) => ({
//           ticketId: item.ticket.id,
//           quantity: Math.min(Math.max(item.quantity, 1), 100),
//         })),
//         userDetails: {
//           fullName: trimmedName,
//           email: trimmedEmail,
//           phone: trimmedPhone,
//           addressLine1: trimmedAddress,
//           addressLine2: trimmedAddressLine2,
//           state: trimmedState,
//           city: trimmedCity,
//           pincode: trimmedPincode,
//         },
//       };

//       setIsBulkSubmitting(true);
//       setBookingResponse(null);
//       try {
//         const response = await apiFetch("api/booking", {
//           method: "POST",
//           headers: {

//           },
//           body: JSON.stringify(payload),
//         });

//         const responseData = response?.data || response?.booking || response;
//         const bookingData =
//           responseData?.booking ||
//           responseData?.data ||
//           responseData?.result ||
//           responseData;

//         if (!bookingData || typeof bookingData !== "object") {
//           throw new Error("Unexpected booking response from server.");
//         }

//         setBookingResponse(bookingData);
//         toast.success("Booking created! Complete payment to finalize your tickets.");
//         setBulkStep("success");
//       } catch (error) {
//         console.error("Booking creation failed:", error);
//         let message =
//           error?.data?.errorMessage ||
//           error?.data?.message ||
//           error?.message ||
//           "Failed to create booking. Please try again.";

//         const fieldErrors = error?.data?.errors;
//         if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
//           const firstError = fieldErrors[0];
//           if (typeof firstError === "string") {
//             message = firstError;
//           } else if (firstError?.message) {
//             message = firstError.message;
//           }
//         }

//         toast.error(message);
//       } finally {
//         setIsBulkSubmitting(false);
//       }
//     },
//     [
//       bulkDetails.address,
//       bulkDetails.addressLine2,
//       bulkDetails.city,
//       bulkDetails.email,
//       bulkDetails.name,
//       bulkDetails.phone,
//       bulkDetails.pincode,
//       bulkDetails.state,
//       defaultBookingDetails.address,
//       defaultBookingDetails.addressLine2,
//       defaultBookingDetails.city,
//       defaultBookingDetails.email,
//       defaultBookingDetails.name,
//       defaultBookingDetails.phone,
//       defaultBookingDetails.pincode,
//       defaultBookingDetails.state,
//       event?.id,
//       id,
//       isBulkSubmitting,
//       selectionList,
//       totalSelectedTickets,
//     ]
//   );
  
//   // Fetch event data
//   useEffect(() => {
//     const fetchEventData = async () => {
//       try {
//         setLoading(true);
//         let foundEvent = null;
        
//         // Always try to fetch from API first for fresh data
//         console.log(`🔍 Fetching event ${id} from API...`);
//         try {
//           const response = await apiFetch(`/api/event/${id}`, {
//             method: "GET",
//           });
          
//           console.log("📅 Fetched event from API:", response);
          
//           // Handle different response structures
//           foundEvent = response.data?.event || response.data || response.event || response;
          
//           // If we got the event from API, cache it to localStorage
//           if (foundEvent && foundEvent.id) {
//             const STORAGE_KEY = "mapMyParty_events";
//             const stored = localStorage.getItem(STORAGE_KEY);
//             const events = stored ? JSON.parse(stored) : [];
            
//             const existingIndex = events.findIndex(e => e.id === foundEvent.id || e.eventId === foundEvent.id);
//             if (existingIndex >= 0) {
//               events[existingIndex] = foundEvent;
//             } else {
//               events.push(foundEvent);
//             }
            
//             localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
//             console.log("💾 Saved/Updated event in localStorage");
//           }
//         } catch (apiError) {
//           console.error("❌ Error fetching from API:", apiError);
          
//           // Fallback to cached events only (no dummy)
//           const STORAGE_KEY = "mapMyParty_events";
//           const stored = localStorage.getItem(STORAGE_KEY);
//           const events = stored ? JSON.parse(stored) : [];
//           foundEvent = events.find(e => e.id === id || e.eventId === id);
          
//           if (foundEvent) {
//             console.log("✅ Found event in localStorage");
//           }
//         }
        
//         if (foundEvent) {
//           console.log("✅ Event loaded successfully:", {
//             id: foundEvent.id,
//             title: foundEvent.title || foundEvent.eventTitle,
//             category: foundEvent.category || foundEvent.mainCategory,
//             status: foundEvent.status2 || foundEvent.status,
//             template: foundEvent.template || "not set",
//             hasVenues: !!foundEvent.venues,
//             hasTickets: !!foundEvent.tickets,
//             hasStats: !!foundEvent.stats
//           });
//           setEvent(foundEvent);
//         } else {
//           // No dummy fallback
//           setEvent(null);
//         }
//       } catch (error) {
//         console.error("💥 Error fetching event:", error);
//         setEvent(null);
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchEventData();
//   }, [id]);

//   useEffect(() => {
//     if (!id) {
//       return;
//     }

//     let isCancelled = false;

//     const fetchBookingTickets = async () => {
//       try {
//         setBookingTicketsLoading(true);
//         setBookingTicketsError(null);

//         const response = await apiFetch(`api/booking/event/${id}/tickets`, {
//           method: "GET",
//           headers: {

//           },
//         });

//         const ticketPayload = response?.data?.tickets ?? response?.tickets ?? response?.data ?? [];
//         const rawTickets = Array.isArray(ticketPayload) ? ticketPayload : [];
//         const normalizedTickets = transformTicketList(rawTickets);

//         if (!isCancelled) {
//           setBookingTickets(normalizedTickets);
//         }
//       } catch (error) {
//         if (!isCancelled) {
//           console.error("Error fetching booking tickets:", error);
//           setBookingTicketsError(error);
//           setBookingTickets([]);
//         }
//       } finally {
//         if (!isCancelled) {
//           setBookingTicketsLoading(false);
//         }
//       }
//     };

//     fetchBookingTickets();

//     return () => {
//       isCancelled = true;
//     };
//   }, [id]);
  
//   // Format date and time from event data
//   const formatEventDate = (dateString) => {
//     if (!dateString) return "Date TBA";
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString("en-US", {
//         month: "long",
//         day: "numeric",
//         year: "numeric",
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   const formatEventTime = (startDate, endDate) => {
//     if (!startDate) return "Time TBA";
//     try {
//       const start = new Date(startDate);
//       const startTime = start.toLocaleTimeString("en-US", {
//         hour: "numeric",
//         minute: "2-digit",
//         hour12: true,
//       });
      
//       if (endDate) {
//         const end = new Date(endDate);
//         const endTime = end.toLocaleTimeString("en-US", {
//           hour: "numeric",
//           minute: "2-digit",
//           hour12: true,
//         });
//         return `${startTime} - ${endTime}`;
//       }
      
//       return startTime;
//     } catch {
//       return "Time TBA";
//     }
//   };

//   // Normalize questions data (API might return as "questions" or "customQuestions")
//   // MUST be called before any early returns to follow Rules of Hooks
//   const eventQuestions = useMemo(() => {
//     if (!event) return [];
//     // Check both field names
//     const questions = event.questions || event.customQuestions || [];
//     // Ensure it's an array
//     if (Array.isArray(questions)) {
//       return questions;
//     }
//     // If it's a JSON string, parse it
//     if (typeof questions === 'string') {
//       try {
//         return JSON.parse(questions);
//       } catch {
//         return [];
//       }
//     }
//     return [];
//   }, [event]);

//   // Normalize artists data (API might use different field names)
//   // MUST be called before any early returns to follow Rules of Hooks
//   const normalizedArtists = useMemo(() => {
//     if (!event || !event.artists) return [];
    
//     return event.artists.map(artist => {
//       // Handle Instagram - could be full URL or just handle
//       let instagram = artist.instagram || artist.instagramLink || artist.instagramHandle || "";
//       // If it's a full URL, extract the handle
//       if (instagram && instagram.includes('instagram.com/')) {
//         instagram = instagram.split('instagram.com/')[1]?.split('/')[0] || instagram;
//         if (!instagram.startsWith('@')) {
//           instagram = '@' + instagram;
//         }
//       } else if (instagram && !instagram.startsWith('@')) {
//         instagram = '@' + instagram;
//       }
      
//       return {
//         id: artist.id || artist._id,
//         name: artist.name || "",
//         // Handle photo/image field variations
//         photo: artist.photo || artist.image || artist.imageUrl || "",
//         // Normalized Instagram handle
//         instagram: instagram,
//         // Handle Spotify field variations (keep as full URL if provided)
//         spotify: artist.spotify || artist.spotifyLink || artist.spotifyUrl || "",
//         gender: artist.gender || "PREFER_NOT_TO_SAY",
//       };
//     }).filter(artist => artist.name); // Only include artists with names
//   }, [event]);

//   // Create event object with normalized data for templates
//   // MUST be called before any early returns to follow Rules of Hooks
//   const normalizedEvent = useMemo(() => {
//     if (!event) return null;
//     return {
//       ...event,
//       customQuestions: eventQuestions, // Use normalized questions
//       questions: eventQuestions, // Also set as questions for compatibility
//       artists: normalizedArtists, // Use normalized artists
//     };
//   }, [event, eventQuestions, normalizedArtists]);
  
//   // Show loading state
//   if (loading) {
//     return (
//       <div className="min-h-screen flex flex-col">
//         <main className="flex-1 flex items-center justify-center">
//           <div className="text-center">
//             <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
//             <p className="text-muted-foreground">Loading event details...</p>
//           </div>
//         </main>
//       </div>
//     );
//   }
  
//   // Show error if event not found
//   if (!event) {
//     return (
//       <div className="min-h-screen flex flex-col">
//         <main className="flex-1 flex items-center justify-center">
//           <div className="text-center">
//             <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
//             <p className="text-muted-foreground mb-6">
//               The event you're looking for doesn't exist or has been removed.
//             </p>
//             <Button onClick={() => navigate("/events")}>Browse Events</Button>
//           </div>
//         </main>
//       </div>
//     );
//   }
  
//   // Prepare event data with API fields
//   const eventTitle = event.title || event.eventTitle || "Untitled Event";
//   const eventDate = formatEventDate(event.startDate || event.date);
//   const eventTime = formatEventTime(event.startDate, event.endDate);
//   const eventImage =
//     event.flyerImage ||
//     event.flyerImageUrl ||
//     event.coverImage ||
//     event.image ||
//     FALLBACK_IMAGE;
  
//   // Gallery from explicit galleryImages or generic gallery/images
//   const eventGallery = event.galleryImages && Array.isArray(event.galleryImages)
//     ? event.galleryImages
//     : event.images 
//       ? event.images
//           .filter(img => !img.type || img.type === 'EVENT_GALLERY')
//           .map(img => img.url || img)
//       : (event.gallery || []);
    
//   const galleryImages = eventGallery.length > 0 ? eventGallery : [eventImage];
  
//   const eventDescription = event.description || event.summary || "No description available.";
  
//   // Location mapping
//   let eventLocation = "Location TBA";
//   let eventAddress = "Address TBA";
//   let eventVenue = "Venue TBA";
  
//   if (event.venues && event.venues.length > 0) {
//     const venue = event.venues[0];
//     eventLocation = `${venue.city || ""}${venue.city && venue.state ? ", " : ""}${venue.state || ""}`.trim() || "Location TBA";
//     eventAddress = venue.fullAddress || venue.address || eventLocation;
//     eventVenue = venue.name || venue.venueName || eventLocation;
//   } else {
//     const cityState = `${event.city || ""}${event.city && event.state ? ", " : ""}${event.state || ""}`.trim();
//     eventLocation = cityState || event.location || event.venue || "Location TBA";
//     const addrParts = [
//       event.address || event.fullAddress,
//       event.venue,
//       cityState,
//       event.pincode
//     ].filter(Boolean);
//     eventAddress = addrParts.join(", ") || eventLocation;
//     eventVenue = event.venue || event.venueName || eventLocation;
//   }

//   const scrollToLocation = () => {
//     const el = document.getElementById("location-section");
//     if (el) el.scrollIntoView({ behavior: "smooth" });
//   };

//   const scrollToTickets = () => {
//     const el = document.getElementById("tickets-section");
//     if (el) el.scrollIntoView({ behavior: "smooth" });
//   };

//   const handleShare = () => {
//     // Share functionality handled in EventHero component
//   };

//   const handleDownloadTickets = () => {
//     const receiptItems =
//       confirmationItems.length > 0
//         ? confirmationItems
//         : summaryItems.map((item) => ({
//             id: item.ticket.id,
//             name: item.ticket.name,
//             quantity: item.quantity,
//             unitPrice: item.ticket.price || 0,
//             total: (item.ticket.price || 0) * item.quantity,
//           }));

//     if (receiptItems.length === 0) {
//       toast.error("No ticket details available to download.");
//       return;
//     }

//     try {
//       const width = 820;
//       const baseHeight = 520;
//       const rowHeight = 54;
//       const height = baseHeight + receiptItems.length * rowHeight;

//       const canvas = document.createElement("canvas");
//       canvas.width = width;
//       canvas.height = height;
//       const ctx = canvas.getContext("2d");

//       if (!ctx) {
//         throw new Error("Canvas not supported");
//       }

//       // Background
//       ctx.fillStyle = "#eef2ff";
//       ctx.fillRect(0, 0, width, height);

//       // Ticket card with shadow
//       const cardX = 50;
//       const cardY = 40;
//       const cardWidth = width - cardX * 2;
//       const cardHeight = height - cardY * 2;

//       ctx.save();
//       ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
//       ctx.shadowBlur = 24;
//       ctx.shadowOffsetY = 18;
//       ctx.fillStyle = "#ffffff";
//       ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
//       ctx.restore();

//       // Header gradient
//       const headerHeight = 180;
//       const headerGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + headerHeight);
//       headerGradient.addColorStop(0, "#5b21b6");
//       headerGradient.addColorStop(1, "#7c3aed");
//       ctx.fillStyle = headerGradient;
//       ctx.fillRect(cardX, cardY, cardWidth, headerHeight);

//       ctx.fillStyle = "#ffffff";
//       ctx.font = "bold 40px 'Amiko', sans-serif";
//       ctx.fillText(eventTitle, cardX + 36, cardY + 76);
//       ctx.font = "20px 'Amiko', sans-serif";
//       ctx.fillText(`Date: ${eventDate}`, cardX + 36, cardY + 120);
//       ctx.fillText(`Venue: ${eventVenue}`, cardX + 36, cardY + 152);

//       // Ticket holder info
//       const holderName = (bulkDetails.name || defaultBookingDetails.name || "Guest").trim();
//       const holderEmail = (bulkDetails.email || defaultBookingDetails.email || "—").trim();

//       let cursorY = cardY + headerHeight + 40;
//       ctx.fillStyle = "#0f172a";
//       ctx.font = "bold 26px 'Amiko', sans-serif";
//       ctx.fillText("Ticket Holder", cardX + 36, cursorY);
//       ctx.font = "20px 'Amiko', sans-serif";
//       ctx.fillText(holderName, cardX + 36, cursorY + 36);
//       ctx.fillText(holderEmail, cardX + 36, cursorY + 66);

//       // Order summary
//       cursorY += 110;
//       ctx.fillStyle = "#0f172a";
//       ctx.font = "bold 26px 'Amiko', sans-serif";
//       ctx.fillText("Order Summary", cardX + 36, cursorY);
//       cursorY += 30;

//       ctx.font = "20px 'Amiko', sans-serif";
//       receiptItems.forEach((item) => {
//         ctx.fillStyle = "#1f2937";
//         ctx.fillText(`${item.name} × ${item.quantity}`, cardX + 36, cursorY + 32);
//         ctx.fillText(formatCurrencyValue(item.total), cardX + cardWidth - 220, cursorY + 32);
//         cursorY += rowHeight;
//       });

//       ctx.fillStyle = "#64748b";
//       ctx.fillText("Subtotal", cardX + 36, cursorY + 22);
//       ctx.fillStyle = "#0f172a";
//       ctx.fillText(formatCurrencyValue(baseAmount), cardX + cardWidth - 220, cursorY + 22);
//       cursorY += 40;

//       ctx.fillStyle = "#64748b";
//       ctx.fillText("Convenience Fee (20%)", cardX + 36, cursorY + 22);
//       ctx.fillStyle = "#0f172a";
//       ctx.fillText(formatCurrencyValue(convenienceFee), cardX + cardWidth - 220, cursorY + 22);
//       cursorY += 40;

//       ctx.fillStyle = "#64748b";
//       ctx.fillText("IGST on Convenience (9%)", cardX + 36, cursorY + 22);
//       ctx.fillStyle = "#0f172a";
//       ctx.fillText(formatCurrencyValue(igstOnConvenience), cardX + cardWidth - 220, cursorY + 22);
//       cursorY += 40;

//       ctx.fillStyle = "#64748b";
//       ctx.fillText("CGST on Convenience (9%)", cardX + 36, cursorY + 22);
//       ctx.fillStyle = "#0f172a";
//       ctx.fillText(formatCurrencyValue(cgstOnConvenience), cardX + cardWidth - 220, cursorY + 22);
//       cursorY += 48;

//       ctx.fillStyle = "#0f172a";
//       ctx.font = "bold 24px 'Amiko', sans-serif";
//       ctx.fillText("Total Paid", cardX + 36, cursorY + 26);
//       ctx.fillStyle = "#4f46e5";
//       ctx.fillText(formatCurrencyValue(bookingGrandTotal), cardX + cardWidth - 220, cursorY + 26);

//       // Barcode panel
//       const barcodeWidth = 200;
//       const barcodeHeight = 160;
//       const barcodeX = cardX + cardWidth - barcodeWidth - 32;
//       const barcodeY = cardY + headerHeight + 32;
//       const bookingRef = `${eventTitle.replace(/\s+/g, "")}-${Date.now()}`;

//       ctx.fillStyle = "#f8fafc";
//       ctx.strokeStyle = "#e2e8f0";
//       ctx.lineWidth = 2;
//       ctx.beginPath();
//       ctx.roundRect(barcodeX, barcodeY, barcodeWidth, barcodeHeight, 14);
//       ctx.fill();
//       ctx.stroke();

//       const barAreaX = barcodeX + 18;
//       const barAreaWidth = barcodeWidth - 36;
//       const barBottom = barcodeY + barcodeHeight - 36;
//       const barTop = barcodeY + 18;
//       const barCount = bookingRef.length;
//       const baseBarWidth = Math.max(1.4, barAreaWidth / (barCount * 1.6));

//       let barX = barAreaX;
//       ctx.fillStyle = "#0f172a";
//       for (let i = 0; i < barCount && barX < barAreaX + barAreaWidth; i++) {
//         const modifier = 1 + ((bookingRef.charCodeAt(i) % 5) / 6);
//         const barWidth = Math.min(baseBarWidth * modifier, barAreaX + barAreaWidth - barX);
//         ctx.fillRect(barX, barTop, barWidth, barBottom - barTop);
//         barX += barWidth + baseBarWidth * 0.45;
//       }

//       ctx.fillStyle = "#64748b";
//       ctx.font = "14px 'Amiko', sans-serif";
//       ctx.fillText(bookingRef, barcodeX + 20, barcodeY + barcodeHeight - 12);

//       // Footer note
//       ctx.fillStyle = "#64748b";
//       ctx.font = "18px 'Amiko', sans-serif";
//       ctx.fillText(
//         "Present this ticket (digital or printed) with the barcode at the venue entrance.",
//         cardX + 36,
//         height - 60
//       );

//       const dataUrl = canvas.toDataURL("image/png");
//       const link = document.createElement("a");
//       link.href = dataUrl;
//       link.download = `ticket-${Date.now()}.png`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);

//       toast.success("Ticket downloaded as an image.");
//     } catch (error) {
//       console.error("Failed to generate ticket:", error);
//       toast.error("Unable to generate ticket. Please try again.");
//     }
//   };

//   // Get template from event and map to proper format
//   // Backend stores template as "template1", "template2", "template3"
//   // We map it to template name and get config
//   const eventTemplateId = event?.template || "template1";
//   const templateName = mapTemplateId(eventTemplateId); // Maps "template1" -> "Classic", etc.
//   const templateConfig = getTemplateConfig(templateName, "detail");
  
//   console.log("🎨 Template Selection:", {
//     eventTemplateId,
//     templateName,
//     displayName: templateConfig.displayName,
//     eventId: event?.id
//   });

//   console.log("📋 Event Data Check:", {
//     hasQuestions: !!eventQuestions.length,
//     questionsCount: eventQuestions.length,
//     hasArtists: !!normalizedArtists.length,
//     artistsCount: normalizedArtists.length,
//     rawQuestions: event?.questions || event?.customQuestions,
//     rawArtists: event?.artists
//   });

//   // Common props for all templates (including template config)
//   const templateProps = {
//     eventTitle,
//     eventDate,
//     eventTime,
//     eventImage,
//     eventLocation,
//     eventVenue,
//     eventAddress,
//     eventDescription,
//     event: normalizedEvent || event, // Use normalized event
//     galleryImages,
//     eventGallery,
//     ticketDisplayList,
//     priceRange,
//     hasTicketData,
//     bookingTicketsLoading,
//     hasPurchasableTickets,
//     scrollToTickets,
//     scrollToLocation,
//     handleBulkModalChange,
//     templateConfig: templateConfig.layoutConfig, // Pass template configuration
//   };

//   // Render appropriate template based on event template
//   const renderTemplate = () => {
//     // Use template ID for backward compatibility
//     switch (eventTemplateId) {
//       case "template2":
//         return <ModernSplitTemplate {...templateProps} />;
//       case "template3":
//         return <MinimalistSingleColumnTemplate {...templateProps} />;
//       case "template1":
//       default:
//         return <ClassicDetailTemplate {...templateProps} />;
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       {renderTemplate()}

//       <Dialog open={isBulkModalOpen} onOpenChange={handleBulkModalChange}>
//         <DialogContent className="max-w-4xl h-[90vh] rounded-2xl p-0 overflow-hidden flex flex-col">
//           {bulkStep === "select" && (
//             <div className="flex h-full flex-col">
//               <div className="flex-1 overflow-y-auto p-8">
//                 <DialogHeader>
//                   <DialogTitle>Select Tickets</DialogTitle>
//                   <DialogDescription>
//                     Choose the ticket types and quantities you want to book.
//                   </DialogDescription>
//                 </DialogHeader>

//                 <div className="mt-6 space-y-4">
//                   {bookingTicketsLoading && ticketDisplayList.length === 0 ? (
//                     <div className="flex justify-center py-10">
//                       <Loader2 className="w-6 h-6 animate-spin text-primary" />
//                     </div>
//                   ) : availableTickets.length === 0 ? (
//                     <p className="text-muted-foreground">
//                       {bookingTicketsError
//                         ? "Live ticket availability is currently unavailable. Please try again shortly."
//                         : "No tickets available at the moment."}
//                     </p>
//                   ) : (
//                     availableTickets.map((ticket) => {
//                       const selectedQty = bulkSelections[ticket.id] || 0;
//                       return (
//                         <Card key={ticket.id} className="border border-border/60">
//                           <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//                             <div>
//                               <div className="flex items-center gap-3">
//                                 <Badge variant="secondary">{ticket.category || "Ticket"}</Badge>
//                                 <span className="text-sm text-muted-foreground">
//                                   {ticket.available} available
//                                 </span>
//                               </div>
//                               <h3 className="text-lg font-semibold mt-2">{ticket.name}</h3>
//                               {ticket.description && (
//                                 <p className="text-sm text-muted-foreground mt-1">
//                                   {ticket.description}
//                                 </p>
//                               )}
//                             </div>
//                             <div className="flex flex-col items-end gap-3">
//                               <span className="text-2xl font-bold text-primary">
//                                 {formatCurrencyValue(ticket.price)}
//                               </span>
//                               <div className="flex items-center gap-2">
//                                 <Button
//                                   variant="outline"
//                                   size="icon"
//                                   onClick={() =>
//                                     handleBulkQuantityChange(
//                                       ticket.id,
//                                       selectedQty - 1,
//                                       ticket.maxPerOrder || ticket.available
//                                     )
//                                   }
//                                   disabled={selectedQty <= 0}
//                                 >
//                                   <Minus className="w-4 h-4" />
//                                 </Button>
//                                 <span className="text-lg font-semibold min-w-[32px] text-center">
//                                   {selectedQty}
//                                 </span>
//                                 <Button
//                                   variant="outline"
//                                   size="icon"
//                                   onClick={() =>
//                                     handleBulkQuantityChange(
//                                       ticket.id,
//                                       selectedQty + 1,
//                                       ticket.maxPerOrder || ticket.available
//                                     )
//                                   }
//                                   disabled={
//                                     !!ticket.maxPerOrder && selectedQty >= ticket.maxPerOrder
//                                   }
//                                 >
//                                   <Plus className="w-4 h-4" />
//                                 </Button>
//                               </div>
//                             </div>
//                           </CardContent>
//                         </Card>
//                       );
//                     })
//                   )}
//                 </div>
//               </div>

//               <div className="border-t bg-background/70 p-6 backdrop-blur">
//                 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//                   <div className="text-sm text-muted-foreground">
//                     <p>
//                       Total Tickets:{" "}
//                       <span className="font-semibold text-foreground">{totalSelectedTickets}</span>
//                     </p>
//                     <p>
//                       Total Amount:{" "}
//                       <span className="font-semibold text-primary">
//                         {formatCurrencyValue(totalSelectedAmount)}
//                       </span>
//                     </p>
//                   </div>
//                   <div className="flex gap-2">
//                     <Button variant="outline" onClick={() => handleBulkModalChange(false)}>
//                       Cancel
//                     </Button>
//                     <Button onClick={handleBulkProceed} disabled={totalSelectedTickets === 0}>
//                       Proceed to Checkout
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {bulkStep === "checkout" && (
//             <div className="flex h-full flex-col">
//               <div className="flex-1 overflow-y-auto p-8">
//                 <div className="grid md:grid-cols-[1.5fr,1fr] gap-6 pt-2">
//                   <div className="space-y-4">
//                     {userIsAuthenticated ? (
//                       <>
//                         <Card className="border border-border/60">
//                           <CardContent className="p-5 space-y-3">
//                             <h3 className="font-semibold text-lg">Booking Details</h3>
//                             <div>
//                               <p className="text-sm text-muted-foreground">Name</p>
//                               <p className="font-medium">
//                                 {bulkDetails.name || defaultBookingDetails.name || "—"}
//                               </p>
//                             </div>
//                             <div>
//                               <p className="text-sm text-muted-foreground">Email</p>
//                               <p className="font-medium">
//                                 {bulkDetails.email || defaultBookingDetails.email || "—"}
//                               </p>
//                             </div>
//                             <div>
//                               <p className="text-sm text-muted-foreground">Phone</p>
//                               <p className="font-medium">
//                                 {bulkDetails.phone || defaultBookingDetails.phone || "—"}
//                               </p>
//                             </div>
//                           <div>
//                             <p className="text-sm text-muted-foreground">Address</p>
//                             <p className="font-medium whitespace-pre-wrap">
//                               {bulkDetails.address || defaultBookingDetails.address || "—"}
//                             </p>
//                           </div>
//                           {(bulkDetails.addressLine2 || defaultBookingDetails.addressLine2) && (
//                             <div>
//                               <p className="text-sm text-muted-foreground">Address Line 2</p>
//                               <p className="font-medium whitespace-pre-wrap">
//                                 {bulkDetails.addressLine2 ||
//                                   defaultBookingDetails.addressLine2 ||
//                                   "—"}
//                               </p>
//                             </div>
//                           )}
//                           <div>
//                             <p className="text-sm text-muted-foreground">City</p>
//                             <p className="font-medium">
//                               {bulkDetails.city || defaultBookingDetails.city || "—"}
//                             </p>
//                           </div>
//                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                             <div>
//                               <p className="text-sm text-muted-foreground">State</p>
//                               <p className="font-medium">
//                                 {bulkDetails.state || defaultBookingDetails.state || "—"}
//                               </p>
//                             </div>
//                             <div>
//                               <p className="text-sm text-muted-foreground">Pincode</p>
//                               <p className="font-medium">
//                                 {bulkDetails.pincode || defaultBookingDetails.pincode || "—"}
//                               </p>
//                             </div>
//                           </div>
//                           </CardContent>
//                         </Card>
//                       <div className="space-y-4">
//                         <div className="space-y-2">
//                           <Label htmlFor="bulk-address-auth">Address Line 1</Label>
//                           <Textarea
//                             id="bulk-address-auth"
//                             placeholder="House number, street name"
//                             value={bulkDetails.address}
//                             onChange={(e) =>
//                               setBulkDetails((prev) => ({ ...prev, address: e.target.value }))
//                             }
//                             rows={3}
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label htmlFor="bulk-address2-auth">Address Line 2 (Optional)</Label>
//                           <Input
//                             id="bulk-address2-auth"
//                             placeholder="Apartment, suite, floor"
//                             value={bulkDetails.addressLine2}
//                             onChange={(e) =>
//                               setBulkDetails((prev) => ({
//                                 ...prev,
//                                 addressLine2: e.target.value,
//                               }))
//                             }
//                           />
//                         </div>
//                         <div className="grid gap-3 md:grid-cols-2">
//                           <div className="space-y-2">
//                             <Label htmlFor="bulk-city-auth">City</Label>
//                             <Input
//                               id="bulk-city-auth"
//                               placeholder="Enter city"
//                               value={bulkDetails.city}
//                               onChange={(e) =>
//                                 setBulkDetails((prev) => ({ ...prev, city: e.target.value }))
//                               }
//                             />
//                           </div>
//                           <div className="space-y-2">
//                             <Label htmlFor="bulk-state-auth">State</Label>
//                             <Input
//                               id="bulk-state-auth"
//                               placeholder="Enter state"
//                               value={bulkDetails.state}
//                               onChange={(e) =>
//                                 setBulkDetails((prev) => ({ ...prev, state: e.target.value }))
//                               }
//                             />
//                           </div>
//                         </div>
//                         <div className="space-y-2">
//                           <Label htmlFor="bulk-pincode-auth">Pincode</Label>
//                           <Input
//                             id="bulk-pincode-auth"
//                             placeholder="Enter pincode"
//                             value={bulkDetails.pincode}
//                             onChange={(e) =>
//                               setBulkDetails((prev) => ({ ...prev, pincode: e.target.value }))
//                             }
//                           />
//                         </div>
//                       </div>
//                       </>
//                     ) : (
//                       <>
//                         <div className="space-y-2">
//                           <Label htmlFor="bulk-name">Full Name</Label>
//                           <Input
//                             id="bulk-name"
//                             placeholder="Enter your name"
//                             value={bulkDetails.name}
//                             onChange={(e) =>
//                               setBulkDetails((prev) => ({ ...prev, name: e.target.value }))
//                             }
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label htmlFor="bulk-email">Email Address</Label>
//                           <Input
//                             id="bulk-email"
//                             type="email"
//                             placeholder="you@example.com"
//                             value={bulkDetails.email}
//                             onChange={(e) =>
//                               setBulkDetails((prev) => ({ ...prev, email: e.target.value }))
//                             }
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label htmlFor="bulk-phone">Phone Number</Label>
//                           <Input
//                             id="bulk-phone"
//                             type="tel"
//                             placeholder="+91 98765 43210"
//                             value={bulkDetails.phone}
//                             onChange={(e) =>
//                               setBulkDetails((prev) => ({ ...prev, phone: e.target.value }))
//                             }
//                           />
//                         </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="bulk-address">Address Line 1</Label>
//                         <Textarea
//                           id="bulk-address"
//                           placeholder="House number, street name"
//                           value={bulkDetails.address}
//                           onChange={(e) =>
//                             setBulkDetails((prev) => ({ ...prev, address: e.target.value }))
//                           }
//                           rows={3}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="bulk-address2">Address Line 2 (Optional)</Label>
//                         <Input
//                           id="bulk-address2"
//                           placeholder="Apartment, suite, floor"
//                           value={bulkDetails.addressLine2}
//                           onChange={(e) =>
//                             setBulkDetails((prev) => ({
//                               ...prev,
//                               addressLine2: e.target.value,
//                             }))
//                           }
//                         />
//                       </div>
//                       <div className="grid gap-3 md:grid-cols-2">
//                         <div className="space-y-2">
//                           <Label htmlFor="bulk-city">City</Label>
//                           <Input
//                             id="bulk-city"
//                             placeholder="Enter city"
//                             value={bulkDetails.city}
//                             onChange={(e) =>
//                               setBulkDetails((prev) => ({ ...prev, city: e.target.value }))
//                             }
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label htmlFor="bulk-state">State</Label>
//                           <Input
//                             id="bulk-state"
//                             placeholder="Enter state"
//                             value={bulkDetails.state}
//                             onChange={(e) =>
//                               setBulkDetails((prev) => ({ ...prev, state: e.target.value }))
//                             }
//                           />
//                         </div>
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="bulk-pincode">Pincode</Label>
//                         <Input
//                           id="bulk-pincode"
//                           placeholder="Enter pincode"
//                           value={bulkDetails.pincode}
//                           onChange={(e) =>
//                             setBulkDetails((prev) => ({ ...prev, pincode: e.target.value }))
//                           }
//                         />
//                       </div>
//                       </>
//                     )}
//                   </div>

//                   <Card className="border border-primary/20 bg-primary/5">
//                     <CardContent className="p-5 space-y-4">
//                       <h3 className="font-semibold text-lg">Order Summary</h3>
//                       <div className="space-y-2 text-sm">
//                         {selectionList
//                           .filter((item) => item.quantity > 0)
//                           .map((item) => (
//                             <div key={item.ticket.id} className="flex justify-between">
//                               <span>
//                                 {item.ticket.name} × {item.quantity}
//                               </span>
//                               <span className="font-semibold">
//                                 {formatCurrencyValue(item.ticket.price * item.quantity)}
//                               </span>
//                             </div>
//                           ))}
//                         <div className="flex justify-between pt-3 text-muted-foreground">
//                           <span>Subtotal</span>
//                           <span className="font-semibold text-foreground">
//                             {formatCurrencyValue(baseAmount)}
//                           </span>
//                         </div>
//                         <div className="flex justify-between text-muted-foreground">
//                           <span>Convenience Fee (20%)</span>
//                           <span className="font-semibold text-foreground">
//                             {formatCurrencyValue(convenienceFee)}
//                           </span>
//                         </div>
//                         <div className="flex justify-between text-muted-foreground">
//                           <span>IGST on Convenience (9%)</span>
//                           <span className="font-semibold text-foreground">
//                             {formatCurrencyValue(igstOnConvenience)}
//                           </span>
//                         </div>
//                         <div className="flex justify-between text-muted-foreground">
//                           <span>CGST on Convenience (9%)</span>
//                           <span className="font-semibold text-foreground">
//                             {formatCurrencyValue(cgstOnConvenience)}
//                           </span>
//                         </div>
//                       </div>
//                       <div className="flex justify-between border-t pt-3 font-semibold">
//                         <span>Total Amount</span>
//                         <span className="text-primary text-xl">
//                           {formatCurrencyValue(totalSelectedAmount)}
//                         </span>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </div>
//               </div>

//               <div className="flex justify-between gap-3 border-t bg-background/70 p-6 backdrop-blur">
//                 <Button variant="outline" onClick={handleBulkBack}>
//                   Back
//                 </Button>
//                 <Button onClick={handleBulkSubmit} disabled={isBulkSubmitting}>
//                   {isBulkSubmitting ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Processing...
//                     </>
//                   ) : (
//                     "Confirm Booking"
//                   )}
//                 </Button>
//               </div>
//             </div>
//           )}

//           {bulkStep === "success" && (
//             <div className="flex h-full flex-col">
//               <div className="flex-1 overflow-y-auto p-8 space-y-8">
//                 <DialogHeader>
//                   <DialogTitle>Booking Confirmed!</DialogTitle>
//                   <DialogDescription>
//                     Your tickets have been reserved successfully. Complete the payment to keep your
//                     seats.
//                   </DialogDescription>
//                 </DialogHeader>

//                 <div className="py-6 space-y-4 text-center border rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6">
//                   <p className="text-4xl animate-bounce">🎉</p>
//                   <p className="text-lg text-muted-foreground">
//                     A confirmation has been sent to{" "}
//                     <span className="font-medium">
//                       {bulkDetails.email || defaultBookingDetails.email || "your email"}
//                     </span>
//                     .
//                   </p>
//                   <div className="flex flex-col md:flex-row justify-center gap-3">
//                     <Button variant="outline" onClick={handleDownloadTickets} className="gap-2">
//                       <Download className="w-4 h-4" />
//                       Download Ticket
//                     </Button>
//                   </div>
//                 </div>

//                 <div className="space-y-6">
//                   {(bookingId || bookingStatus) && (
//                     <Card className="border border-primary/30 bg-primary/5">
//                       <CardContent className="p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//                         <div>
//                           <p className="text-sm text-muted-foreground">Booking Reference</p>
//                           <p className="text-sm break-all">{bookingId || "—"}</p>
//                         </div>
//                         {bookingStatus && (
//                           <Badge variant="outline" className="uppercase tracking-wide">
//                             {prettifyLabel(bookingStatus)}
//                           </Badge>
//                         )}
//                       </CardContent>
//                     </Card>
//                   )}

//                   {confirmationItems.length > 0 && (
//                     <Card className="border border-border/60">
//                       <CardContent className="p-5 space-y-4">
//                         <h3 className="font-semibold text-lg">Reserved Tickets</h3>
//                         <div className="space-y-3">
//                           {confirmationItems.map((item) => (
//                             <div
//                               key={item.id}
//                               className="flex flex-wrap items-center justify-between gap-2 text-sm"
//                             >
//                               <div>
//                                 <p className="font-medium">{item.name}</p>
//                                 <p className="text-muted-foreground">
//                                   Qty: {item.quantity} · {formatCurrencyValue(item.unitPrice)} each
//                                 </p>
//                               </div>
//                               <span className="font-semibold">
//                                 {formatCurrencyValue(item.total)}
//                               </span>
//                             </div>
//                           ))}
//                         </div>
//                       </CardContent>
//                     </Card>
//                   )}

//                   {bookingTotalsEntries.length > 0 && (
//                     <Card className="border border-border/60">
//                       <CardContent className="p-5 space-y-3">
//                         <h3 className="font-semibold text-lg">Charges Breakdown</h3>
//                         <div className="space-y-2 text-sm">
//                           {bookingTotalsEntries.map((entry, index) => (
//                             <div key={`${entry.label}-${index}`} className="flex justify-between">
//                               <span className="text-muted-foreground">{entry.label}</span>
//                               <span className="font-medium">
//                                 {formatCurrencyValue(entry.value)}
//                               </span>
//                             </div>
//                           ))}
//                         </div>
//                       </CardContent>
//                     </Card>
//                   )}

//                   <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5 flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-primary uppercase tracking-wide">Amount Payable</p>
//                       <p className="text-muted-foreground text-xs">
//                         Complete payment to confirm your reservation.
//                       </p>
//                     </div>
//                     <span className="text-3xl font-bold text-primary">
//                       {formatCurrencyValue(bookingGrandTotal)}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 border-t bg-background/70 p-6 backdrop-blur">
//                 <Button variant="outline" onClick={handleDownloadTickets} className="gap-2">
//                   <Download className="w-4 h-4" />
//                   Download Receipt
//                 </Button>
//                 <Button onClick={() => handleBulkModalChange(false)}>Close</Button>
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       <FloatingCTA onBookClick={scrollToTickets} onShareClick={handleShare} />
//     </div>
//   );
// };

// export default EventDetail;
