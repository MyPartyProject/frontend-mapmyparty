import VenueDatePicker from "./VenueDatePicker";
import "@/styles/venue-management.css";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { venueDays, venuePath, venueRequest } from "@/services/venueService";
import { uploadTempImage } from "@/services/eventService";
import { createStandardFlyerFile } from "@/utils/flyerImageCrop";
import FlyerCropDialog from "@/components/events/FlyerCropDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VenueSurface } from "@/pages/VenuePage";
import { useVenuesEnabled } from "@/hooks/useVenuesEnabled";

const emptyVenue = () => ({
  name: "",
  type: "Cafe",
  about: "",
  fullAddress: "",
  area: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  contact: "",
  email: "",
  instagram: "",
  timezone: "Asia/Kolkata",
  latitude: null,
  longitude: null,
  costForTwo: null,
  amenities: [],
  cuisines: [],
  openingHours: venueDays.map((_, day) => ({ day, intervals: [] })),
  closures: [],
  menu: [],
  reservationsEnabled: true,
  slotMinutes: 30,
  leadMinutes: 60,
  horizonDays: 90,
  maxGuests: 20,
});
const editable = Object.keys(emptyVenue());
const crops = [
  { kind: "DESKTOP", width: 1920, height: 720 },
  { kind: "TABLET", width: 1536, height: 840 },
  { kind: "MOBILE", width: 780, height: 720 },
];

function Field({ label, value, onChange, type = "text", ...props }) {
  return (
    <label className="block text-sm space-y-1">
      <span>{label}</span>
      {type === "date" ? <VenueDatePicker value={value} onChange={onChange} label={label} /> : <Input
        type={type}
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            type === "number"
              ? e.target.value === ""
                ? null
                : Number(e.target.value)
              : e.target.value,
          )
        }
        {...props}
      />}
    </label>
  );
}
function Intervals({ value, onChange }) {
  return (
    <div className="space-y-2">
      {value.map((interval, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Opens at"
            type="time"
            className="border rounded bg-background p-2"
            value={interval.open}
            onChange={(e) =>
              onChange(
                value.map((v, n) =>
                  n === i ? { ...v, open: e.target.value } : v,
                ),
              )
            }
          />
          <span>to</span>
          <input
            aria-label="Closes at"
            type="time"
            className="border rounded bg-background p-2"
            value={interval.close}
            onChange={(e) =>
              onChange(
                value.map((v, n) =>
                  n === i ? { ...v, close: e.target.value } : v,
                ),
              )
            }
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(value.filter((_, n) => n !== i))}
          >
            Remove
          </Button>
        </div>
      ))}
      {value.length < 4 && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([...value, { open: "09:00", close: "22:00" }])
          }
        >
          {value.length ? "Add interval" : "Set opening hours"}
        </Button>
      )}
      {!value.length && (
        <span className="text-xs text-muted-foreground ml-2">Closed</span>
      )}
    </div>
  );
}

function VenueEditor({ initial, onClose }) {
  const client = useQueryClient();
  const formRef = useRef(null);
  const [venue, setVenue] = useState(initial || emptyVenue());
  const [busy, setBusy] = useState(false);
  const [crop, setCrop] = useState(null);
  const [preview, setPreview] = useState(false);
  const set = (key, value) => setVenue((v) => ({ ...v, [key]: value }));
  const save = async () => {
    if (formRef.current && !formRef.current.reportValidity()) throw new Error("Please correct the highlighted venue fields.");
    const body = Object.fromEntries(editable.map((key) => [key, venue[key]]));
    if (venue.id) body.version = venue.version;
    const updated = await venueRequest(
      `organizer/venues${venue.id ? `/${venue.id}` : ""}`,
      venue.id ? "PUT" : "POST",
      body,
    );
    setVenue(updated);
    await client.invalidateQueries({ queryKey: ["organizer-venues"] });
    return updated;
  };
  const action = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const refreshMedia = async () => {
    const latest = await venueRequest(`organizer/venues/${venue.id}`);
    setVenue((v) => ({ ...v, media: latest.media, version: latest.version }));
  };
  const upload = async (file, kind, extra = {}) => {
    const asset = await uploadTempImage(
      file,
      kind === "GALLERY" ? "VENUE_GALLERY" : "VENUE_COVER",
      venue.id,
    );
    await venueRequest(`organizer/venues/${venue.id}/media`, "POST", {
      storageKey: asset.storageKey || asset.key,
      kind,
      ...extra,
    });
    await refreshMedia();
  };
  const finishCrop = async (area) =>
    action(async () => {
      const config = crops[crop.index];
      const file = await createStandardFlyerFile(crop.file, area, config);
      await upload(file, config.kind);
      if (crop.index === 2) {
        URL.revokeObjectURL(crop.url);
        setCrop(null);
        toast.success("Cover crops saved");
      } else setCrop((c) => ({ ...c, index: c.index + 1 }));
    });
  return (
    <div className="venue-management space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {venue.id ? "Edit venue" : "Register a venue"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {venue.status || "DRAFT"} · Save before uploading photos.
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={onClose}>
          Back to venues
        </Button>
      </div>
      <form
        ref={formRef}
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          action(async () => {
            await save();
            toast.success("Venue saved");
          });
        }}
      >
        <fieldset disabled={busy} className="space-y-6">
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold">Venue details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Venue name *"
                value={venue.name}
                onChange={(v) => set("name", v)}
                required
                minLength={2}
                maxLength={150}
              />
              <Field
                label="Venue type *"
                value={venue.type}
                onChange={(v) => set("type", v)}
                required
                placeholder="Cafe, restaurant, club, event space…"
                minLength={2}
                maxLength={60}
              />
              <Field
                label="Public phone"
                value={venue.contact}
                onChange={(v) =>
                  set("contact", v.replace(/\D/g, "").slice(0, 10))
                }
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                title="Enter a 10-digit phone number"
                inputMode="tel"
              />
              <Field
                label="Public email"
                type="email"
                maxLength={254}
                value={venue.email}
                onChange={(v) => set("email", v)}
              />
              <Field
                label="Instagram URL"
                type="url"
                maxLength={500}
                pattern="https://(www[.])?instagram[.]com(/.*)?"
                title="Enter an HTTPS Instagram URL"
                value={venue.instagram}
                onChange={(v) => set("instagram", v)}
              />
              <Field
                label="Approximate cost for two (₹)"
                type="number"
                min="0"
                step="0.01"
                max="1000000"
                value={venue.costForTwo == null ? null : venue.costForTwo / 100}
                onChange={(v) =>
                  set("costForTwo", v == null ? null : Math.round(v * 100))
                }
              />
            </div>
            <label className="block text-sm">
              About
              <textarea
                value={venue.about}
                onChange={(e) => set("about", e.target.value)}
                maxLength={5000}
                rows={5}
                className="mt-1 w-full rounded-md border bg-background p-3"
              />
            </label>
          </section>
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold">Address</h2>
            <Field
              label="Full street address"
              maxLength={500}
              value={venue.fullAddress}
              onChange={(v) => set("fullAddress", v)}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                ["area", "Area"],
                ["city", "City"],
                ["state", "State"],
                ["postalCode", "Postal code"],
              ].map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={venue[key]}
                  maxLength={key === "postalCode" ? 6 : 200}
                  inputMode={key === "postalCode" ? "numeric" : undefined}
                  pattern={key === "postalCode" ? "[0-9]{6}" : undefined}
                  title={key === "postalCode" ? "Enter a six-digit postal code" : undefined}
                  onChange={(v) => set(key, key === "postalCode" ? v.replace(/\D/g, "").slice(0, 6) : v)}
                />
              ))}
              <Field
                label="Latitude (optional)"
                type="number"
                step="any"
                min="-90"
                max="90"
                value={venue.latitude}
                onChange={(v) => set("latitude", v)}
              />
              <Field
                label="Longitude (optional)"
                type="number"
                step="any"
                min="-180"
                max="180"
                value={venue.longitude}
                onChange={(v) => set("longitude", v)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              India · All opening and reservation times use Asia/Kolkata (IST).
            </p>
          </section>
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold">Amenities and cuisines</h2>
            <TagEditor
              label="Amenities"
              value={venue.amenities}
              onChange={(v) => set("amenities", v)}
              suggestions={[
                "Wi-Fi",
                "Outdoor seating",
                "Pet friendly",
                "Live music",
                "Parking",
                "Wheelchair accessible",
              ]}
            />
            <TagEditor
              label="Cuisines"
              value={venue.cuisines}
              onChange={(v) => set("cuisines", v)}
            />
          </section>
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold">Opening hours</h2>
            <p className="text-sm text-muted-foreground">
              A closing time earlier than opening means the following day. Equal
              times mean 24 hours.
            </p>
            {venueDays.map((day, i) => (
              <div
                key={day}
                className="grid sm:grid-cols-[120px_1fr] gap-2 border-b pb-3"
              >
                <span>{day}</span>
                <Intervals
                  value={
                    venue.openingHours.find((h) => h.day === i)?.intervals || []
                  }
                  onChange={(intervals) =>
                    set("openingHours", [
                      ...venue.openingHours.filter((h) => h.day !== i),
                      { day: i, intervals },
                    ])
                  }
                />
              </div>
            ))}
            <h6 className="font-medium">Special dates / closures</h6>
            {venue.closures.map((row, i) => (
              <div key={i} className="border rounded p-3 space-y-2">
                <Field
                  label="Date"
                  type="date"
                  value={row.date}
                  onChange={(date) =>
                    set(
                      "closures",
                      venue.closures.map((r, n) =>
                        n === i ? { ...r, date } : r,
                      ),
                    )
                  }
                />
                <Intervals
                  value={row.intervals}
                  onChange={(intervals) =>
                    set(
                      "closures",
                      venue.closures.map((r, n) =>
                        n === i ? { ...r, intervals } : r,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    set(
                      "closures",
                      venue.closures.filter((_, n) => n !== i),
                    )
                  }
                >
                  Remove date override
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                set("closures", [
                  ...venue.closures,
                  { date: "", intervals: [] },
                ])
              }
            >
              Add special date
            </Button>
          </section>
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            {venue.menu.map((category, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-3">
                <Field
                  label="Category"
                maxLength={100}
                  value={category.name}
                  onChange={(name) =>
                    set(
                      "menu",
                      venue.menu.map((c, n) => (n === i ? { ...c, name } : c)),
                    )
                  }
                  required
                />
                {category.items.map((item, j) => {
                  const update = (data) =>
                    set(
                      "menu",
                      venue.menu.map((c, n) =>
                        n === i
                          ? {
                              ...c,
                              items: c.items.map((dish, k) =>
                                j === k ? { ...dish, ...data } : dish,
                              ),
                            }
                          : c,
                      ),
                    );
                  return (
                    <div
                      key={j}
                      className="grid sm:grid-cols-2 gap-3 border-b pb-4"
                    >
                      <Field
                        label="Item name"
                        maxLength={150}
                        value={item.name}
                        onChange={(name) => update({ name })}
                        required
                      />
                      <Field
                        label="Price (₹)"
                        type="number"
                        min="0"
                        step="0.01"
                max="1000000"
                        value={item.price == null ? null : item.price / 100}
                        onChange={(price) =>
                          update({ price: price == null ? null : Math.round(price * 100) })
                        }
                        required
                      />
                      <Field
                        label="Description"
                        maxLength={500}
                        value={item.description}
                        onChange={(description) => update({ description })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          set(
                            "menu",
                            venue.menu.map((c, n) =>
                              n === i
                                ? {
                                    ...c,
                                    items: c.items.filter((_, k) => k !== j),
                                  }
                                : c,
                            ),
                          )
                        }
                      >
                        Remove item
                      </Button>
                    </div>
                  );
                })}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      set(
                        "menu",
                        venue.menu.map((c, n) =>
                          n === i
                            ? {
                                ...c,
                                items: [
                                  ...c.items,
                                  { name: "", description: "", price: 0 },
                                ],
                              }
                            : c,
                        ),
                      )
                    }
                  >
                    Add item
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      set(
                        "menu",
                        venue.menu.filter((_, n) => n !== i),
                      )
                    }
                  >
                    Remove category
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                set("menu", [
                  ...venue.menu,
                  {
                    name: "",
                    items: [{ name: "", description: "", price: 0 }],
                  },
                ])
              }
            >
              Add menu category
            </Button>
          </section>
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold">Reservations</h2>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={venue.reservationsEnabled}
                onChange={(e) => set("reservationsEnabled", e.target.checked)}
              />
              Accept reservation requests
            </label>
            <p className="text-sm text-muted-foreground">
              Every request needs email verification and your approval. Check
              your seating before confirming.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Maximum guests per request"
                required
                step="1"
                type="number"
                min="1"
                max="100"
                value={venue.maxGuests}
                onChange={(v) => set("maxGuests", v)}
              />
              <Field
                label="Minimum notice (minutes)"
                required
                step="1"
                type="number"
                min="0"
                max="10080"
                value={venue.leadMinutes}
                onChange={(v) => set("leadMinutes", v)}
              />
              <Field
                label="Booking window (days)"
                required
                step="1"
                type="number"
                min="1"
                max="365"
                value={venue.horizonDays}
                onChange={(v) => set("horizonDays", v)}
              />
              <label className="text-sm">
                Request interval
                <select
                  className="w-full border rounded bg-background p-2 mt-1"
                  value={venue.slotMinutes}
                  onChange={(e) => set("slotMinutes", Number(e.target.value))}
                >
                  {[15, 30, 60].map((n) => (
                    <option key={n} value={n}>
                      {n} minutes
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <Button type="submit">{busy ? "Saving…" : "Save venue"}</Button>
        </fieldset>
      </form>
      {venue.id && (
        <section className="rounded-xl border bg-card p-5 space-y-5">
          <h2 className="text-lg font-semibold">Cover and gallery</h2>
          <p className="text-sm text-muted-foreground">
            JPEG, PNG or WebP, up to 5 MB. Choose one cover image and adjust
            three crops. Upload only images you have permission to use.
          </p>
          <label className="block text-sm">
            Cover photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block mt-2 border-0"
              disabled={busy || !!crop}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) toast.error("Maximum 5 MB");
                  else
                    setCrop({ file, url: URL.createObjectURL(file), index: 0 });
                }
                e.target.value = "";
              }}
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            {venue.media
              ?.filter((m) => m.kind !== "GALLERY")
              .map((m) => (
                <div key={m.id}>
                  <img
                    src={m.url}
                    alt={m.kind}
                    className="w-full h-24 object-cover rounded"
                  />
                  <small>{m.kind}</small>
                </div>
              ))}
          </div>
          <label className="block text-sm">
            Gallery photos (up to 10)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy}
              className="block mt-2"
              onChange={(e) => {
                const files = [...e.target.files];
                e.target.value = "";
                if (files.length + (venue.media?.filter((m) => m.kind === "GALLERY").length || 0) > 10) {
                  toast.error("Maximum 10 gallery photos. Select fewer images.");
                  return;
                }
                action(async () => {
                  for (const file of files)
                    await upload(file, "GALLERY");
                  toast.success("Photos saved");
                });
              }}
            />
          </label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {venue.media
              ?.filter((m) => m.kind === "GALLERY")
              .map((m) => (
                <div key={m.id} className="border-0 p-0 rounded space-y-2">
                  <img
                    src={m.url}
                    alt={`${venue.name} gallery photo`}
                    className="h-32 w-full object-cover rounded"
                  />
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        action(async () => {
                          await venueRequest(
                            `organizer/venues/${venue.id}/media/${m.id}`,
                            "DELETE",
                          );
                          await refreshMedia();
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
      {venue.id && (
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={busy}
            onClick={() =>
              action(async () => {
                const saved = await save();
                const updated = await venueRequest(
                  `organizer/venues/${saved.id}/status`,
                  "PATCH",
                  { status: "PUBLISHED" },
                );
                setVenue(updated);
                toast.success("Venue published");
              })
            }
          >
            {venue.status === "PUBLISHED"
              ? "Save live changes"
              : "Publish venue"}
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setPreview(true)}
          >
            Preview
          </Button>
          {venue.status === "PUBLISHED" && (
            <Button asChild variant="outline">
              <Link to={venuePath(venue)} target="_blank">
                View public page
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            disabled={busy || venue.status === "ARCHIVED"}
            onClick={() => {
              if (
                window.confirm(
                  "Archive this venue? Future pending and confirmed reservations must be resolved first.",
                )
              )
                action(async () => {
                  setVenue(
                    await venueRequest(
                      `organizer/venues/${venue.id}/status`,
                      "PATCH",
                      { status: "ARCHIVED" },
                    ),
                  );
                  toast.success("Venue archived");
                });
            }}
          >
            Archive
          </Button>
        </div>
      )}
      {crop && (
        <FlyerCropDialog
          key={crop.index}
          open
          imageSrc={crop.url}
          imageName={crop.file.name}
          width={crops[crop.index].width}
          height={crops[crop.index].height}
          title={`Crop ${crops[crop.index].kind.toLowerCase()} cover (${crop.index + 1}/3)`}
          processing={busy}
          onCancel={() => {
            URL.revokeObjectURL(crop.url);
            setCrop(null);
          }}
          onConfirm={finishCrop}
        />
      )}
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95dvh] overflow-auto p-0">
          <DialogTitle className="sr-only">Venue preview</DialogTitle>
          <DialogDescription className="sr-only">
            Preview your venue page before publishing
          </DialogDescription>
          <VenueSurface venue={venue} preview />
        </DialogContent>
      </Dialog>
    </div>
  );
}
function TagEditor({ label, value, onChange, suggestions = [] }) {
  const [draft, setDraft] = useState("");
  const add = (text) => {
    const tag = text.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <p className="text-sm">{label}</p>
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Button
            key={tag}
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onChange(value.filter((v) => v !== tag))}
          >
            {tag} ×
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          aria-label={`Add ${label.toLowerCase()}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
        />
        <Button type="button" variant="outline" onClick={() => add(draft)}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => add(s)}
            >
              + {s}
            </Button>
          ))}
      </div>
    </div>
  );
}

export default function OrganizerVenues() {
  const enabled = useVenuesEnabled();
  const [editor, setEditor] = useState(null);
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const { data, error, isLoading } = useQuery({
    queryKey: ["organizer-venues", page],
    queryFn: () => venueRequest(`organizer/venues?page=${page}`),
    enabled,
  });
  const editVenue = async (id) => {
    try {
      setEditor(await venueRequest(`organizer/venues/${id}`));
    } catch (e) {
      toast.error(e.message);
    }
  };
  if (!enabled) return <p className="p-6">Venue management is not enabled.</p>;
  if (editor)
    return (
      <VenueEditor
        key={editor.id || "new"}
        initial={editor.id ? editor : null}
        onClose={() => {
          setEditor(null);
          client.invalidateQueries({ queryKey: ["organizer-venues"] });
        }}
      />
    );
  return (
    <div className="venue-management space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="text-2xl font-semibold">My venues</h1>
        <Button onClick={() => setEditor({})}>Register venue</Button>
      </div>
      {isLoading && <p>Loading venues…</p>}
      {error && <p role="alert">{error.message}</p>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.items.map((venue) => (
          <article
            key={venue.id}
            className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-sm hover:border-primary/30 transition-colors"
          >
            <h2 className="text-lg font-semibold">{venue.name}</h2>
            <p className="text-sm text-muted-foreground">
              {venue.city || "Address incomplete"} · {venue.status}
            </p>
            <Button variant="outline" onClick={() => editVenue(venue.id)}>
              Manage venue
            </Button>
          </article>
        ))}
      </div>
      {data?.total === 0 && (
        <p>Register your first venue to create its public page.</p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!data || page * data.limit >= data.total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
