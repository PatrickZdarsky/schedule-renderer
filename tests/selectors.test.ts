import { describe, expect, it } from "vitest";
import {
  getCompactItems,
  getLastUpdatedMs,
  getMultiRoomViewModels,
  getOverviewRooms,
  getRoomViewModel,
} from "../src/domain/selectors";
import { diffOccurrences } from "../src/domain/diffOccurrences";
import { normalizeSchedule } from "../src/domain/normalizeSchedule";
import { createChangedSchedulePair, createRuntimeConfig, createScheduleFixture } from "./helpers/fixtures";

const NOW_MS = Date.parse("2026-06-18T12:40:00Z");

function createNormalizedSchedule() {
  return normalizeSchedule(createScheduleFixture(), createRuntimeConfig());
}

describe("selectors", () => {
  it("builds the room view model with current, next, and later sessions", () => {
    const model = getRoomViewModel(
      createNormalizedSchedule(),
      "panel-1",
      NOW_MS,
      createRuntimeConfig(),
      new Map(),
    );

    expect(model.room?.name).toBe("Panel Room 1");
    expect(model.current?.occurrence.title).toBe("Running a Friendly Furry Con");
    expect(model.next?.occurrence.title).toBe("How to Survive Your First Con");
    expect(model.later.map((item) => item.occurrence.title)).toEqual(["Community Art Jam"]);
    expect(model.emptyMessage).toBeNull();
  });

  it("returns a clear empty message for unknown rooms", () => {
    const model = getRoomViewModel(
      createNormalizedSchedule(),
      "missing-room",
      NOW_MS,
      createRuntimeConfig(),
      new Map(),
    );

    expect(model.room).toBeNull();
    expect(model.emptyMessage).toBe("This room could not be found in the current schedule.");
  });

  it("builds overview rooms and respects an optional room limit", () => {
    const rooms = getOverviewRooms(
      createNormalizedSchedule(),
      60,
      NOW_MS,
      createRuntimeConfig(),
      new Map(),
      2,
    );

    expect(rooms.map((room) => room.room.id)).toEqual(["main-stage", "panel-1"]);
    expect(rooms[0]?.current?.occurrence.title).toBe("Fursuit Dance Showcase");
    expect(rooms[1]?.upcoming?.occurrence.title).toBe("How to Survive Your First Con");
  });

  it("builds compact items in time order within the selected window", () => {
    const items = getCompactItems(
      createNormalizedSchedule(),
      120,
      NOW_MS,
      createRuntimeConfig(),
      new Map(),
    );

    expect(items.map((item) => item.occurrence.title)).toEqual([
      "Running a Friendly Furry Con",
      "Fursuit Dance Showcase",
      "Prop Fixing Workshop",
      "How to Survive Your First Con",
      "Community Art Jam",
    ]);
  });

  it("propagates delayed and moved change details into presented occurrences", () => {
    const { previous, next } = createChangedSchedulePair();
    const config = createRuntimeConfig();
    const previousSchedule = normalizeSchedule(previous, config);
    const nextSchedule = normalizeSchedule(next, config);
    const changes = diffOccurrences(previousSchedule, nextSchedule);

    const items = getCompactItems(
      nextSchedule,
      180,
      NOW_MS,
      config,
      changes,
    );
    const delayed = items.find((item) => item.occurrence.sessionId === "first-con");
    const moved = items.find((item) => item.occurrence.sessionId === "crafting");

    expect(delayed?.occurrence.apiStatus).toBe("DELAYED");
    expect(delayed?.delayText).toBe("+20 min");
    expect(moved?.occurrence.apiStatus).toBe("MOVED");
    expect(moved?.movedFromText).toBe("Workshop Room");
  });

  it("preserves explicit room order for the multi-room view", () => {
    const rooms = getMultiRoomViewModels(
      createNormalizedSchedule(),
      ["workshop", "missing-room", "panel-1"],
      NOW_MS,
      createRuntimeConfig(),
      new Map(),
    );

    expect(rooms.map((room) => room.requestedRoomId)).toEqual(["workshop", "missing-room", "panel-1"]);
    expect(rooms[0]?.model.room?.name).toBe("Workshop Room");
    expect(rooms[1]?.model.room).toBeNull();
    expect(rooms[2]?.model.current?.occurrence.title).toBe("Running a Friendly Furry Con");
  });

  it("prefers source timestamps for the updated label", () => {
    const normalized = createNormalizedSchedule();

    expect(getLastUpdatedMs(normalized)).toBe(Date.parse("2026-06-18T12:27:30Z"));
  });
});
