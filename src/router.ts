export type ViewMode = "room" | "overview" | "compact" | "room-multi";

export interface RouteState {
  mode: ViewMode;
  roomId: string | null;
  roomIds: string[];
  windowMinutes: number;
  roomLimit: number | null;
  nowOverrideMs: number | null;
}

function parsePositiveInteger(input: string | null, fallbackValue: number): number {
  if (!input) {
    return fallbackValue;
  }

  const value = Number.parseInt(input, 10);
  return Number.isFinite(value) && value > 0 ? value : fallbackValue;
}

function parseOptionalPositiveInteger(input: string | null): number | null {
  if (!input) {
    return null;
  }

  const value = Number.parseInt(input, 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function normalizeRoomId(roomId: string | null): string | null {
  if (!roomId) {
    return null;
  }

  const trimmed = roomId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseRoomIds(query: URLSearchParams): string[] {
  const combined = [
    ...query.getAll("room"),
    ...(query.get("rooms") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ];
  const normalized = combined
    .map((roomId) => normalizeRoomId(roomId))
    .filter((roomId): roomId is string => roomId !== null);

  return Array.from(new Set(normalized));
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
  } else if (pathname.endsWith("/signage/room-multi") || pathname === "/room-multi") {
    mode = "room-multi";
  } else if (pathname.endsWith("/signage/compact") || pathname === "/compact") {
    mode = "compact";
  } else if (pathname.endsWith("/signage/overview") || pathname === "/overview") {
    mode = "overview";
  }

  return {
    mode,
    roomId: normalizeRoomId(query.get("room")),
    roomIds: parseRoomIds(query),
    windowMinutes: parsePositiveInteger(query.get("windowMinutes"), defaultWindowMinutes),
    roomLimit: parseOptionalPositiveInteger(query.get("rooms") ?? query.get("roomLimit")),
    nowOverrideMs: parseNowOverride(query.get("now")),
  };
}
