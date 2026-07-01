import { describe, expect, it } from "vitest";
import { ScheduleValidationError, validateScheduleData } from "../src/api/validateSchedule";
import { createScheduleFixture } from "./helpers/fixtures";

describe("validateScheduleData", () => {
  it("accepts a valid schedule payload", () => {
    const payload = createScheduleFixture();

    expect(validateScheduleData(payload)).toBe(payload);
  });

  it("throws a validation error for malformed payloads", () => {
    const payload = createScheduleFixture() as unknown as Record<string, unknown>;
    payload.updatedAt = 42;

    expect(() => validateScheduleData(payload)).toThrow(ScheduleValidationError);
    expect(() => validateScheduleData(payload)).toThrow("/updatedAt");
  });
});
