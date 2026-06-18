# Awoostria Digital Signage Schedule Renderer

## 1. Purpose

This document describes a small internal web frontend for rendering Awoostria convention schedule data so it can be embedded into Xibo layouts.

The frontend is intentionally limited in scope:

- It renders schedule views only.
- It does not manage maps, announcements, emergency pages, sponsor slides, general info pages, or other rotating content.
- It does not provide an admin interface.
- It consumes already-prepared schedule API data and turns it into signage-friendly HTML pages.
- Xibo remains responsible for arranging layouts, rotations, map pages, announcement pages, and other screen content.

The goal is to make schedule information readable, reliable, and visually consistent with the Awoostria website and event branding while keeping the technical system simple enough to operate during the convention.

---

## 2. High-Level Concept

```text
Awoostria.at Schedule API
        ↓
Schedule Renderer Website
        ↓
Xibo Web Page Widgets
        ↓
Room Displays + Info Screens
```

The renderer should expose a small set of URLs that Xibo can embed as web regions.

Example URLs:

```text
/signage/room?room=main-stage
/signage/room?room=panel-1
/signage/room?room=panel-2
/signage/overview
/signage/overview?windowMinutes=120
/signage/compact
```

The renderer should not contain schedule editing logic. It should only display the effective schedule returned by the API.

---

## 3. Scope

### In Scope

- Room-specific schedule display.
- General upcoming schedule overview.
- “Now and next” schedule overview across all rooms.
- Status display e.g. Delayed
- Automatic refresh / polling.
- Smooth animations on data change
- Stale data warnings.
- Offline fallback using the last known valid response.
- Styling aligned with Awoostria branding.
- Display-oriented responsive layouts for landscape and portrait screens.

### Out of Scope

- Map rendering.
- Announcement management.
- Emergency page management.
- Sponsor slides.
- General con info pages.
- Admin UI.
- Manual schedule editing.
- Pretalx synchronization.
- Xibo layout orchestration.
- Authentication for admin functions.

Those concerns should stay in Xibo, ScheduleControl, or another dedicated backend/admin system.

---

## 4. Intended Xibo Usage

Xibo should embed the renderer using web page widgets.

Recommended Xibo setup:

- Use one web widget per schedule area.
- Use URL parameters to select the schedule mode.
- Let Xibo handle non-schedule content rotation.
- Keep schedule widgets on screen long enough that attendees can read them.
- Avoid embedding a full interactive website with navigation.

Example:

```text
Room display outside Panel Room 1:
  Full-screen web widget:
  /signage/room?room=panel-1

Info screen:
  Region A:
    /signage/overview?windowMinutes=120

  Other Xibo regions:
    Map
    Announcements
    Telegram QR code
    Safety info
```

The renderer should behave like a display component, not like a normal website.

---

## 5. Required Views

## 5.1 Room View

Purpose: display the current and next events for one specific room.

Example URL:

```text
/signage/room?room=panel-1
```

Recommended content:

- Room name.
- Current event.
- Current event time range.
- “Ends in …” or “Started … ago”.
- Delay indicator if applicable.
- Cancellation indicator if applicable.
- Room change indicator if applicable.
- Next event.
- Small “later today” list.
- Last updated timestamp.

Example structure:

```text
PANEL ROOM 1

NOW
14:15 – 15:00
Fursuit Photography 101
Delayed by 15 min

NEXT
15:15 – 16:00
How to Survive Your First Con

LATER TODAY
16:30  Art Jam
17:45  Community Meetup

Updated 14:32
```

### Room View Design Priorities

- The room name must be obvious from a distance.
- The current event must dominate the layout.
- The next event should be clearly secondary.
- Only show later events if there is enough space.
- Do not show dense full-day tables on room displays.
- Avoid long descriptions.
- Truncate text cleanly rather than shrinking it too much.

---

## 5.2 Overview View

Purpose: show the upcoming schedule across multiple rooms.

Example URL:

```text
/signage/overview?windowMinutes=120
```

Recommended content:

- Current time.
- Schedule window, e.g. “Next 2 hours”.
- Rows grouped by time or room.
- Event title.
- Room.
- Delay/cancellation/room-change badges.
- Last updated timestamp.

Possible layout:

```text
UPCOMING PROGRAM
Next 2 hours

14:15  Panel Room 1     Fursuit Photography 101
14:30  Main Stage       Dance Workshop
15:00  Workshop Room    Prop Making 101
15:15  Panel Room 2     Writing Better Characters
```

Alternative room-grid layout:

```text
Room           Now                       Next
Main Stage     Opening Ceremony          Dance Workshop 15:00
Panel 1        Fursuit Photography       First Con Survival 15:15
Panel 2        No current event          Character Writing 15:15
Workshop       Prop Making               Closed after 16:00
```

### Overview View Design Priorities

- Prioritize what attendees need to decide where to go next.
- Use compact but readable rows.
- Avoid excessive detail.
- Make changed events visually obvious.
- Avoid scrolling if possible.
- Prefer fewer, larger rows over many tiny rows.

---

## 5.3 Compact / Embedded View

Purpose: allow Xibo to place a smaller schedule widget beside other content.

Example URL:

```text
/signage/compact?windowMinutes=60
```

Recommended content:

- Upcoming events only.
- No descriptions.
- Minimal badges.
- Strong time and room labels.

This is useful when Xibo displays the map, Telegram QR code, or announcements next to the schedule.

---

## 6. Schedule API
The API  schema is this: https://github.com/FurryApp/event-schedule-schema
The endpoint doesnt need authentication.
Additionally in the "x-meta" field for each session time slot will be an additional field called "timeslotStatus" which will be one of the following:
- SCHEDULED
- DELAYED
- CANCELLED
- MOVED (Indicating room was changed too)
If the timeSlot doesn't have a Status attached, fall back to the session one called "sessionStatus" in the "x-meta" of the session. 

---

## 7. Test API Data
Generate some test data to be able to test the system without using the production API endpoint.
Look up other furry conventions and generate a few different data suites.


---

## 9. Event Status Handling

The frontend should support at least these event states:

| Status | Display Behavior |
|---|---|
| `scheduled` | Normal display |
| `running` | Highlight as current event. This needs to be calculated by the renderer and is not provided by the API |
| `delayed` | Show delay badge and effective time |
| `cancelled` | Show clearly, but usually de-emphasize in upcoming lists |
| `moved` | Show new room and “moved from …” if relevant |
| `ended` | Usually hidden, except for short grace periods |
| `hidden` | Never display |

Delay badges should be more visible than normal metadata, but less visually dominant than emergency or critical Xibo content.

---

## 10. Time Handling

All schedule data should use timezone-aware timestamps.

Convention-local timezone:

```text
Europe/Vienna
```

Rules:

- Render all times in convention local time.
- Do not rely on the Xibo player system timezone being correct.
- Display the current time somewhere on overview screens.
- Use a small grace period after an event ends before fully removing it.
- Treat “no event” as a normal state, not an error.

Suggested grace periods:

| Situation | Suggested Handling |
|---|---|
| Event just ended | Keep visible for 1–2 minutes with “Just ended” or switch softly |
| No current event | Show “No current event” and highlight next |
| Next event starts soon | Show “Starts in X min” |
| Large delay | Show delayed event prominently and keep original/effective time clear |

---

## 11. Refresh and Caching Strategy

The signage frontend should not depend only on Xibo’s widget refresh behavior.

Recommended frontend behavior:

```text
Every 15–30 seconds:
  Fetch fresh schedule JSON.

On fetch failure:
  Keep showing the last valid data.
  Show a stale data warning.
```

Recommended stale-state thresholds:

| Data Age | Display |
|---|---|
| < 2 minutes | Normal |
| 2–10 minutes | Subtle “Updated …” warning |
| > 10 minutes | Visible “Schedule may be outdated” warning |
| > 30 minutes | Strong warning / fallback state |

Important principle:

> Never blank the display just because the API is temporarily unavailable.

---

## 12. Error and Empty States

The renderer must handle boring but common cases gracefully.

### API Unavailable

Display last known data if available:

```text
Schedule may be outdated
Last successful update: 14:17
```

If no cached data exists:

```text
Schedule currently unavailable
Please check the official schedule or ask ConOps.
```

### No Current Event

```text
No current event in this room

Next:
15:15 — How to Survive Your First Con
```

### No More Events Today

```text
No more events in this room today
```

### Event Cancelled

```text
Cancelled
Fursuit Photography 101
```

Avoid showing cancelled events as if they were normal upcoming events.

---

## 13. Deployment

The service should be easy to host and restart.

Recommended deployment options:

- Small static frontend served by nginx.
- Docker Compose deployment.

A simple static frontend is probably sufficient if the API already provides display-ready JSON.

Example deployment shape:

```text
schedule-renderer
├── nginx
├── static frontend files
└── config.json
```

Example config:

```json
{
  "scheduleDataEndpoint": "https://schedule-api.internal.example/schedule/export",
  "eventId": "awoostria-2026",
  "timezone": "Europe/Vienna",
  "refreshSeconds": 20,
}
```

---

## 14. Xibo Compatibility Notes

When testing in Xibo, verify:

- The embedded browser supports the JavaScript features used.
- The page does not require user interaction.
- The page works after player restart.
- The page recovers from network loss.
- Text remains readable on the actual display resolution.
- The page does not rely on browser-local fonts that are missing on the player.
- The page still looks correct with overscan or slight cropping.
- The page does not scroll unexpectedly.
- The page does not show cookie banners, login screens, or browser errors.

The renderer should be kiosk-safe.

---

# Styling Guide

## 15. Visual Direction

The schedule renderer should visually feel like it belongs to Awoostria, but it does not need to duplicate the full public website.

The public Awoostria site currently presents the convention as a polished, immersive furry convention brand with strong hero imagery, cards, rounded content areas, a friendly tone, and a fantasy/adventure theme for Awoostria 2026. The renderer should borrow that feeling while optimizing for signage readability.

Design keywords:

```text
Friendly
Warm
Readable
Playful
Fantasy / adventure
Modern convention website
Rounded
High contrast
Not corporate
Not sterile
```

The 2026 theme direction should allow subtle “ancient / mystical / adventure” styling, but the schedule must remain clean and readable.

---

## 16. Color Direction

Exact brand colors should be sampled from the current Awoostria.at website CSS/assets before implementation.

Until exact tokens are available, use semantic color tokens rather than hardcoded color names:

```css
:root {
  --color-bg: /* dark page background */;
  --color-surface: /* card background */;
  --color-surface-strong: /* highlighted card */;
  --color-text: /* primary text */;
  --color-text-muted: /* secondary text */;
  --color-primary: /* Awoostria primary accent */;
  --color-secondary: /* secondary accent */;
  --color-warning: /* delay / warning */;
  --color-danger: /* cancellation */;
  --color-success: /* running / on-time */;
}
```

Recommended visual approach:

- Dark or deep background for high contrast.
- Bright primary accent for “NOW” and important time labels.
- Softer secondary accent for “NEXT”.
- Warm warning color for delays.
- Strong danger color for cancellations.
- Avoid using too many track colors at once.

Example semantic usage:

| Element | Color Token |
|---|---|
| Page background | `--color-bg` |
| Cards | `--color-surface` |
| Current event card | `--color-surface-strong` |
| Main headings | `--color-text` |
| Secondary metadata | `--color-text-muted` |
| Current event badge | `--color-primary` |
| Delay badge | `--color-warning` |
| Cancelled badge | `--color-danger` |

---

## 17. Typography

Prioritize display readability over exact website typography.

Recommended:

- Use the same or similar font family as the Awoostria homepage if available.
- Otherwise use a clean sans-serif fallback.
- Use large, bold headings.
- Use tabular numbers for times if possible.
- Avoid thin font weights on displays.

Example CSS:

```css
body {
  font-family: var(--font-brand, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
}

.time {
  font-variant-numeric: tabular-nums;
}
```

Recommended approximate sizes for 1080p landscape:

```css
.room-name {
  font-size: clamp(48px, 5vw, 84px);
}

.event-title.current {
  font-size: clamp(56px, 6vw, 96px);
}

.event-title.next {
  font-size: clamp(36px, 4vw, 64px);
}

.time-range {
  font-size: clamp(32px, 3vw, 54px);
}

.metadata {
  font-size: clamp(22px, 2vw, 34px);
}
```

---

## 18. Layout Style

Use large rounded cards, generous spacing, and clear visual hierarchy.

Recommended layout principles:

- One primary card for the current event.
- One secondary card for the next event.
- Smaller list for later events.
- Consistent padding.
- No dense tables on room displays.
- Overview screens may use table-like layouts, but with large rows.

Example room layout:

```text
┌────────────────────────────────────────────┐
│ PANEL ROOM 1                               │
├────────────────────────────────────────────┤
│ NOW                                        │
│ 14:15 – 15:00                              │
│ Fursuit Photography 101                    │
│ Delayed by 15 min                          │
├────────────────────────────────────────────┤
│ NEXT                                       │
│ 15:15 – 16:00                              │
│ How to Survive Your First Con              │
├────────────────────────────────────────────┤
│ Later: 16:30 Art Jam · 17:45 Meetup        │
└────────────────────────────────────────────┘
```

---

## 19. Shape and Decoration

Use decoration carefully. The schedule is functional content.

Good:

- Rounded cards.
- Soft shadows or subtle borders.
- Small paw/star/sparkle accents if consistent with Awoostria branding.
- Subtle background texture or gradient.
- Small logo in corner.
- Thematic but unobtrusive separators.

Avoid:

- Heavy animations.
- Busy illustrated backgrounds behind text.
- Low-contrast text over artwork.
- Too many icons.
- Tiny decorative text.
- Track colors that fight with delay/cancel colors.

The display should feel like Awoostria, but the schedule must remain legible first.

---

## 20. Branding Elements

Recommended branding elements:

- Awoostria logo in a corner or header.
- Room name in a prominent header.
- Accent colors matching the website.
- Rounded buttons/badges similar to the website’s general feel.
- Optional subtle 2026 theme motif.

Do not overuse the logo. On room displays, the room name and current event are more important.

---

## 21. Badge Style

Badges should be short and visually distinct.

Examples:

```text
NOW
NEXT
DELAYED 15 MIN
CANCELLED
MOVED
STARTS SOON
```

Recommended badge style:

```css
.badge {
  border-radius: 999px;
  padding: 0.25em 0.65em;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

Badge hierarchy:

| Badge | Visual Priority |
|---|---|
| `CANCELLED` | High |
| `DELAYED` | High |
| `MOVED` | Medium-high |
| `NOW` | Medium |
| `NEXT` | Medium |
| Track/language | Low |

---

## 22. Animation

Animations should be subtle and optional.

Allowed:

- Gentle fade when data updates.
- Small pulse for “Starting soon”.
- Smooth transition between old and new event state.

Avoid:

- Constant motion.
- Marquees.
- Rapid blinking.
- Long transitions.
- Anything that makes screenshots hard to read.

For accessibility and player stability, support reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 23. Readability Rules

Minimum rules:

- No text smaller than approximately 22–24px on 1080p screens.
- Event titles should be readable from several meters away.
- Avoid more than two lines for event titles if possible.
- Prefer truncation over shrinking text too far.
- Use high contrast between text and background.
- Make delay/cancelled status visible at a glance.
- Keep enough padding so cropped Xibo regions still look acceptable.

For long titles:

```css
.event-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

# Implementation Notes

## 24. Suggested Frontend Logic

Pseudo-code:

```text
on page load:
  read mode and room from URL parameters
  load local cached schedule if available
  fetch current schedule from API
  render schedule

every refreshSeconds:
  fetch current schedule from API
  if successful:
    store response in localStorage
    render response
  if failed:
    keep previous display
    show stale warning

every hardReloadMinutes:
  reload page
```

---

## 25. Suggested File Structure

```text
schedule-renderer/
├── public/
│   ├── index.html
│   ├── config.json
│   └── assets/
│       ├── logo.svg
│       └── background.webp
├── src/
│   ├── api.ts
│   ├── time.ts
│   ├── renderRoom.ts
│   ├── renderOverview.ts
│   ├── status.ts
│   └── styles.css
├── Dockerfile
├── compose.yml
└── README.md
```

---

## 26. Configuration

The renderer should be configurable without rebuilding.

Recommended config values:

```json
{
  "scheduleDataEndpoint": "https://schedule-api.internal.example/schedule/export",
  "eventId": "awoostria-2026",
  "timezone": "Europe/Vienna",
  "refreshSeconds": 20,
  "staleWarningSeconds": 120,
  "staleErrorSeconds": 600,
  "defaultWindowMinutes": 120,
  "showLogo": true
}
```

---

## 27. Testing Checklist

Before the convention:

- Test every room display URL.
- Test overview URL.
- Test compact URL if used.
- Test with long event titles.
- Test with empty rooms.
- Test with cancelled events.
- Test with delayed events.
- Test with moved events.
- Test with API offline.
- Test after Xibo player restart.
- Test with real display resolution.
- Test from the actual convention network.
- Test with incorrect local player timezone.
- Test browser memory stability over several hours.
- Test hard reload behavior.
- Test if Xibo crops the web region.
- Test whether fonts load correctly on the player.

---

## 28. Minimal First Version

A good first implementation should include:

- `/signage/room?room=...`
- `/signage/overview`
- Configurable API base URL.
- Polling refresh.
- Last updated timestamp.
- Basic stale warning.
- Support for scheduled, delayed, cancelled, and moved states.
- Awoostria-like dark/card styling.
- Responsive 1080p landscape layout.

This is enough to validate the concept with Xibo.

---

## 29. Later Improvements

Possible later additions:

- Portrait-specific layout.
- Per-room theme/accent.
- Better track icons.
- QR code integration if Xibo does not handle it.
- Animated transitions.
- Connection status indicator.
- Render mode presets for different screen sizes.
- Snapshot/debug endpoint.
- Optional static fallback schedule bundled into the frontend image.
- Support for event category filtering.
- Support for multi-day navigation.

---

## 30. Core Principle

The schedule renderer should remain simple:

```text
ScheduleControl decides what is true.
The schedule renderer decides how to display it.
Xibo decides where and when to show it.
```

Avoid duplicating schedule logic in the frontend. The frontend should be reliable, readable, and easy to restart during the convention.
