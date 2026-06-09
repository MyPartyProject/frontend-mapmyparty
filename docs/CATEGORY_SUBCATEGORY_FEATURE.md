# Category and Subcategory Feature Documentation

## Summary

The category/subcategory feature is not purely frontend.

The selectable category/subcategory catalog is now centralized in frontend config for UI use, and mirrored in backend config for write validation.

The backend validates that category and subCategory are present for new events, validates that the pair belongs to the current Create Event catalog, stores canonical field values on the events table, returns both fields in event APIs, supports category/subCategory filters on some event list endpoints, and uses category for analytics grouping.

There is no database-backed category catalog, no backend enum, and no API endpoint that serves category options to the frontend.

## Ownership Map

| Area | Owner today | What happens |
| --- | --- | --- |
| Category option list | Frontend config + backend config | Frontend renders options from `src/config/eventCategories.js`; backend validates writes against its mirrored config. |
| Subcategory option list | Frontend config + backend config | Hard-coded under each category in shared-style config. Only one subcategory is selected even though state is named `selectedCategories`. |
| Event creation payload | Frontend and backend | Frontend maps `mainCategory` to backend `category`, and selected subcategory to backend `subCategory`. Backend requires and validates both. |
| Event update payload | Frontend and backend | Frontend sends updated `category` and `subCategory`; backend validates category fields only when they are included in the update. |
| Data persistence | Backend | `events.category` and `events.subCategory` are stored as strings in Prisma/Postgres. |
| Public listing filters | Mixed | Backend supports `category` and `subCategory` query filters, but the current public browse hook only sends `search` to the backend and applies category/subcategory filters client-side. |
| Organizer listing filters | Partial backend | `GET /api/event/organizer/:id` supports category/subCategory filters. `GET /api/event/my-events` currently ignores category/search/status filters even though the frontend hook has filter state for them. |
| Analytics | Backend | Analytics groups by `events.category`. Subcategory analytics is not implemented. |

## Category Catalog

Current create-event categories and subcategories:

| Category | Subcategories |
| --- | --- |
| Music | Live Concerts, Club Nights, Music Festivals, Bollywood, Hip Hop, Electronic, Melodic, Live Music, Metal, Rap, Music House, Techno, K-pop, Hollywood, POP, Punjabi, Disco, Rock, Afrobeat, Dance Hall, Thumri, Bolly Tech |
| Concerts | Live Concerts, Acoustic Concerts, Arena Shows, Orchestra Nights, DJ Concerts, Music Festival |
| Sports | Live Sports, Stadium Matches, Esports, Fitness Events, Marathons, Tournaments |
| Movies | Movie Screenings, Film Festivals, Premieres, Drive-In Cinema, Short Films |
| Plays | Plays, Drama Shows, Musical Theatre, Stage Performances, Classical Drama |
| Activities | Adventure Activities, Games Night, Family Activities, Community Events, Outdoor Activities, Experiences |
| Workshop | Comedy Shows, Theater Shows, Sports, Arts, Meeting, Conference, Seminar, Yoga, Cooking, Dance, Self Help, Consultation, Corporate Event, Communication |

Important: the browse-events UI has metadata for extra categories such as Business, Entertainment, Food, and Wellness because seeded/backend data may contain them. The create-event UI does not currently let organizers create those categories through the normal form, and backend write validation rejects them going forward.

## Frontend Implementation

### Create Event

Source: `frontend-mapmyparty/src/pages/CreateEvent.jsx`

The create-event form owns the main category and subcategory selection state:

- `mainCategory` stores the selected main category.
- `selectedCategories` stores an array, but the UI and API only use `selectedCategories[0]`.
- `EVENT_CATEGORY_HIERARCHY` contains the category-to-subcategory catalog.

Step 1 behavior:

1. User selects a main category.
2. Frontend resets the selected subcategory when main category changes.
3. Once `mainCategory` exists, the subcategory select appears.
4. Image upload controls are disabled until title, category, and subcategory are filled.
5. On save, the frontend creates or updates the backend event.

Validation in the UI:

- Event title is required.
- Main category is required.
- Subcategory is required.
- Cover image is required before advancing from Step 1.

Edit mode:

- Existing backend `event.category` hydrates `mainCategory`.
- Existing backend `event.subCategory` hydrates `selectedCategories[0]`.

Review/publish:

- The review step displays Category and Subcategory.
- The localStorage fallback event stores `category: mainCategory`.
- The localStorage fallback currently stores `subcategory` in lowercase, not `subCategory`.

### Event Service Payload Mapping

Source: `frontend-mapmyparty/src/services/eventService.js`

Create-event Step 1 sends JSON to:

`POST /api/event/create-event`

Payload shape:

```json
{
  "title": "Event title",
  "description": "Event description",
  "category": "Music",
  "subCategory": "Live Concerts",
  "type": "EXCLUSIVE"
}
```

Update-event Step 1 sends JSON to:

`PATCH /api/event/update-event/:eventId`

The same field mapping is used:

- `eventData.mainCategory` -> `category`
- `eventData.subcategory` -> `subCategory`

### Public Browse

Sources:

- `frontend-mapmyparty/src/components/dashboard/BrowseEvents.jsx`
- `frontend-mapmyparty/src/hooks/usePublicEvents.js`

The newer browse experience supports:

- URL query param `category`
- URL query param `subCategory`
- Category chips
- Subcategory chips scoped to the selected category
- Counts based on currently loaded catalog events
- Category grouping in the visible list

Important behavior:

- `BrowseEvents.jsx` builds URL params using display labels, for example `category=Music&subCategory=Live Concerts`.
- `usePublicEvents` stores `category` and `subCategory` filters in hook state.
- The hook fetches events from `/api/event`, but only sends `search` as a backend query param.
- Category/subCategory filtering is then applied client-side.

This means backend category filters exist, but the current public browse implementation is not using them for category/subcategory.

### Landing Page Category Sections

Source: `frontend-mapmyparty/src/landing/LandingPage.jsx`

The landing page defines category sections such as Live Concerts, Club Nights, Sports, Movies, Plays, Activities, Comedy Shows, and Theater Shows.

Each section has a `filters` object:

```js
{ category: "Music", subCategory: "Live Concerts" }
```

These filters are used to build links into the browse experience.

### Legacy Events Page

Sources:

- `frontend-mapmyparty/src/pages/Events.jsx`
- `frontend-mapmyparty/src/components/EventsPageTemplates/*.jsx`

The legacy `/events` page has a category select and uses `usePublicEvents`, but it does not expose subcategory filtering. Its category options are not aligned with the create-event catalog. For example, it includes categories like Conference, Food & Drink, and Arts & Culture.

### Organizer My Events

Sources:

- `frontend-mapmyparty/src/pages/MyEvents.jsx`
- `frontend-mapmyparty/src/hooks/useOrganizerEvents.js`

The organizer My Events page displays category and subcategory from backend event data.

It also filters local search by:

- title
- location
- category
- subCategory

The `useOrganizerEvents` hook has category filter state, but the backend `my-events` controller currently only consumes pagination query params.

### Event Detail and Search Surfaces

Category/subCategory are also displayed or used as metadata in:

- Public event detail pages
- Header search result metadata
- Live event pages
- Promoter event views
- Dashboard event cards

These surfaces consume event data; they do not own the category catalog.

## Backend Implementation

### Database Schema

Source: `server/prisma/schema.prisma`

The `events` model includes:

```prisma
category    String
subCategory String
categories  String[]
```

Indexes:

```prisma
@@index([category])
@@index([category, subCategory])
```

The normal create-event flow writes `category` and `subCategory`. The `categories` array exists but is not consistently maintained by the normal create/update flow.

### Backend Validation

Source: `server/src/validators/event.validator.js`

Create validator:

- `category` is required string.
- `subCategory` is required string.

Update validator:

- `category` is optional string.
- `subCategory` is optional string.

Create/update writes now run backend taxonomy validation against the current Create Event catalog. Direct API callers cannot create or explicitly update an event to an invalid category/subCategory pair.

### Event Creation

Sources:

- `server/src/routes/event.routes.js`
- `server/src/controllers/event/event.controller.js`
- `server/src/dao/event/event.dao.js`

Route:

`POST /api/event/create-event`

Middlewares:

- JSON body parser
- authentication required
- organizer or admin role required
- organizer write rate limit
- sanitizes title, description, and organizerNote

Controller checks:

- Request body passes Joi validation.
- User has an organizer profile.
- Organizer has bank details.
- Organizer is verified.
- Event title is unique for that organizer.

DAO:

- Creates an `events` row with the provided category/subCategory fields.
- Assigns publicId.
- Generates slug in the controller before persistence.

### Event Update

Route:

`PATCH /api/event/update-event/:id`

Backend behavior:

- Validates optional category/subCategory strings.
- Confirms the event belongs to the organizer.
- Updates provided fields.
- Invalidates organizer, event, public-event, analytics, and global event caches.

### Public Event Listing

Route:

`GET /api/event`

Backend query support:

- `category`
- `subCategory`
- `type`
- `organizerId`
- `search`
- `limit`

The DAO applies case-insensitive exact matching for category and subCategory. Search also checks category and subCategory with contains matching.

Important: the current public browse hook only sends `search` to this endpoint, not category/subCategory.

### Organizer Public Events by Organizer ID

Route:

`GET /api/event/organizer/:id`

Backend query support:

- `category`
- `subCategory`
- `type`
- `startDateFrom`
- `startDateTo`
- `search`

This endpoint applies category/subCategory filters in the DAO.

### My Events

Route:

`GET /api/event/my-events`

Current backend behavior:

- Finds organizer for authenticated user.
- Reads pagination query params.
- Returns organizer events with category and subCategory.

Current limitation:

- It does not pass category, status, search, or date filters into the DAO, even though `useOrganizerEvents` builds those query params.

### Public Event Detail

Public event detail endpoints return category and subCategory, including the slug-based public event core.

### Analytics

Routes and DAOs:

- `GET /api/analytics/events-by-category`
- organizer breakdown endpoint with `type=category`

Analytics groups events by `category`. There is no subcategory grouping endpoint today.

## Data Flow

### Create Flow

1. Organizer opens Create Event.
2. Frontend renders the hard-coded category list.
3. Organizer selects a category.
4. Frontend resets subcategory selection.
5. Frontend renders subcategories for the selected category.
6. Organizer selects one subcategory.
7. Frontend sends `category` and `subCategory` to backend.
8. Backend validates both are strings and required.
9. Backend stores them on the event row.
10. Later event reads return the stored values.

### Edit Flow

1. Frontend loads the event from backend.
2. `event.category` becomes `mainCategory`.
3. `event.subCategory` becomes `selectedCategories[0]`.
4. User edits category/subcategory.
5. Frontend sends updated `category` and `subCategory`.
6. Backend writes the new values.

### Browse Flow

1. Landing page or user action sets URL params.
2. `BrowseEvents.jsx` parses `category` and `subCategory`.
3. `usePublicEvents` fetches source events from backend.
4. The hook filters source events client-side by category/subCategory.
5. Browse page renders category chips, subcategory chips, counts, trending events, and grouped event cards.

## Current Strengths

- Category and subCategory are first-class stored event fields.
- Backend has indexes for category and category/subCategory lookups.
- Create and update flows correctly map frontend field names to backend field names.
- Backend public list and organizer-by-id list already support category/subCategory query filters.
- Public search includes category and subCategory.
- Analytics already supports category-level grouping.

## Gaps and Risks

1. Taxonomy is mirrored between frontend and backend config.
   - The UI and backend validation now agree, but there is still no backend catalog endpoint.
   - Future catalog edits must update both config files unless an API-backed catalog is added.

2. Legacy `/events` has a different category list.
   - It includes categories like Conference, Food & Drink, and Arts & Culture for browsing.
   - These are not valid write categories in the Create Event flow.

3. Public browse filters category/subcategory client-side.
   - Backend supports these filters, but `usePublicEvents` does not send them.
   - This can become expensive as event volume grows.
   - Counts are based on the loaded client catalog, not a backend aggregate.

4. `GET /api/event/my-events` ignores filter params.
   - The frontend hook tracks category/search/status/date filters.
   - The backend controller currently only uses page and limit.

5. Naming was historically inconsistent.
   - Backend canonical name is `subCategory`.
   - Frontend service calls now prefer `subCategory` while preserving compatibility with older `subcategory` fallback data.

6. The `categories` array field is not consistently maintained.
   - Some seed scripts populate it.
   - Normal create/update does not.
   - Some frontend fallback logic checks arrays that may not exist in API responses.

7. Extra categories exist in read/browse surfaces but not in Create Event.
   - Business, Entertainment, Food, Wellness appear in browse metadata or seed data.
   - Normal organizer create flow does not offer those categories.

8. No subcategory analytics.
   - Current analytics groups by category only.

## Recommended Future Direction

Completed small scoped cleanup without backend schema changes:

1. Moved the category catalog into one frontend config module.
2. Added backend validation against a mirrored catalog config.
3. Imported the frontend catalog in Create Event, Browse Events, and Landing Page.
4. Normalized event service payloads to prefer `subCategory`.

Recommended remaining cleanup:

1. Send `category` and `subCategory` to `/api/event` from `usePublicEvents`.
2. Update `GET /api/event/my-events` to consume the filters already sent by `useOrganizerEvents`.
3. Decide whether legacy `/events` should keep or remove non-create categories.

For a backend-owned taxonomy:

1. Add category/subcategory catalog tables or a backend config endpoint.
2. Expose `GET /api/event-categories`.
3. Add backend validation that confirms subCategory belongs to category.
4. Update create/update validators to reject invalid pairs.
5. Make frontend load the catalog from the backend instead of hard-coding it.
6. Add category/subcategory admin management only if non-developers need to change the catalog.

## Test Coverage Notes

Existing tests include event validator coverage and dedicated backend taxonomy helper tests.

Useful tests to add:

- Create event requires category and subCategory.
- Update event accepts category and subCategory.
- Public event list filters by category.
- Public event list filters by subCategory.
- Organizer event list filters by category/subCategory.
- Frontend browse uses canonical `subCategory` when filtering fallback data.
