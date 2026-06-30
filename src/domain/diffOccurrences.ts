import type { NormalizedSchedule, OccurrenceChangeInfo } from "../types/view-model";

export function diffOccurrences(
  previousSchedule: NormalizedSchedule | null,
  nextSchedule: NormalizedSchedule,
): Map<string, OccurrenceChangeInfo> {
  const changesByOccurrenceId = new Map<string, OccurrenceChangeInfo>();

  if (!previousSchedule) {
    return changesByOccurrenceId;
  }

  const previousById = new Map(previousSchedule.occurrences.map((occurrence) => [occurrence.occurrenceId, occurrence]));

  for (const occurrence of nextSchedule.occurrences) {
    const previousOccurrence = previousById.get(occurrence.occurrenceId);

    if (!previousOccurrence) {
      continue;
    }

    const roomNamesChanged =
      previousOccurrence.roomNames.join("|") !== occurrence.roomNames.join("|");
    const timesChanged =
      previousOccurrence.startMs !== occurrence.startMs || previousOccurrence.endMs !== occurrence.endMs;

    if (!roomNamesChanged && !timesChanged) {
      continue;
    }

    changesByOccurrenceId.set(occurrence.occurrenceId, {
      previousStartMs: previousOccurrence.startMs,
      previousEndMs: previousOccurrence.endMs,
      previousRoomNames: previousOccurrence.roomNames,
    });
  }

  return changesByOccurrenceId;
}
