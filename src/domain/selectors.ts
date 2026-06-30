import type { RuntimeConfig } from "../config";
import type {
  DisplayOccurrenceState,
  NormalizedOccurrence,
  NormalizedRoom,
  NormalizedSchedule,
  OccurrenceChangeInfo,
  StaleLevel,
} from "../types/view-model";
import { getDisplayOccurrenceState } from "./resolveStatus";
import { isSameLocalDay } from "./time";

export interface PresentedOccurrence {
  occurrence: NormalizedOccurrence;
  state: DisplayOccurrenceState;
  changeInfo: OccurrenceChangeInfo | null;
  delayText: string | null;
  movedFromText: string | null;
}

export interface RoomViewModel {
  room: NormalizedRoom | null;
  current: PresentedOccurrence | null;
  next: PresentedOccurrence | null;
  later: PresentedOccurrence[];
  emptyMessage: string | null;
}

export interface OverviewRoomModel {
  room: NormalizedRoom;
  current: PresentedOccurrence | null;
  upcoming: PresentedOccurrence | null;
}

function buildOccurrencePresentation(
  occurrence: NormalizedOccurrence,
  nowMs: number,
  config: RuntimeConfig,
  changesByOccurrenceId: Map<string, OccurrenceChangeInfo>,
): PresentedOccurrence {
  const state = getDisplayOccurrenceState(
    occurrence,
    nowMs,
    config.startingSoonMinutes,
    config.endedGraceMinutes,
  );
  const changeInfo = changesByOccurrenceId.get(occurrence.occurrenceId) ?? null;

  let delayText: string | null = null;

  if (occurrence.apiStatus === "DELAYED" && changeInfo?.previousStartMs) {
    const deltaMinutes = Math.round((occurrence.startMs - changeInfo.previousStartMs) / 60_000);

    if (deltaMinutes > 0) {
      delayText = `+${deltaMinutes} min`;
    }
  }

  let movedFromText: string | null = null;

  if (
    occurrence.apiStatus === "MOVED" &&
    changeInfo?.previousRoomNames &&
    changeInfo.previousRoomNames.join("|") !== occurrence.roomNames.join("|")
  ) {
    movedFromText = changeInfo.previousRoomNames.join(", ");
  }

  return {
    occurrence,
    state,
    changeInfo,
    delayText,
    movedFromText,
  };
}

function filterVisibleOccurrences(occurrences: PresentedOccurrence[]): PresentedOccurrence[] {
  return occurrences.filter((item) => !item.state.shouldHide);
}

export function getRoomViewModel(
  schedule: NormalizedSchedule,
  roomId: string,
  nowMs: number,
  config: RuntimeConfig,
  changesByOccurrenceId: Map<string, OccurrenceChangeInfo>,
): RoomViewModel {
  const room = schedule.roomsById.get(roomId) ?? null;
  const roomOccurrences = schedule.occurrencesByRoomId.get(roomId) ?? [];
  const presented = filterVisibleOccurrences(
    roomOccurrences.map((occurrence) =>
      buildOccurrencePresentation(occurrence, nowMs, config, changesByOccurrenceId),
    ),
  );

  const current =
    presented.find((item) => item.state.isCurrent) ??
    presented.find((item) => item.state.justEnded) ??
    null;

  const future = presented.filter((item) => item.occurrence.startMs >= nowMs && item !== current);
  const futureToday = future.filter((item) =>
    isSameLocalDay(item.occurrence.startMs, nowMs, schedule.timezone),
  );
  const next = futureToday[0] ?? null;
  const later = futureToday.slice(next ? 1 : 0, 6);

  let emptyMessage: string | null = null;

  if (!room) {
    emptyMessage = "This room could not be found in the current schedule.";
  } else if (presented.length === 0) {
    emptyMessage = "No sessions are scheduled for this room.";
  } else if (!current && !next) {
    emptyMessage = "No more events in this room today.";
  }

  return {
    room,
    current,
    next,
    later,
    emptyMessage,
  };
}

export function getOverviewItems(
  schedule: NormalizedSchedule,
  windowMinutes: number,
  nowMs: number,
  config: RuntimeConfig,
  changesByOccurrenceId: Map<string, OccurrenceChangeInfo>,
): PresentedOccurrence[] {
  const windowEndMs = nowMs + windowMinutes * 60_000;

  return filterVisibleOccurrences(
    schedule.occurrences.map((occurrence) =>
      buildOccurrencePresentation(occurrence, nowMs, config, changesByOccurrenceId),
    ),
  )
    .filter((item) => item.state.isCurrent || item.occurrence.startMs <= windowEndMs)
    .slice(0, 14);
}

export function getOverviewRooms(
  schedule: NormalizedSchedule,
  windowMinutes: number,
  nowMs: number,
  config: RuntimeConfig,
  changesByOccurrenceId: Map<string, OccurrenceChangeInfo>,
): OverviewRoomModel[] {
  const windowEndMs = nowMs + windowMinutes * 60_000;

  return Array.from(schedule.roomsById.values())
    .map((room) => {
      const roomOccurrences = schedule.occurrencesByRoomId.get(room.id) ?? [];
      const presented = filterVisibleOccurrences(
        roomOccurrences.map((occurrence) =>
          buildOccurrencePresentation(occurrence, nowMs, config, changesByOccurrenceId),
        ),
      );
      const current =
        presented.find((item) => item.state.isCurrent) ??
        presented.find((item) => item.state.justEnded) ??
        null;
      const upcoming = presented.find(
        (item) =>
          item.occurrence.startMs >= nowMs &&
          item.occurrence.startMs <= windowEndMs &&
          isSameLocalDay(item.occurrence.startMs, nowMs, schedule.timezone),
      ) ?? null;

      return {
        room,
        current,
        upcoming,
      };
    })
    .filter((room) => room.current !== null || room.upcoming !== null);
}

export function getCompactItems(
  schedule: NormalizedSchedule,
  windowMinutes: number,
  nowMs: number,
  config: RuntimeConfig,
  changesByOccurrenceId: Map<string, OccurrenceChangeInfo>,
): PresentedOccurrence[] {
  return getOverviewItems(schedule, windowMinutes, nowMs, config, changesByOccurrenceId).slice(0, 6);
}

export function getLastUpdatedMs(schedule: NormalizedSchedule | null): number | null {
  if (!schedule) {
    return null;
  }

  return schedule.sourceUpdatedAtMs ?? schedule.updatedAtMs;
}

export function getStaleLevel(
  nowMs: number,
  lastFetchSucceededAt: number | null,
  config: RuntimeConfig,
): StaleLevel {
  if (!lastFetchSucceededAt) {
    return "error";
  }

  const ageMs = nowMs - lastFetchSucceededAt;

  if (ageMs >= config.staleErrorSeconds * 1000) {
    return "error";
  }

  if (ageMs >= config.staleWarningSeconds * 1000) {
    return "warning";
  }

  return "fresh";
}
