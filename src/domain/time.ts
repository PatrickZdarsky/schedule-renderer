import { DateTime } from "luxon";

function buildDateTime(timestampMs: number, timezone: string): DateTime {
  return DateTime.fromMillis(timestampMs).setZone(timezone);
}

export function formatClockTime(timestampMs: number, timezone: string): string {
  return buildDateTime(timestampMs, timezone).toFormat("HH:mm");
}

export function formatDayLabel(timestampMs: number, timezone: string): string {
  return buildDateTime(timestampMs, timezone).toFormat("ccc d LLL");
}

export function formatTimeRange(startMs: number, endMs: number, timezone: string): string {
  return `${formatClockTime(startMs, timezone)} - ${formatClockTime(endMs, timezone)}`;
}

type RelativeTimeKind = "start" | "end";

export function formatRelativeWindow(
  targetMs: number,
  nowMs: number,
  kind: RelativeTimeKind = "start",
): string {
  const deltaMinutes =
    kind === "end"
      ? Math.ceil((targetMs - nowMs) / 60_000)
      : Math.round((targetMs - nowMs) / 60_000);

  if (deltaMinutes === 0) {
    return kind === "end" ? "Just ended" : "Now";
  }

  if (deltaMinutes > 0) {
    const action = kind === "end" ? "Ends" : "Starts";

    if (deltaMinutes < 60) {
      return deltaMinutes === 1 ? `${action} in 1 min` : `${action} in ${deltaMinutes} min`;
    }

    const hours = Math.floor(deltaMinutes / 60);
    const minutes = deltaMinutes % 60;
    const hourLabel = hours === 1 ? "hour" : "hours";

    return minutes === 0
      ? `${action} in ${hours} ${hourLabel}`
      : `${action} in ${hours} ${hourLabel} ${minutes} min`;
  }

  if (kind === "end") {
    return "Just ended";
  }

  const elapsed = Math.abs(deltaMinutes);
  return elapsed === 1 ? "Started 1 min ago" : `Started ${elapsed} min ago`;
}

export function formatLastUpdated(timestampMs: number | null, timezone: string): string | null {
  if (!timestampMs) {
    return null;
  }

  return buildDateTime(timestampMs, timezone).toFormat("HH:mm");
}

export function isSameLocalDay(timestampA: number, timestampB: number, timezone: string): boolean {
  const left = buildDateTime(timestampA, timezone);
  const right = buildDateTime(timestampB, timezone);
  return left.hasSame(right, "day");
}
