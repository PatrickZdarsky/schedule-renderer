import { describe, expect, it } from "vitest";
import type { MultiRoomViewModel, OverviewRoomModel, PresentedOccurrence, RoomViewModel } from "../src/domain/selectors";
import { renderHero, renderOccurrenceBlock } from "../src/views/renderCommon";
import { renderOverviewView } from "../src/views/renderOverviewView";
import { renderRoomMultiView } from "../src/views/renderRoomMultiView";
import { renderRoomView } from "../src/views/renderRoomView";
import { createRuntimeConfig } from "./helpers/fixtures";

function createPresentedOccurrence(overrides: Partial<PresentedOccurrence> = {}): PresentedOccurrence {
  return {
    occurrence: {
      occurrenceId: "occ-1",
      sessionId: "session-1",
      timeSlotId: "slot-1",
      title: "Guest of Honor Q&A",
      description: "Bring your questions.",
      startIso: "2026-06-18T14:00:00+02:00",
      endIso: "2026-06-18T15:00:00+02:00",
      startMs: Date.parse("2026-06-18T12:00:00Z"),
      endMs: Date.parse("2026-06-18T13:00:00Z"),
      roomIds: ["main-stage"],
      roomNames: ["Main Stage"],
      hostIds: ["host-1"],
      hostNames: ["Host One"],
      typeName: "Panel",
      trackName: "Stage",
      labels: [],
      apiStatus: "SCHEDULED",
    },
    state: {
      isCurrent: true,
      isEnded: false,
      justEnded: false,
      isStartingSoon: false,
      shouldHide: false,
    },
    changeInfo: null,
    delayText: null,
    movedFromText: null,
    ...overrides,
  };
}

describe("renderers", () => {
  it("renders heroes without a title when requested", () => {
    const markup = renderHero("Overview", null, "By room for the next 4 hours");

    expect(markup).toContain("Overview");
    expect(markup).toContain("By room for the next 4 hours");
    expect(markup).not.toContain("hero__title");
  });

  it("renders occurrence blocks with escaped content and badges", () => {
    const markup = renderOccurrenceBlock(
      createPresentedOccurrence({
        occurrence: {
          ...createPresentedOccurrence().occurrence,
          title: "<VIP> Meetup",
          apiStatus: "CANCELLED",
        },
        state: {
          isCurrent: false,
          isEnded: false,
          justEnded: false,
          isStartingSoon: true,
          shouldHide: false,
        },
      }),
      {
        leadingLabel: "NEXT",
        timezone: "Europe/Vienna",
        nowMs: Date.parse("2026-06-18T11:50:00Z"),
        showRooms: true,
        compact: true,
        timingAside: true,
      },
    );

    expect(markup).toContain("&lt;VIP&gt; Meetup");
    expect(markup).toContain("NEXT");
    expect(markup).toContain("STARTS SOON");
    expect(markup).toContain("CANCELLED");
    expect(markup).toContain("This session will not take place.");
  });

  it("renders delayed and moved event details for changed schedules", () => {
    const delayedMarkup = renderOccurrenceBlock(
      createPresentedOccurrence({
        occurrence: {
          ...createPresentedOccurrence().occurrence,
          apiStatus: "DELAYED",
        },
        state: {
          isCurrent: false,
          isEnded: false,
          justEnded: false,
          isStartingSoon: true,
          shouldHide: false,
        },
        delayText: "+15 min",
      }),
      {
        leadingLabel: "NEXT",
        timezone: "Europe/Vienna",
        nowMs: Date.parse("2026-06-18T11:50:00Z"),
        showRooms: true,
        compact: true,
      },
    );
    const movedMarkup = renderOccurrenceBlock(
      createPresentedOccurrence({
        occurrence: {
          ...createPresentedOccurrence().occurrence,
          apiStatus: "MOVED",
        },
        state: {
          isCurrent: false,
          isEnded: false,
          justEnded: false,
          isStartingSoon: false,
          shouldHide: false,
        },
        movedFromText: "Workshop Room",
      }),
      {
        leadingLabel: null,
        timezone: "Europe/Vienna",
        nowMs: Date.parse("2026-06-18T11:50:00Z"),
        showRooms: true,
        compact: true,
        timingAside: true,
      },
    );

    expect(delayedMarkup).toContain("DELAYED +15 min");
    expect(movedMarkup).toContain("MOVED");
    expect(movedMarkup).toContain("Moved from Workshop Room");
  });

  it("renders an overview without the removed Room Overview heading", () => {
    const rooms: OverviewRoomModel[] = [
      {
        room: {
          id: "main-stage",
          name: "Main Stage",
          venueId: "venue-1",
          venueName: "Hyatt",
        },
        current: createPresentedOccurrence(),
        upcoming: null,
      },
    ];

    const markup = renderOverviewView({
      rooms,
      timezone: "Europe/Vienna",
      nowMs: Date.parse("2026-06-18T12:10:00Z"),
      windowMinutes: 240,
    });

    expect(markup).toContain("Overview");
    expect(markup).not.toContain("Room Overview");
    expect(markup).toContain("Main Stage");
    expect(markup).toContain("By room for the next 4 hours");
  });

  it("renders the multi-room view with missing-room guidance", () => {
    const rooms: MultiRoomViewModel[] = [
      {
        requestedRoomId: "missing-room",
        model: {
          room: null,
          current: null,
          next: null,
          later: [],
          emptyMessage: "This room could not be found in the current schedule.",
        },
      },
    ];

    const markup = renderRoomMultiView({
      rooms,
      timezone: "Europe/Vienna",
      nowMs: Date.parse("2026-06-18T12:10:00Z"),
      windowMinutes: 120,
    });

    expect(markup).toContain("missing-room");
    expect(markup).toContain("Room not found in the current schedule");
    expect(markup).toContain("Check the room ID in the URL or schedule payload.");
  });

  it("renders the single-room fallback when no room id is provided", () => {
    const model: RoomViewModel = {
      room: null,
      current: null,
      next: null,
      later: [],
      emptyMessage: "This room could not be found in the current schedule.",
    };

    const markup = renderRoomView({
      model,
      config: createRuntimeConfig(),
      timezone: "Europe/Vienna",
      nowMs: Date.parse("2026-06-18T12:10:00Z"),
      roomId: null,
    });

    expect(markup).toContain("Room parameter required");
    expect(markup).toContain("/signage/room?room=panel-1");
  });
});
