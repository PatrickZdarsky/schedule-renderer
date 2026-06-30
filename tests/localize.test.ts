import { describe, expect, it } from "vitest";
import { localizeText } from "../src/domain/localize";

describe("localizeText", () => {
  it("prefers an exact locale match", () => {
    expect(
      localizeText(
        {
          "en-US": "Panel Room 1",
          "de-AT": "Panelraum 1",
        },
        "de-AT",
      ),
    ).toBe("Panelraum 1");
  });

  it("falls back to the language when the region does not match", () => {
    expect(
      localizeText(
        {
          "en-US": "Main Hall",
          "de-DE": "Haupthalle",
        },
        "de-AT",
      ),
    ).toBe("Haupthalle");
  });
});
