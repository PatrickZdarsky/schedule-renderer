# Awoostria Schedule Renderer Implementation Plan

## 1. Goal

Build a small, reliable signage frontend that:

- fetches schedule data from the Awoostria schedule API
- renders room, overview, and compact signage pages for Xibo
- keeps working during temporary API outages
- looks like it belongs to Awoostria
- stays simple enough that a frontend beginner can maintain it

This plan is based on:

- [awoostria_schedule_renderer_design.md](./awoostria_schedule_renderer_design.md)
- [schedule-schema/docs/index.md](./schedule-schema/docs/index.md)
- [schedule-schema/schema/furry-event-schedule-schema.json](./schedule-schema/schema/furry-event-schedule-schema.json)
- [schedule-schema/schema/entity/session.schema.json](./schedule-schema/schema/entity/session.schema.json)
- [schedule-schema/examples/advanced-example.json](./schedule-schema/examples/advanced-example.json)
- the live `https://awoostria.at` homepage as inspected on 2026-06-18

## 2. Key Decisions

### Use a simple static frontend

Recommended approach:

- `Vite` for dev server and production build
- `TypeScript` for safer data handling
- plain DOM rendering functions instead of React/Vue
- plain CSS with CSS variables instead of Tailwind in this project
- `nginx` for static hosting
- optional `Dockerfile` and `compose.yml` for deployment

Why this is the best fit:

- no framework state magic to learn first
- fast startup and small bundle
- easy to inspect in DevTools
- easy to host and restart during the convention
- still structured enough to avoid messy ad-hoc code

### Keep the app "small but typed"

The renderer should have just a few layers:

1. config loading
2. API fetch + validation
3. normalization into a renderer-friendly model
4. view rendering
5. refresh, cache, and stale-state handling

No global state library, no SSR, no service worker, no advanced animation system.

## 3. What We Learned From the Schema

The local `schedule-schema` repo is a JSON Schema Draft 7 schema with example payloads. The important bits for the renderer are:

- top-level fields include `schemaVersion`, `updatedAt`, `event`, `venues`, `rooms`, `hosts`, and `sessions`
- the event contains `timezone`, which is critical for correct signage rendering
- localized text fields are objects like `{ "en-US": "Main Hall" }`
- sessions contain one or more `timeSlots`
- each time slot has `startTime`, `endTime`, optional `roomIds`, optional `hostIds`, and optional `x-meta`
- session-level `x-meta` is also allowed
- `x-meta` is intentionally open and allows arbitrary custom keys

Important practical implications:

- one session can appear multiple times because `timeSlots` is an array
- one time slot can point to multiple rooms
- one time slot can have no room at all, so the UI must not assume every item is room-bound
- one room page must be built from flattened time slot occurrences, not directly from raw sessions
- localization needs a fallback strategy because fields are dictionaries, not plain strings

### Awoostria-specific status extension

From the design doc, Awoostria will add status fields in `x-meta`:

- `timeSlot["x-meta"].timeslotStatus`
- fallback: `session["x-meta"].sessionStatus`

Expected values:

- `SCHEDULED`
- `DELAYED`
- `CANCELLED`
- `MOVED`

Renderer-computed states should remain separate from API states:

- `running`
- `ended`
- `starting-soon`
- `stale`
- `hidden`

### One schema caveat to account for

The current top-level schema file does not list `rooms` as a required field, even though room signage depends on it in practice. The renderer should therefore treat missing or empty room data as a validation failure for room-based views, even if upstream JSON Schema technically allows it.

## 4. Recommended Tech Stack

### Core

- `Vite`
- `TypeScript`
- `Luxon`
- `Ajv` + `ajv-formats`

### Dev quality

- `Vitest`
- `ESLint`
- `Prettier`

### Why these choices

`Luxon`:

- easier to understand than lower-level date math
- good timezone support
- a beginner can read `DateTime.fromISO(...).setZone(...)` more easily than custom `Date` logic

`Ajv`:

- directly matches the local JSON Schema repo
- catches bad API payloads before they break the display
- reduces guesswork around optional fields

Plain DOM rendering:

- avoids framework learning overhead
- keeps render logic explicit
- is fast enough for signage pages with low interaction and small data sizes

## 5. Styling Direction From Awoostria.at

The live Awoostria site currently presents:

- a dark background
- bright white main text
- soft gray secondary text
- a coral/pink primary accent
- large rounded cards
- soft shadowed surfaces
- hero imagery with a fantasy/adventure feel
- `Inter` as the main sans-serif font
- `Caveat` as a decorative accent font

### Practical brand tokens to start with

These are good initial tokens derived from the live site:

```css
:root {
  --color-bg: #18181b;
  --color-surface: #27272a;
  --color-surface-strong: #323238;
  --color-border-soft: rgba(255, 255, 255, 0.1);
  --color-text: #ffffff;
  --color-text-muted: #a1a1aa;
  --color-primary: #e44763;
  --color-primary-strong: #cd4059;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-success: #22c55e;
  --font-sans: "Inter var", Inter, system-ui, sans-serif;
  --font-accent: "Caveat", cursive;
  --radius-card: 24px;
}
```

### How to use the styling without over-copying the website

Do:

- match the dark card-based atmosphere
- use the coral accent for current items and key badges
- use rounded panels and gentle borders
- optionally use the accent font for tiny decorative labels only

Do not:

- use decorative fonts for event titles or times
- put text directly over busy artwork
- mirror the whole homepage layout
- introduce Tailwind just because the main site uses it

The signage UI should feel like a simplified sibling of the website, not a clone.

## 6. Architecture

### High-level flow

```text
config.json
    ->
fetch schedule JSON
    ->
validate against schema
    ->
normalize into flat occurrences + lookup maps
    ->
render selected view
    ->
cache last valid result
    ->
repeat every refresh interval
```

### Internal model

The most important architectural step is normalization.

Raw schedule JSON is not the best shape for signage rendering because views care about time slot occurrences, not just sessions. After each successful fetch, convert the payload into:

- `event`
- `roomsById`
- `hostsById`
- `venuesById`
- `sessionsById`
- `occurrences[]`
- `occurrencesByRoomId`

Each normalized occurrence should include at least:

- `occurrenceId`
- `sessionId`
- `timeSlotId`
- `title`
- `description`
- `start`
- `end`
- `roomIds`
- `roomNames`
- `hostNames`
- `status`
- `typeName`
- `trackName`
- `labels`
- `isCurrent`
- `isStartingSoon`
- `isEnded`

### Occurrence identity

Use this rule:

- prefer `timeSlot.id` when present
- otherwise use `session.id + startTime + endTime`

This matters for:

- diffing updates for smooth transitions
- detecting moved rooms or changed times
- keeping a stable key for DOM updates

## 7. URL and View Strategy

Supported URLs:

- `/signage/room?room=panel-1`
- `/signage/overview`
- `/signage/overview?windowMinutes=120`
- `/signage/compact`

Recommended implementation:

- one small app shell
- simple pathname parser
- one renderer function per view

Because the project is static-hosted, the web server should send unknown signage paths back to `index.html`.

Example nginx idea:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

This is simpler than maintaining separate duplicated entry points.

## 8. Data and Status Rules

### Status resolution

Recommended resolution order:

1. `timeSlot.x-meta.timeslotStatus`
2. `session.x-meta.sessionStatus`
3. default to `SCHEDULED`

Then add computed UI state based on current time:

- if now is between `start` and `end`, mark as `running`
- if start is within a short threshold, mark as `starting-soon`
- if end has passed, mark as `ended`

### Delay and moved handling

Important limitation:

The current documented Awoostria extension tells us the status value, but not necessarily:

- original start time
- delay length in minutes
- previous room name

So the renderer should be honest:

- show `DELAYED` and `MOVED` badges immediately
- only show `Delayed by X min` if the API later provides enough data, or if the difference can be safely inferred from the previous cached occurrence
- only show `Moved from Room A` if the previous version of the same occurrence clearly had a different room

Do not invent delay numbers or old room names when the data is missing.

### Stale handling

Track both:

- `lastFetchSucceededAt`
- payload `updatedAt`

Use `lastFetchSucceededAt` for connectivity/staleness decisions.
Use payload `updatedAt` or `source.lastModifiedAt` for the user-facing "last updated" label.

## 9. Rendering Rules Per View

### Room view

Show:

- room name
- current event or "No current event"
- next event
- later-today list if space allows
- status badges
- last updated timestamp
- stale warning when needed

Design priority:

- current event must dominate the layout
- large readable time and title
- very little secondary information

### Overview view

Show:

- current time
- next N minutes window
- rows grouped by time, or a room grid if that tests better on real screens
- clear badges for delayed, cancelled, moved
- last updated timestamp

Recommendation for v1:

- start with a time-sorted list across rooms
- add room-grid mode later if needed

This is easier to build and easier to test.

### Compact view

Show:

- only the most useful upcoming items
- short labels
- minimal metadata

This view should share the same normalized data and most of the same components, just with smaller templates.

## 10. Proposed Project Structure

```text
AwooScheduleRenderer/
├── plan.md
├── awoostria_schedule_renderer_design.md
├── schedule-schema/
├── public/
│   ├── config.json
│   └── assets/
│       ├── logo.svg
│       └── texture.webp
├── src/
│   ├── main.ts
│   ├── config.ts
│   ├── router.ts
│   ├── app.ts
│   ├── api/
│   │   ├── fetchSchedule.ts
│   │   ├── validateSchedule.ts
│   │   └── loadCachedSchedule.ts
│   ├── domain/
│   │   ├── normalizeSchedule.ts
│   │   ├── resolveStatus.ts
│   │   ├── localize.ts
│   │   ├── time.ts
│   │   └── diffOccurrences.ts
│   ├── state/
│   │   └── store.ts
│   ├── views/
│   │   ├── renderRoomView.ts
│   │   ├── renderOverviewView.ts
│   │   └── renderCompactView.ts
│   ├── ui/
│   │   ├── badges.ts
│   │   ├── cards.ts
│   │   └── staleBanner.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   └── signage.css
│   └── types/
│       ├── schema.ts
│       └── view-model.ts
├── tests/
│   ├── fixtures/
│   ├── normalizeSchedule.test.ts
│   ├── resolveStatus.test.ts
│   └── roomView.test.ts
├── Dockerfile
├── compose.yml
└── README.md
```

## 11. Implementation Plan

### Phase 1: Project skeleton

- initialize Vite + TypeScript
- add CSS token file and base layout
- add `config.json`
- add simple routing by pathname/query params
- show placeholder room and overview pages

Deliverable:

- working static app shell with the expected URLs

### Phase 2: Schema-backed fetching

- load API endpoint from `config.json`
- fetch schedule JSON
- validate with `Ajv` against local schema files
- surface validation failure as a non-destructive error state
- keep console logs detailed for debugging

Deliverable:

- validated data fetch with safe failure behavior

### Phase 3: Normalization layer

- flatten sessions into occurrence records
- build room and host lookup maps
- add localization fallback helper
- add current/next/later selectors

Deliverable:

- one clean internal data model that every view can use

### Phase 4: Room view

- implement main room signage template
- add status badges
- add current/next/later logic
- add graceful empty states

Deliverable:

- `/signage/room?room=...` ready for real display testing

### Phase 5: Overview and compact views

- implement time-window filtering
- add compact row templates
- test long titles and crowded schedules

Deliverable:

- overview screens usable in Xibo

### Phase 6: Resilience features

- localStorage cache for last valid payload
- stale warning thresholds
- fetch retry loop
- optional hard reload timer
- reduced-motion handling

Deliverable:

- display remains useful during temporary API or network issues

### Phase 7: Polish and deployment

- final Awoostria styling pass
- add logo/background assets
- add Docker + nginx setup
- test in the actual Xibo browser/player

Deliverable:

- convention-ready deployment candidate

## 12. Mock Data Plan

Create several fixture files in `tests/fixtures/` and optionally `public/mock-data/`.

Recommended fixture sets:

- `happy-path.json`: normal on-time convention day
- `status-heavy.json`: delayed, cancelled, and moved sessions
- `sparse-day.json`: mostly empty schedule and room gaps
- `multi-room.json`: sessions with multiple rooms and repeated time slots
- `offline-cache.json`: last known good payload for manual stale testing
- `long-titles.json`: deliberately difficult signage readability cases

When generating these fixtures, keep them schema-valid and include Awoostria-specific `x-meta` statuses.

## 13. Testing Strategy

### Unit tests

Focus on:

- status resolution
- localization fallback
- timezone conversion
- occurrence flattening
- room filtering
- current/next selection
- moved/delayed diff logic

### Manual display tests

Run on:

- normal desktop browser
- 1080p landscape
- portrait if needed later
- actual Xibo player/browser if possible

Manual checks:

- no unexpected scrolling
- readable at distance
- safe when API is offline
- safe when room is empty
- correct times even if local machine timezone is wrong

## 14. Beginner-Friendly Rules For The Codebase

These rules should be followed while implementing the project:

- prefer small modules with obvious names
- prefer pure functions for data transformation
- keep render functions mostly template-oriented
- avoid hidden framework conventions
- avoid premature abstractions
- write one short comment above non-obvious logic
- keep CSS tokens centralized
- keep all API-specific assumptions in one place

If something feels clever, it is probably the wrong choice for v1.

## 15. Recommended Defaults

Use these defaults unless real-world testing shows a need to change them:

```json
{
  "scheduleDataEndpoint": "https://example.invalid/schedule.json",
  "timezone": "Europe/Vienna",
  "preferredLocale": "en-US",
  "refreshSeconds": 20,
  "staleWarningSeconds": 120,
  "staleErrorSeconds": 600,
  "hardReloadMinutes": 180,
  "defaultWindowMinutes": 120,
  "showLogo": true
}
```

## 16. Open Questions

These do not block starting the project, but they should be answered before final rollout:

- What is the exact production API URL?
- Will delayed sessions provide only a status badge, or also changed timing metadata?
- Will moved sessions provide only new room IDs, or also old room metadata?
- Which logo and background assets should be bundled locally?
- Which browser engine/version is used by the real Xibo players?

## 17. Final Recommendation

Start with a plain TypeScript renderer on top of Vite, validate incoming data with the local JSON Schema using Ajv, normalize all sessions into flat time slot occurrences, and render three signage views from that single normalized model.

This gives us:

- a low-complexity codebase
- strong data safety
- good performance
- reliable offline/stale behavior
- a clean path to matching Awoostria's visual identity without overengineering

This is the right balance between maintainability and robustness for an internal convention signage tool.
