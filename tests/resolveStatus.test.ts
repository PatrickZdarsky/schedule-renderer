import { describe, expect, it } from "vitest";
import { getDisplayOccurrenceState, resolveApiStatus } from "../src/domain/resolveStatus";
import type { NormalizedOccurrence } from "../src/types/view-model";

function createOccurrence(overrides: Partial<NormalizedOccurrence> = {}): NormalizedOccurrence {
  return {
    occurrenceId: "occurrence-1",
    sessionId: "session-1",
    timeSlotId: "slot-1",
    title: "Example",
    description: null,
    startIso: "2026-06-18T14:00:00+02:00",
    endIso: "2026-06-18T15:00:00+02:00",
    startMs: Date.parse("2026-06-18T12:00:00Z"),
    endMs: Date.parse("2026-06-18T13:00:00Z"),
    roomIds: ["panel-1"],
    roomNames: ["Panel Room 1"],
    hostIds: [],
    hostNames: [],
    typeName: null,
    trackName: null,
    labels: [],
    apiStatus: "SCHEDULED",
    ...overrides,
  };
}

describe("resolveApiStatus", () => {
  it("prefers the time slot status over the session status", () => {
    expect(
      resolveApiStatus(
        {
          timeslotStatus: "delayed",
        },
        {
          sessionStatus: "cancelled",
        },
      ),
    ).toBe("DELAYED");
  });

  it("falls back to scheduled when no status exists", () => {
    expect(resolveApiStatus(undefined, undefined)).toBe("SCHEDULED");
  });
});

describe("getDisplayOccurrenceState", () => {
  it("marks an occurrence as current during its time range", () => {
    const state = getDisplayOccurrenceState(
      createOccurrence(),
      Date.parse("2026-06-18T12:30:00Z"),
      15,
      2,
    );

    expect(state.isCurrent).toBe(true);
    expect(state.shouldHide).toBe(false);
  });

  it("keeps a just-ended session visible during the grace period", () => {
    const state = getDisplayOccurrenceState(
      createOccurrence(),
      Date.parse("2026-06-18T13:01:00Z"),
      15,
      2,
    );

    expect(state.justEnded).toBe(true);
    expect(state.shouldHide).toBe(false);
  });
});
