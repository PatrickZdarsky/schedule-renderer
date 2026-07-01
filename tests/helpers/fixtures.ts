import happyPathSchedule from "../../public/mock-data/happy-path.json";
import type { LayoutConfig, RuntimeConfig, ThemeConfig } from "../../src/config";
import type { ScheduleData } from "../../src/types/schema";

type RuntimeConfigOverrides = Partial<Omit<RuntimeConfig, "theme" | "layout">> & {
  theme?: Partial<ThemeConfig>;
  layout?: Partial<LayoutConfig>;
};

export function createRuntimeConfig(overrides: RuntimeConfigOverrides = {}): RuntimeConfig {
  const { theme, layout, ...rest } = overrides;

  return {
    scheduleDataEndpoint: "/mock-data/happy-path.json",
    timezone: "Europe/Vienna",
    preferredLocale: "en-US",
    refreshSeconds: 20,
    fetchTimeoutMs: 8000,
    staleWarningSeconds: 120,
    staleErrorSeconds: 600,
    hardReloadMinutes: 180,
    defaultWindowMinutes: 240,
    showLogo: true,
    showVenueInRoomHeader: true,
    startingSoonMinutes: 15,
    endedGraceMinutes: 2,
    theme: {
      pageBackgroundColor: "transparent",
      surfaceColor: "rgba(24, 24, 27, 0.88)",
      surfaceStrongColor: "rgba(39, 39, 42, 0.96)",
      borderColor: "rgba(255, 255, 255, 0.12)",
      textColor: "#ffffff",
      textMutedColor: "#c8cad7",
      primaryColor: "#e44763",
      primaryStrongColor: "#cd4059",
      warningColor: "#f59e0b",
      dangerColor: "#ef4444",
      successColor: "#22c55e",
      shadowColor: "rgba(0, 0, 0, 0.42)",
      fontFamilyBody: "\"Inter var\", Inter, system-ui, sans-serif",
      fontFamilyAccent: "\"Montserrat Local\", \"Montserrat\", sans-serif",
      ...theme,
    },
    layout: {
      regionWidthVw: 34,
      regionMinWidthPx: 340,
      regionMaxWidthPx: 620,
      uiScale: 1,
      outerPaddingPx: 24,
      cardGapPx: 18,
      align: "left",
      ...layout,
    },
    ...rest,
  };
}

export function createScheduleFixture(): ScheduleData {
  return structuredClone(happyPathSchedule) as ScheduleData;
}

export function createChangedSchedulePair(): { previous: ScheduleData; next: ScheduleData } {
  const previous = createScheduleFixture();
  const next = createScheduleFixture();

  next.sessions[1].timeSlots[0].startTime = "2026-06-18T15:35:00+02:00";
  next.sessions[1].timeSlots[0].endTime = "2026-06-18T16:20:00+02:00";
  next.sessions[1].timeSlots[0]["x-meta"] = {
    timeslotStatus: "DELAYED",
  };

  next.sessions[4].timeSlots[0].roomIds = ["main-stage"];
  next.sessions[4].timeSlots[0]["x-meta"] = {
    timeslotStatus: "MOVED",
  };

  return {
    previous,
    next,
  };
}
