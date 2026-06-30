export type ViewMode = "room" | "overview" | "compact";

export interface RouteState {
  mode: ViewMode;
  roomId: string | null;
  windowMinutes: number;
  nowOverrideMs: number | null;
}

function parsePositiveInteger(input: string | null, fallbackValue: number): number {
  if (!input) {
    return fallbackValue;
  }

  const value = Number.parseInt(input, 10);
  return Number.isFinite(value) && value > 0 ? value : fallbackValue;
}

function normalizeRoomId(roomId: string | null): string | null {
  if (!roomId) {
    return null;
  }

  const trimmed = roomId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseNowOverride(input: string | null): number | null {
  if (!input) {
    return null;
  }

  const directParse = Date.parse(input);

  if (Number.isFinite(directParse)) {
    return directParse;
  }

  // URLSearchParams decodes "+" in timezone offsets as a space, so accept the
  // common pasted form `2026-07-22T14:00:00+02:00` even when it arrives as
  // `2026-07-22T14:00:00 02:00`.
  const normalizedOffset = input.replace(
    /(\d{2}:\d{2}:\d{2}) (\d{2}:\d{2})$/,
    "$1+$2",
  );
  const normalizedParse = Date.parse(normalizedOffset);

  return Number.isFinite(normalizedParse) ? normalizedParse : null;
}

export function parseRoute(location: Location, defaultWindowMinutes: number): RouteState {
  const query = new URLSearchParams(location.search);
  const pathname = location.pathname.replace(/\/+$/, "") || "/";

  let mode: ViewMode = "overview";

  if (pathname.endsWith("/signage/room") || pathname === "/room") {
    mode = "room";
  } else if (pathname.endsWith("/signage/compact") || pathname === "/compact") {
    mode = "compact";
  } else if (pathname.endsWith("/signage/overview") || pathname === "/overview") {
    mode = "overview";
  }

  return {
    mode,
    roomId: normalizeRoomId(query.get("room")),
    windowMinutes: parsePositiveInteger(query.get("windowMinutes"), defaultWindowMinutes),
    nowOverrideMs: parseNowOverride(query.get("now")),
  };
}
