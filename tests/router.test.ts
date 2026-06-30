import { describe, expect, it } from "vitest";
import { parseRoute } from "../src/router";

function createLocation(search: string, pathname = "/signage/overview"): Location {
  return {
    search,
    pathname,
  } as Location;
}

describe("parseRoute", () => {
  it("parses a raw now parameter with an encoded plus lost to URLSearchParams", () => {
    const route = parseRoute(
      createLocation("?now=2026-07-22T14:00:00+02:00"),
      120,
    );

    expect(route.nowOverrideMs).toBe(Date.parse("2026-07-22T12:00:00Z"));
  });

  it("keeps the room mode and room id intact", () => {
    const route = parseRoute(
      createLocation("?room=main-stage&now=2026-07-22T14:00:00+02:00", "/signage/room"),
      120,
    );

    expect(route.mode).toBe("room");
    expect(route.roomId).toBe("main-stage");
    expect(route.nowOverrideMs).toBe(Date.parse("2026-07-22T12:00:00Z"));
  });
});
