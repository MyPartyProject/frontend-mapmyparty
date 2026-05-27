import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { usePublicEvents } from "@/hooks/usePublicEvents";
import eventMusic from "@/assets/event-music.jpg";
import ClassicGridTemplate from "@/components/EventsPageTemplates/ClassicGridTemplate";
import MagazineMasonryTemplate from "@/components/EventsPageTemplates/MagazineMasonryTemplate";
import ListTableTemplate from "@/components/EventsPageTemplates/ListTableTemplate";
import { resolveEventBannerImage } from "@/utils/eventBannerImage";

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  
  const {
    events: apiEvents,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    pagination,
  } = usePublicEvents();

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (value.length >= 2 || value.length === 0) {
      updateFilters({ search: value || null });
    }
  };

  const handleCategoryChange = (value) => {
    const category = value === "all" ? null : value.toUpperCase();
    updateFilters({ category });
  };  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    clearFilters();
  };

  // Get event title (handle both API formats)
  const getEventTitle = (event) => {
    return event.title || event.eventTitle || "Untitled Event";
  };

  const getEventImage = (event) => {
    return resolveEventBannerImage(event, eventMusic);
  };

  // Get event location
  const getEventLocation = (event) => {
    if (event.venues && event.venues.length > 0) {
      const venue = event.venues[0];
      return `${venue.city || ""}${venue.city && venue.state ? ", " : ""}${venue.state || ""}`.trim() || "Location TBA";
    }
    return event.location || event.venue || "Location TBA";
  };

  // Get event category
  const getEventCategory = (event) => {
    if (event.category) return event.category;
    if (event.mainCategory) return event.mainCategory;
    if (event.subCategory) return event.subCategory;
    if (Array.isArray(event.categories) && event.categories.length > 0) {
      return event.categories[0];
    }
    return "Uncategorized";
  };

  const getEventPriceDisplay = (event) => {
    if (Array.isArray(event.tickets) && event.tickets.length > 0) {
      const numericPrices = event.tickets
        .map((ticket) => Number(ticket.price))
        .filter((price) => Number.isFinite(price));

      if (numericPrices.length > 0) {
        const minPrice = Math.min(...numericPrices);
        return minPrice > 0 ? `From ₹${minPrice}` : "Free";
      }
    }

    if (typeof event.price === "number") {
      return event.price > 0 ? `From ₹${event.price}` : "Free";
    }

    if (typeof event.price === "string" && event.price.trim()) {
      return event.price;
    }

    return "Free";
  };

  const sortedEvents = useMemo(() => {
    const eventsCopy = Array.isArray(apiEvents) ? [...apiEvents] : [];

    switch (sortBy) {
      case "price": {
        return eventsCopy.sort((a, b) => {
          const priceA = Array.isArray(a.tickets) && a.tickets.length
            ? Math.min(...a.tickets.map((ticket) => Number(ticket.price) || 0))
            : Number(a.price) || 0;
          const priceB = Array.isArray(b.tickets) && b.tickets.length
            ? Math.min(...b.tickets.map((ticket) => Number(ticket.price) || 0))
            : Number(b.price) || 0;
          return priceA - priceB;
        });
      }
      case "popularity": {
        return eventsCopy.sort((a, b) => {
          const countA = a._count?.bookings || a.stats?.totalTicketsSold || 0;
          const countB = b._count?.bookings || b.stats?.totalTicketsSold || 0;
          return countB - countA;
        });
      }
      case "date":
      default: {
        return eventsCopy.sort((a, b) => {
          const dateA = new Date(a.startDate || a.date || 0).getTime();
          const dateB = new Date(b.startDate || b.date || 0).getTime();
          return dateA - dateB;
        });
      }
    }
  }, [apiEvents, sortBy]);

  // Determine page template: URL param > Most common event template > Default
  const pageTemplate = useMemo(() => {
    // First, check URL parameter (allows manual override)
    const urlTemplate = searchParams.get("template");
    if (urlTemplate && ["template1", "template2", "template3"].includes(urlTemplate)) {
      return urlTemplate;
    }

    // If no URL param, determine from events (most common template)
    if (sortedEvents.length > 0) {
      const templateCounts = { template1: 0, template2: 0, template3: 0 };
      
      sortedEvents.forEach((event) => {
        const eventTemplate = event.template || "template1";
        if (templateCounts.hasOwnProperty(eventTemplate)) {
          templateCounts[eventTemplate]++;
        } else {
          templateCounts.template1++; // Default unknown templates to template1
        }
      });

      // Find the most common template
      const mostCommon = Object.entries(templateCounts).reduce((a, b) => 
        templateCounts[a[0]] > templateCounts[b[0]] ? a : b
      )[0];

      return mostCommon;
    }

    // Default fallback
    return "template1";
  }, [searchParams, sortedEvents]);
 
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Common props for all templates
  const templateProps = {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    handleSearchChange,
    handleCategoryChange,
    handleClearFilters,
    filters,
    loading,
    error,
    sortedEvents,
    pagination,
    updateFilters,
    getEventTitle,
    formatDate,
    getEventLocation,
    getEventImage,
    getEventCategory,
    getEventPriceDisplay,
  };

  // Render appropriate template based on pageTemplate
  switch (pageTemplate) {
    case "template2":
      return <MagazineMasonryTemplate {...templateProps} />;
    case "template3":
      return <ListTableTemplate {...templateProps} />;
    case "template1":
    default:
      return <ClassicGridTemplate {...templateProps} />;
  }
};

export default Events;
