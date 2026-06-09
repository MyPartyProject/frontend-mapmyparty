export const EVENT_CATEGORY_HIERARCHY = Object.freeze({
  Music: Object.freeze([
    "Live Concerts",
    "Club Nights",
    "Music Festivals",
    "Bollywood",
    "Hip Hop",
    "Electronic",
    "Melodic",
    "Live Music",
    "Metal",
    "Rap",
    "Music House",
    "Techno",
    "K-pop",
    "Hollywood",
    "POP",
    "Punjabi",
    "Disco",
    "Rock",
    "Afrobeat",
    "Dance Hall",
    "Thumri",
    "Bolly Tech",
  ]),
  Concerts: Object.freeze([
    "Live Concerts",
    "Acoustic Concerts",
    "Arena Shows",
    "Orchestra Nights",
    "DJ Concerts",
    "Music Festival",
  ]),
  Sports: Object.freeze([
    "Live Sports",
    "Stadium Matches",
    "Esports",
    "Fitness Events",
    "Marathons",
    "Tournaments",
  ]),
  Movies: Object.freeze([
    "Movie Screenings",
    "Film Festivals",
    "Premieres",
    "Drive-In Cinema",
    "Short Films",
  ]),
  Plays: Object.freeze([
    "Plays",
    "Drama Shows",
    "Musical Theatre",
    "Stage Performances",
    "Classical Drama",
  ]),
  Activities: Object.freeze([
    "Adventure Activities",
    "Games Night",
    "Family Activities",
    "Community Events",
    "Outdoor Activities",
    "Experiences",
  ]),
  Workshop: Object.freeze([
    "Comedy Shows",
    "Theater Shows",
    "Sports",
    "Arts",
    "Meeting",
    "Conference",
    "Seminar",
    "Yoga",
    "Cooking",
    "Dance",
    "Self Help",
    "Consultation",
    "Corporate Event",
    "Communication",
  ]),
});

export const EVENT_CATEGORY_OPTIONS = Object.freeze(Object.keys(EVENT_CATEGORY_HIERARCHY));

export const getEventCategoryLookupKey = (value) =>
  typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";

export const EVENT_SUBCATEGORY_OPTIONS_BY_KEY = Object.freeze(
  Object.fromEntries(
    Object.entries(EVENT_CATEGORY_HIERARCHY).map(([category, subCategories]) => [
      getEventCategoryLookupKey(category),
      Object.freeze(subCategories.map((label) => ({ label, value: label }))),
    ])
  )
);

export const EVENT_SUBCATEGORY_OPTIONS = Object.freeze(
  Object.values(EVENT_SUBCATEGORY_OPTIONS_BY_KEY).flat()
);

export const normalizeEventSubCategoryValue = (value) => {
  const normalized = getEventCategoryLookupKey(value);
  if (!normalized) return null;

  const match = EVENT_SUBCATEGORY_OPTIONS.find(
    (option) => getEventCategoryLookupKey(option.value) === normalized
  );

  return match?.value || (typeof value === "string" ? value.trim() : null);
};

export const inferEventCategoryKeyFromSubCategory = (subCategory) => {
  const normalized = getEventCategoryLookupKey(subCategory);
  if (!normalized) return null;

  for (const [categoryKey, options] of Object.entries(EVENT_SUBCATEGORY_OPTIONS_BY_KEY)) {
    if (options.some((option) => getEventCategoryLookupKey(option.value) === normalized)) {
      return categoryKey;
    }
  }

  return null;
};

export const createEventCategoryFilter = (category, subCategory) => ({
  category,
  subCategory: normalizeEventSubCategoryValue(subCategory) || subCategory,
});
