import type { ApiSessionStatus, DisplayOccurrenceState, NormalizedOccurrence } from "../types/view-model";

const knownStatuses = new Set<ApiSessionStatus>(["SCHEDULED", "DELAYED", "CANCELLED", "MOVED"]);

function readStatus(meta: Record<string, unknown> | undefined, key: string): ApiSessionStatus | null {
  const value = meta?.[key];

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toUpperCase() as ApiSessionStatus;
  return knownStatuses.has(normalizedValue) ? normalizedValue : null;
}

export function resolveApiStatus(
  timeSlotMeta: Record<string, unknown> | undefined,
  sessionMeta: Record<string, unknown> | undefined,
): ApiSessionStatus {
  return readStatus(timeSlotMeta, "timeslotStatus") ?? readStatus(sessionMeta, "sessionStatus") ?? "SCHEDULED";
}

export function getDisplayOccurrenceState(
  occurrence: NormalizedOccurrence,
  nowMs: number,
  startingSoonMinutes: number,
  endedGraceMinutes: number,
): DisplayOccurrenceState {
  const startingSoonWindowMs = startingSoonMinutes * 60_000;
  const endedGraceWindowMs = endedGraceMinutes * 60_000;
  const isCancelled = occurrence.apiStatus === "CANCELLED";
  const isCurrent = !isCancelled && nowMs >= occurrence.startMs && nowMs < occurrence.endMs;
  const isEnded = nowMs >= occurrence.endMs;
  const justEnded = !isCancelled && isEnded && nowMs < occurrence.endMs + endedGraceWindowMs;
  const isStartingSoon =
    !isCancelled &&
    !isCurrent &&
    nowMs < occurrence.startMs &&
    occurrence.startMs - nowMs <= startingSoonWindowMs;

  return {
    isCurrent,
    isEnded,
    justEnded,
    isStartingSoon,
    shouldHide: isEnded && !justEnded,
  };
}
