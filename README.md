# Awoostria Schedule Renderer

[![CI](https://github.com/PatrickZdarsky/schedule-renderer/actions/workflows/ci.yml/badge.svg)](https://github.com/PatrickZdarsky/schedule-renderer/actions/workflows/ci.yml)
[![Release Docker Image](https://github.com/PatrickZdarsky/schedule-renderer/actions/workflows/release.yml/badge.svg)](https://github.com/PatrickZdarsky/schedule-renderer/actions/workflows/release.yml)
[![Coverage Gate](https://img.shields.io/badge/coverage%20gate-80%25-brightgreen)](https://github.com/PatrickZdarsky/schedule-renderer/actions/workflows/ci.yml)
[![Docker Image](https://img.shields.io/badge/ghcr.io-ready-blue)](https://github.com/PatrickZdarsky/schedule-renderer/pkgs/container/schedule-renderer)

Small signage-oriented frontend for displaying Awoostria schedule data inside Xibo web widgets.

## What is implemented

- room, room-multi, overview, and compact views
- polling-based schedule refresh
- schema validation with the local `schedule-schema` repository
- last-known-good cache in `localStorage`
- stale data warnings
- transparent page background
- left-column layout sized for a 16:9 display region
- runtime-configurable colors, fonts, layout width, and card scale through [public/config.json](/home/patrick/Projects/AwooScheduleRenderer/public/config.json)

## Routes

- `/signage/room?room=panel-1`
- `/signage/room-multi?rooms=panel-1,main-stage`
- `/signage/overview`
- `/signage/overview?rooms=2`
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
npm run test:coverage
```

Coverage is enforced in CI with minimum thresholds of `80%` for lines/statements/functions and `70%` for branches.

## Docker

GitHub Actions publishes multi-architecture container images to GHCR from `main` and version tags.

```bash
docker pull ghcr.io/patrickzdarsky/schedule-renderer:latest
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
- `layout.uiScale`: scales the cards, spacing, and type together; use `0.9` to fit more or `1.1` to enlarge
- `layout.align`: `left` or `center`
- `/signage/room-multi?rooms=room-a,room-b`: shows those exact rooms in that exact order
- `rooms` query param on `/signage/overview`: limits the overview to the first N active rooms, for example `?rooms=2`

## Dev background override

For quick layout testing, you can override the page background color and UI scale from the URL without editing `config.json`.

Supported query params:

- `bg`
- `background`
- `scale`
- `uiScale`

Examples:

- `/signage/overview?bg=black`
- `/signage/overview?bg=0f172a`
- `/signage/overview?bg=%23e44763`
- `/signage/overview?bg=rgba(15,23,42,0.92)`
- `/signage/overview?scale=0.9`
- `/signage/overview?bg=0f172a&scale=0.88`

If no override is present, the renderer keeps using `theme.pageBackgroundColor` and `layout.uiScale` from `public/config.json`.

## Preview a specific convention time

Because the real mock convention is dated `2026-07-22` to `2026-07-25`, you can preview it with a fixed clock using the `now` query parameter.

Examples:

- `/signage/overview?now=2026-07-23T14:30:00+02:00`
- `/signage/room?room=main-stage&now=2026-07-24T20:00:00+02:00`
- `/signage/room-multi?rooms=main-stage,panel-1&now=2026-07-24T20:00:00+02:00`
- `/signage/room?room=artist&now=2026-07-25T11:00:00+02:00`

You can combine both helpers:

- `/signage/overview?now=2026-07-23T14:30:00+02:00&bg=0f172a`

This means the renderer can sit in the left-side vertical strip while other signage content rotates behind or beside it.
