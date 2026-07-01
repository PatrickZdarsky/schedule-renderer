import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyThemeToDocument, readPageBackgroundOverride, readUiScaleOverride } from "../src/config";
import { createRuntimeConfig } from "./helpers/fixtures";

describe("config helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("CSS", {
      supports: vi.fn((property: string, value: string) => property === "color" && value !== "not-a-color"),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("normalizes background color overrides from the URL", () => {
    expect(readPageBackgroundOverride({ search: "?bg=0f172a" } as Location)).toBe("#0f172a");
    expect(readPageBackgroundOverride({ search: "?background=black" } as Location)).toBe("black");
  });

  it("rejects invalid background color overrides", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(readPageBackgroundOverride({ search: "?bg=not-a-color" } as Location)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Ignoring invalid background color override: not-a-color");
  });

  it("reads and clamps UI scale overrides", () => {
    expect(readUiScaleOverride({ search: "?scale=1.2" } as Location)).toBe(1.2);
    expect(readUiScaleOverride({ search: "?uiScale=9" } as Location)).toBe(2);
    expect(readUiScaleOverride({ search: "?scale=0.2" } as Location)).toBe(0.5);
  });

  it("ignores invalid UI scale overrides", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(readUiScaleOverride({ search: "?scale=huge" } as Location)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Ignoring invalid scale override: huge");
  });

  it("applies theme variables to the document root", () => {
    const setProperty = vi.fn();
    vi.stubGlobal("document", {
      documentElement: {
        style: {
          setProperty,
        },
      },
    });

    applyThemeToDocument(createRuntimeConfig(), {
      pageBackgroundColor: "#000000",
      uiScale: 0.92,
    });

    expect(setProperty).toHaveBeenCalledWith("--theme-page-background", "#000000");
    expect(setProperty).toHaveBeenCalledWith("--theme-font-accent", "\"Montserrat Local\", \"Montserrat\", sans-serif");
    expect(setProperty).toHaveBeenCalledWith("--layout-region-max-width", "620px");
    expect(setProperty).toHaveBeenCalledWith("--layout-ui-scale", "0.92");
  });
});
