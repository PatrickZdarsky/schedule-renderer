import { describe, expect, it, vi } from "vitest";
import { normalizeSchedule } from "../src/domain/normalizeSchedule";
import { createRuntimeConfig, createScheduleFixture } from "./helpers/fixtures";

describe("normalizeSchedule", () => {
  it("localizes names and resolves schedule metadata", () => {
    const schedule = createScheduleFixture();
    schedule.event.displayName["de-AT"] = "Awoostria 2026 DE";
    schedule.venues[0].displayName["de-AT"] = "Hyatt Wien";
    if (schedule.rooms) {
      schedule.rooms[0].displayName["de-AT"] = "Hauptbuhne";
    }
    schedule.sessionTypes.push({
      id: "meetup",
      displayName: {
        "en-US": "Meetup",
        "de-AT": "Treffen",
      },
    });
    schedule.labels.push({
      id: "crowd-favorite",
      displayName: {
        "en-US": "Crowd Favorite",
        "de-AT": "Publikumsliebling",
      },
    });
    schedule.sessions[0].typeId = "meetup";
    schedule.sessions[0].labelIds = ["crowd-favorite"];
    schedule.sessions[0].timeSlots[0]["x-meta"] = {
      timeslotStatus: "moved",
    };

    const normalized = normalizeSchedule(
      schedule,
      createRuntimeConfig({
        preferredLocale: "de-AT",
      }),
    );

    expect(normalized.eventName).toBe("Awoostria 2026 DE");
    expect(normalized.timezone).toBe("Europe/Vienna");
    expect(normalized.roomsById.get("main-stage")).toMatchObject({
      name: "Hauptbuhne",
      venueName: "Hyatt Wien",
    });

    const openingChat = normalized.occurrences.find((item) => item.sessionId === "opening-chat");
    expect(openingChat).toMatchObject({
      hostNames: ["Rain"],
      roomNames: ["Panel Room 1"],
      typeName: "Treffen",
      trackName: "Panels",
      labels: ["Publikumsliebling"],
      apiStatus: "MOVED",
    });
  });

  it("skips invalid time slots, falls back to the configured timezone, and generates fallback ids", () => {
    const schedule = createScheduleFixture();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    schedule.event.timezone = "";
    schedule.source = {
      lastModifiedAt: "not-a-real-timestamp",
    };
    schedule.sessions[0].timeSlots[0].startTime = "not-a-real-timestamp";
    schedule.sessions[0].timeSlots[0].endTime = "still-not-a-timestamp";
    schedule.sessions[2].timeSlots[0].id = undefined;

    const normalized = normalizeSchedule(schedule, createRuntimeConfig());

    expect(normalized.timezone).toBe("Europe/Vienna");
    expect(normalized.occurrences).toHaveLength(4);
    expect(normalized.sourceUpdatedAtMs).toBeNull();
    expect(normalized.occurrences.some((item) => item.occurrenceId.startsWith("art-jam__"))).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("filters rooms and occurrences through the runtime room whitelist", () => {
    const schedule = createScheduleFixture();
    schedule.sessions[0].timeSlots[0].roomIds = ["panel-1", "main-stage"];

    const normalized = normalizeSchedule(
      schedule,
      createRuntimeConfig({
        roomWhitelist: [" panel-1 ", "panel-1"],
      }),
    );

    expect(Array.from(normalized.roomsById.keys())).toEqual(["panel-1"]);
    expect(normalized.occurrences).toHaveLength(3);
    expect(normalized.occurrencesByRoomId.has("main-stage")).toBe(false);
    expect(normalized.occurrencesByRoomId.has("workshop")).toBe(false);

    const openingChat = normalized.occurrences.find((item) => item.sessionId === "opening-chat");
    expect(openingChat?.roomIds).toEqual(["panel-1"]);
    expect(openingChat?.roomNames).toEqual(["Panel Room 1"]);
  });
});
