import { DateTime } from "luxon";
import type { RuntimeConfig } from "../config";
import type { NamedEntity, ScheduleData } from "../types/schema";
import type { NormalizedOccurrence, NormalizedRoom, NormalizedSchedule } from "../types/view-model";
import { localizeText } from "./localize";
import { resolveApiStatus } from "./resolveStatus";

function buildNameMap(items: NamedEntity[], preferredLocale: string): Map<string, string> {
  return new Map(items.map((item) => [item.id, localizeText(item.displayName, preferredLocale, item.id)]));
}

function parseInZone(timestamp: string, timezone: string): DateTime {
  return DateTime.fromISO(timestamp, { setZone: true }).setZone(timezone);
}

export function normalizeSchedule(schedule: ScheduleData, config: RuntimeConfig): NormalizedSchedule {
  const timezone = schedule.event.timezone || config.timezone;
  const venuesById = new Map(
    schedule.venues.map((venue) => [
      venue.id,
      {
        name: localizeText(venue.displayName, config.preferredLocale, venue.id),
      },
    ]),
  );
  const roomsById = new Map<string, NormalizedRoom>();

  for (const room of schedule.rooms ?? []) {
    roomsById.set(room.id, {
      id: room.id,
      name: localizeText(room.displayName, config.preferredLocale, room.id),
      venueId: room.venueId ?? null,
      venueName: room.venueId ? venuesById.get(room.venueId)?.name ?? null : null,
    });
  }

  const hostNamesById = new Map(schedule.hosts.map((host) => [host.id, host.displayName]));
  const trackNamesById = buildNameMap(schedule.tracks, config.preferredLocale);
  const typeNamesById = buildNameMap(schedule.sessionTypes, config.preferredLocale);
  const labelNamesById = buildNameMap(schedule.labels, config.preferredLocale);
  const occurrences: NormalizedOccurrence[] = [];

  for (const session of schedule.sessions) {
    for (const timeSlot of session.timeSlots) {
      const start = parseInZone(timeSlot.startTime, timezone);
      const end = parseInZone(timeSlot.endTime, timezone);

      if (!start.isValid || !end.isValid) {
        console.warn("Skipping invalid time slot.", { sessionId: session.id, timeSlot });
        continue;
      }

      const roomIds = [...(timeSlot.roomIds ?? [])];
      const roomNames = roomIds.map((roomId) => roomsById.get(roomId)?.name ?? roomId);
      const hostIds = [...(timeSlot.hostIds ?? [])];
      const hostNames = hostIds.map((hostId) => hostNamesById.get(hostId) ?? hostId);
      const occurrenceId =
        timeSlot.id ?? `${session.id}__${timeSlot.startTime}__${timeSlot.endTime}__${roomIds.join(",")}`;

      occurrences.push({
        occurrenceId,
        sessionId: session.id,
        timeSlotId: timeSlot.id ?? null,
        title: localizeText(session.displayName, config.preferredLocale, session.id),
        description: session.description
          ? localizeText(session.description, config.preferredLocale, "")
          : null,
        startIso: start.toISO() ?? timeSlot.startTime,
        endIso: end.toISO() ?? timeSlot.endTime,
        startMs: start.toMillis(),
        endMs: end.toMillis(),
        roomIds,
        roomNames,
        hostIds,
        hostNames,
        typeName: session.typeId ? typeNamesById.get(session.typeId) ?? null : null,
        trackName: session.trackId ? trackNamesById.get(session.trackId) ?? null : null,
        labels: (session.labelIds ?? []).map((labelId) => labelNamesById.get(labelId) ?? labelId),
        apiStatus: resolveApiStatus(timeSlot["x-meta"], session["x-meta"]),
      });
    }
  }

  occurrences.sort((left, right) => {
    if (left.startMs !== right.startMs) {
      return left.startMs - right.startMs;
    }

    return left.title.localeCompare(right.title);
  });

  const occurrencesByRoomId = new Map<string, NormalizedOccurrence[]>();

  for (const occurrence of occurrences) {
    for (const roomId of occurrence.roomIds) {
      const roomOccurrences = occurrencesByRoomId.get(roomId) ?? [];
      roomOccurrences.push(occurrence);
      occurrencesByRoomId.set(roomId, roomOccurrences);
    }
  }

  const sourceUpdatedAtMs = schedule.source?.lastModifiedAt
    ? DateTime.fromISO(schedule.source.lastModifiedAt, { setZone: true }).toMillis()
    : null;

  return {
    eventId: schedule.event.id,
    eventName: localizeText(schedule.event.displayName, config.preferredLocale, schedule.event.id),
    timezone,
    updatedAtIso: schedule.updatedAt,
    updatedAtMs: DateTime.fromISO(schedule.updatedAt, { setZone: true }).toMillis(),
    sourceUpdatedAtIso: schedule.source?.lastModifiedAt ?? null,
    sourceUpdatedAtMs: Number.isFinite(sourceUpdatedAtMs) ? sourceUpdatedAtMs : null,
    roomsById,
    occurrences,
    occurrencesByRoomId,
  };
}
