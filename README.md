# Awoostria Schedule Renderer

Small signage-oriented frontend for displaying Awoostria schedule data inside Xibo web widgets.

## What is implemented

- room, overview, and compact views
- polling-based schedule refresh
- schema validation with the local `schedule-schema` repository
- last-known-good cache in `localStorage`
- stale data warnings
- transparent page background
- left-column layout sized for a 16:9 display region
- runtime-configurable colors, fonts, and layout width through [public/config.json](/home/patrick/Projects/AwooScheduleRenderer/public/config.json)

## Routes

- `/signage/room?room=panel-1`
- `/signage/overview`
- `/signage/compact`

The app is a small SPA, so the nginx config rewrites unknown paths to `index.html`.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Regenerate the full convention mock

If `2026-awoo-events_sessions.json` changes, rebuild the generated convention fixture with:

```bash
npm run generate:mock:full
```

## Configuration

The runtime config lives in `public/config.json`.

Key options:

- `scheduleDataEndpoint`: API or mock-data URL
- `theme.pageBackgroundColor`: defaults to `transparent`
- `theme.surfaceColor` and `theme.surfaceStrongColor`: card backgrounds
- `layout.regionWidthVw`: roughly how much of the 16:9 screen width the renderer should occupy
- `layout.regionMaxWidthPx`: hard maximum width of the left column
- `layout.align`: `left` or `center`

## Dev background override

For quick layout testing, you can override the page background color from the URL without editing `config.json`.

Supported query params:

- `bg`
- `background`

Examples:

- `/signage/overview?bg=black`
- `/signage/overview?bg=0f172a`
- `/signage/overview?bg=%23e44763`
- `/signage/overview?bg=rgba(15,23,42,0.92)`

If no override is present, the renderer keeps using `theme.pageBackgroundColor` from `public/config.json`.

## Preview a specific convention time

Because the real mock convention is dated `2026-07-22` to `2026-07-25`, you can preview it with a fixed clock using the `now` query parameter.

Examples:

- `/signage/overview?now=2026-07-23T14:30:00+02:00`
- `/signage/room?room=main-stage&now=2026-07-24T20:00:00+02:00`
- `/signage/room?room=artist&now=2026-07-25T11:00:00+02:00`

You can combine both helpers:

- `/signage/overview?now=2026-07-23T14:30:00+02:00&bg=0f172a`

This means the renderer can sit in the left-side vertical strip while other signage content rotates behind or beside it.
