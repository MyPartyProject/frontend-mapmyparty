import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Plus,
  RefreshCw,
  PackageCheck,
  PackagePlus,
  Trash2,
  X,
  ShoppingBag,
} from "lucide-react";
import { apiFetch } from "@/config/api";

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(value || 0);

// Inject keyframe animation for popup
const popupStyles = `
@keyframes popIn {
  0% {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;

const FoodBeverages = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [addOns, setAddOns] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [receiveDrafts, setReceiveDrafts] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAddOns, setLoadingAddOns] = useState(false);
  const [error, setError] = useState("");
  const [itemError, setItemError] = useState({ id: null, message: "" });
  const [form, setForm] = useState({ name: "", unit: "", totalQty: "", notes: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsTopRef = useRef(null);

  // Auto-dismiss item error after 4 seconds
  useEffect(() => {
    if (itemError.id) {
      const timer = setTimeout(() => {
        setItemError({ id: null, message: "" });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [itemError]);

  const publishedEvents = useMemo(
    () => events.filter((event) => event.publishStatus === "PUBLISHED"),
    [events]
  );

  const selectedEvent = useMemo(
    () => publishedEvents.find((event) => event.id === selectedEventId) || null,
    [publishedEvents, selectedEventId]
  );

  const fetchEvents = async () => {
    setLoadingEvents(true);
    setError("");
    try {
      const response = await apiFetch("event/my-events");
      const data = response.data || response;
      setEvents(data.events || []);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError(err.message || "Failed to load events");
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchAddOns = async (eventId) => {
    if (!eventId) {
      console.log("fetchAddOns: No eventId provided");
      return;
    }
    console.log(`[fetchAddOns] Starting fetch for eventId: ${eventId}`);
    setLoadingAddOns(true);
    setError("");
    try {
      console.log(`[fetchAddOns] Calling API: event/${eventId}/add-ons`);
      const response = await apiFetch(`event/${eventId}/add-ons`);
      console.log("[fetchAddOns] Raw response:", response);
      const data = response.data || response;
      console.log("[fetchAddOns] Extracted data:", data);
      const items = data.items || [];
      console.log(`[fetchAddOns] Items array (${items.length} items):`, items);
      setAddOns(items);
      console.log("[fetchAddOns] Successfully set add-ons");
    } catch (err) {
      console.error("[fetchAddOns] ERROR:", err);
      console.error("[fetchAddOns] Error message:", err.message);
      console.error("[fetchAddOns] Error stack:", err.stack);
      console.error("[fetchAddOns] Full error object:", JSON.stringify(err, null, 2));
      setError(err.message || "Failed to load add-ons");
    } finally {
      setLoadingAddOns(false);
      console.log("[fetchAddOns] Completed (loading set to false)");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId && isModalOpen) {
      fetchAddOns(selectedEventId);
    } else {
      setAddOns([]);
    }
  }, [selectedEventId, isModalOpen]);

  useEffect(() => {
    const nextDrafts = {};
    const nextReceives = {};
    addOns.forEach((item) => {
      nextDrafts[item.id] = {
        name: item.name,
        unit: item.unit || "",
        totalQty: item.totalQty ?? 0,
        notes: item.notes || "",
      };
      nextReceives[item.id] = "";
    });
    setDrafts(nextDrafts);
    setReceiveDrafts(nextReceives);
  }, [addOns]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return;
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        unit: form.unit.trim(),
        totalQty: form.totalQty ? Number(form.totalQty) : 0,
        notes: form.notes.trim(),
      };
      const response = await apiFetch(`event/${selectedEventId}/add-ons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = response.data || response;
      setAddOns((prev) => [data, ...prev]);
      setForm({ name: "", unit: "", totalQty: "", notes: "" });
      requestAnimationFrame(() => {
        itemsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      console.error("Failed to create add-on:", err);
      setError(err.message || "Failed to create add-on");
    }
  };

  const handleDraftChange = (id, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleUpdate = async (id) => {
    if (!selectedEventId) return;
    const payload = drafts[id];
    if (!payload) return;
    setError("");
    setItemError({ id: null, message: "" });
    try {
      const response = await apiFetch(`event/${selectedEventId}/add-ons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name?.trim(),
          unit: payload.unit?.trim(),
          totalQty: Number(payload.totalQty || 0),
          notes: payload.notes?.trim(),
        }),
      });
      const data = response.data || response;
      setAddOns((prev) => prev.map((item) => (item.id === id ? data : item)));
      requestAnimationFrame(() => {
        itemsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      console.error("Failed to update add-on:", err);
      setItemError({ id, message: err.message || "Failed to update add-on" });
    }
  };

  const handleReceive = async (id) => {
    if (!selectedEventId) return;
    const addQty = Number(receiveDrafts[id] || 0);
    if (!addQty) return;
    setError("");
    try {
      const response = await apiFetch(`event/${selectedEventId}/add-ons/${id}/receive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addQty }),
      });
      const data = response.data || response;
      setAddOns((prev) => prev.map((item) => (item.id === id ? data : item)));
      setReceiveDrafts((prev) => ({ ...prev, [id]: "" }));
      requestAnimationFrame(() => {
        itemsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      console.error("Failed to update received count:", err);
      setError(err.message || "Failed to update received count");
    }
  };

  const handleDelete = async (id) => {
    if (!selectedEventId) return;
    setError("");
    try {
      await apiFetch(`event/${selectedEventId}/add-ons/${id}`, {
        method: "DELETE",
      });
      setAddOns((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete add-on:", err);
      setError(err.message || "Failed to delete add-on");
    }
  };

  return (
    <div className="space-y-6">
      <style>{popupStyles}</style>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Food & Beverages</p>
            <h2 className="text-2xl font-bold">On-site inventory tracker</h2>
            <p className="text-sm text-white/60">
              Track items you sell on-site and manually update sold counts (no payments handled here).
            </p>
          </div>
          <button
            onClick={fetchEvents}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh events
          </button>
        </div>

        <div className="mt-4">
          {loadingEvents ? (
            <p className="text-sm text-white/60">Loading events...</p>
          ) : publishedEvents.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
              No published events yet. Publish an event to manage add-ons.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {publishedEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setIsModalOpen(true);
                  }}
                  className="text-left rounded-2xl border border-white/10 bg-black/30 p-5 transition shadow-lg shadow-black/30 hover:border-emerald-300/40 hover:bg-emerald-500/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">{event.category}</p>
                      <h3 className="text-lg font-semibold mt-1">{event.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-white/60 mt-3">{event.publishStatus} • {event.eventStatus}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-[#0e1215] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Inventory</p>
                <h3 className="text-2xl font-semibold">{selectedEvent.title}</h3>
                <p className="text-xs text-white/60">Manage on-site items and sold counts.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 p-6 overflow-y-auto max-h-[80vh]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div ref={itemsTopRef} />
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Items on sale</h4>
                    <span className="text-xs text-white/60">Published event</span>
                  </div>

                  {loadingAddOns ? (
                    <p className="text-sm text-white/60">Loading items...</p>
                  ) : addOns.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                      No add-ons yet. Add your first item.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addOns.map((item) => {
                        const draft = drafts[item.id] || {};
                        const remaining = Math.max((item.totalQty || 0) - (item.receivedQty || 0), 0);
                        const totalQty = item.totalQty || 0;
                        const soldQty = item.receivedQty || 0;
                        const soldProgress = totalQty > 0 ? Math.min((soldQty / totalQty) * 100, 100) : 0;
                        return (
                          <div key={item.id} className="relative rounded-2xl border border-white/10 bg-black/30 p-4">
                            {/* Error popup */}
                            {itemError.id === item.id && (
                              <div
                                className="absolute top-2 left-2 right-2 z-10 rounded-xl border border-red-400/40 bg-red-500/95 backdrop-blur-sm p-3 text-sm text-white shadow-lg"
                                style={{ animation: "popIn 0.2s ease-out" }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{itemError.message}</span>
                                  </div>
                                  <button
                                    onClick={() => setItemError({ id: null, message: "" })}
                                    className="text-white/80 hover:text-white transition flex-shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Item</p>
                                <h4 className="text-lg font-semibold">{item.name}</h4>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-white/60 flex-wrap">
                                <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10">
                                  Stock: {formatNumber(item.totalQty)}
                                </span>
                                <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10">
                                  Sold: {formatNumber(item.receivedQty)}
                                </span>
                                <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10">
                                  Remaining: {formatNumber(remaining)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/40">
                                <span>Sold progress</span>
                                <span>{Math.round(soldProgress)}%</span>
                              </div>
                              <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden relative">
                                {totalQty === 0 ? (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] text-white/40">No stock set</span>
                                  </div>
                                ) : (
                                  <div
                                    className="h-full rounded-full bg-emerald-400/60 transition-all"
                                    style={{ width: `${soldProgress}%` }}
                                  />
                                )}
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <label className="text-xs text-white/60">Item name</label>
                                <input
                                  value={draft.name || ""}
                                  onChange={(e) => handleDraftChange(item.id, "name", e.target.value)}
                                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-white/60">Unit (optional)</label>
                                <input
                                  value={draft.unit || ""}
                                  onChange={(e) => handleDraftChange(item.id, "unit", e.target.value)}
                                  placeholder="bottles / plates"
                                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-white/60">Total stock</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={draft.totalQty ?? 0}
                                  onChange={(e) => handleDraftChange(item.id, "totalQty", e.target.value)}
                                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
                                />
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
                              <div className="lg:col-span-2 space-y-2">
                                <label className="text-xs text-white/60">Notes</label>
                                <input
                                  value={draft.notes || ""}
                                  onChange={(e) => handleDraftChange(item.id, "notes", e.target.value)}
                                  placeholder="Optional note"
                                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdate(item.id)}
                                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm flex items-center justify-center gap-2"
                                >
                                  <PackagePlus className="w-4 h-4" /> Update
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-400/30 text-red-100 hover:bg-red-500/20 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={receiveDrafts[item.id] || ""}
                                onChange={(e) =>
                                  setReceiveDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                                }
                                placeholder="Mark sold qty"
                                className="w-40 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
                              />
                              <button
                                onClick={() => handleReceive(item.id)}
                                className="px-3 py-2 rounded-lg bg-primaryCTA border border-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active transition text-sm flex items-center gap-2"
                              >
                                <PackageCheck className="w-4 h-4" /> Record sale
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-lg font-semibold mb-3">Add new item</h4>
                  <form onSubmit={handleCreate} className="space-y-3">
                    <input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Item name (e.g., Coke bottles)"
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
                      required
                    />
                    <input
                      value={form.unit}
                      onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                      placeholder="Unit (optional)"
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
                    />
                    <input
                      type="number"
                      min="0"
                      value={form.totalQty}
                      onChange={(e) => setForm((prev) => ({ ...prev, totalQty: e.target.value }))}
                      placeholder="Total stock"
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
                    />
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notes (optional)"
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
                    />
                    <button
                      type="submit"
                      disabled={!form.name.trim()}
                      className="w-full px-4 py-2 rounded-lg bg-primaryCTA border border-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primaryCTA"
                    >
                      <Plus className="w-4 h-4" /> Add item
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodBeverages;
