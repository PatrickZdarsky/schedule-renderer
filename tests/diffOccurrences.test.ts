import { describe, expect, it } from "vitest";
import { diffOccurrences } from "../src/domain/diffOccurrences";
import { normalizeSchedule } from "../src/domain/normalizeSchedule";
import { createRuntimeConfig, createScheduleFixture } from "./helpers/fixtures";

describe("diffOccurrences", () => {
  it("returns no changes when there is no previous schedule", () => {
    const nextSchedule = normalizeSchedule(createScheduleFixture(), createRuntimeConfig());

    expect(diffOccurrences(null, nextSchedule)).toEqual(new Map());
  });

  it("captures room and time changes for matching occurrence ids", () => {
    const previousPayload = createScheduleFixture();
    const nextPayload = createScheduleFixture();
    nextPayload.sessions[0].timeSlots[0].startTime = "2026-06-18T14:10:00+02:00";
    nextPayload.sessions[0].timeSlots[0].endTime = "2026-06-18T15:10:00+02:00";
    nextPayload.sessions[0].timeSlots[0].roomIds = ["main-stage"];

    const previousSchedule = normalizeSchedule(previousPayload, createRuntimeConfig());
    const nextSchedule = normalizeSchedule(nextPayload, createRuntimeConfig());
    const changes = diffOccurrences(previousSchedule, nextSchedule);

    expect(changes.get("opening-chat-slot")).toMatchObject({
      previousRoomNames: ["Panel Room 1"],
      previousStartMs: Date.parse("2026-06-18T12:00:00Z"),
      previousEndMs: Date.parse("2026-06-18T13:00:00Z"),
    });
  });
});
