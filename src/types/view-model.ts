export type ApiSessionStatus = "SCHEDULED" | "DELAYED" | "CANCELLED" | "MOVED";

export interface NormalizedRoom {
  id: string;
  name: string;
  venueId: string | null;
  venueName: string | null;
}

export interface NormalizedOccurrence {
  occurrenceId: string;
  sessionId: string;
  timeSlotId: string | null;
  title: string;
  description: string | null;
  startIso: string;
  endIso: string;
  startMs: number;
  endMs: number;
  roomIds: string[];
  roomNames: string[];
  hostIds: string[];
  hostNames: string[];
  typeName: string | null;
  trackName: string | null;
  labels: string[];
  apiStatus: ApiSessionStatus;
}

export interface NormalizedSchedule {
  eventId: string;
  eventName: string;
  timezone: string;
  updatedAtIso: string;
  updatedAtMs: number;
  sourceUpdatedAtIso: string | null;
  sourceUpdatedAtMs: number | null;
  roomsById: Map<string, NormalizedRoom>;
  occurrences: NormalizedOccurrence[];
  occurrencesByRoomId: Map<string, NormalizedOccurrence[]>;
}

export interface OccurrenceChangeInfo {
  previousStartMs: number | null;
  previousEndMs: number | null;
  previousRoomNames: string[];
}

export interface DisplayOccurrenceState {
  isCurrent: boolean;
  isEnded: boolean;
  justEnded: boolean;
  isStartingSoon: boolean;
  shouldHide: boolean;
}

export type StaleLevel = "fresh" | "warning" | "error";
