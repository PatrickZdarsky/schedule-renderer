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

export function formatRelativeWindow(targetMs: number, nowMs: number): string {
  const deltaMinutes = Math.round((targetMs - nowMs) / 60_000);

  if (deltaMinutes === 0) {
    return "Now";
  }

  if (deltaMinutes > 0) {
    if (deltaMinutes < 60) {
      return deltaMinutes === 1 ? "Starts in 1 min" : `Starts in ${deltaMinutes} min`;
    }

    const hours = Math.floor(deltaMinutes / 60);
    const minutes = deltaMinutes % 60;
    const hourLabel = hours === 1 ? "hour" : "hours";

    return minutes === 0
      ? `Starts in ${hours} ${hourLabel}`
      : `Starts in ${hours} ${hourLabel} ${minutes} min`;
  }

  const elapsed = Math.abs(deltaMinutes);
  return elapsed === 1 ? "Started 1 min ago" : `Started ${elapsed} min ago`;
}

export function formatEndsIn(endMs: number, nowMs: number): string {
  const deltaMinutes = Math.max(0, Math.ceil((endMs - nowMs) / 60_000));

  if (deltaMinutes <= 0) {
    return "Just ended";
  }

  return deltaMinutes === 1 ? "Ends in 1 min" : `Ends in ${deltaMinutes} min`;
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
