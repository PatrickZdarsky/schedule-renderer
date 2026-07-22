import { describe, expect, it } from "vitest";
import { formatRelativeWindow } from "../src/domain/time";

describe("formatRelativeWindow", () => {
  it("uses hours and minutes for starts at least an hour away", () => {
    const nowMs = Date.parse("2026-06-18T12:00:00Z");

    expect(formatRelativeWindow(nowMs + 654 * 60_000, nowMs)).toBe("Starts in 10 hours 54 min");
    expect(formatRelativeWindow(nowMs + 60 * 60_000, nowMs)).toBe("Starts in 1 hour");
  });

  it("keeps minute-only wording for starts under an hour away", () => {
    const nowMs = Date.parse("2026-06-18T12:00:00Z");

    expect(formatRelativeWindow(nowMs + 59 * 60_000, nowMs)).toBe("Starts in 59 min");
  });
});
