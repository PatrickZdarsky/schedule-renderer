export interface ThemeConfig {
  pageBackgroundColor: string;
  surfaceColor: string;
  surfaceStrongColor: string;
  borderColor: string;
  textColor: string;
  textMutedColor: string;
  primaryColor: string;
  primaryStrongColor: string;
  warningColor: string;
  dangerColor: string;
  successColor: string;
  shadowColor: string;
  fontFamilyBody: string;
  fontFamilyAccent: string;
}

export interface LayoutConfig {
  regionWidthVw: number;
  regionMinWidthPx: number;
  regionMaxWidthPx: number;
  uiScale: number;
  outerPaddingPx: number;
  cardGapPx: number;
  align: "left" | "center";
}

export interface RuntimeConfig {
  scheduleDataEndpoint: string;
  timezone: string;
  preferredLocale: string;
  refreshSeconds: number;
  fetchTimeoutMs: number;
  staleWarningSeconds: number;
  staleErrorSeconds: number;
  hardReloadMinutes: number;
  defaultWindowMinutes: number;
  showLogo: boolean;
  showVenueInRoomHeader: boolean;
  startingSoonMinutes: number;
  endedGraceMinutes: number;
  theme: ThemeConfig;
  layout: LayoutConfig;
}

interface ThemeDocumentOverrides {
  pageBackgroundColor?: string;
  uiScale?: number;
}

const defaultConfig: RuntimeConfig = {
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
  },
  layout: {
    regionWidthVw: 34,
    regionMinWidthPx: 340,
    regionMaxWidthPx: 620,
    uiScale: 1,
    outerPaddingPx: 24,
    cardGapPx: 18,
    align: "left",
  },
};

function mergeConfig(input: Partial<RuntimeConfig> | undefined): RuntimeConfig {
  return {
    ...defaultConfig,
    ...input,
    theme: {
      ...defaultConfig.theme,
      ...input?.theme,
    },
    layout: {
      ...defaultConfig.layout,
      ...input?.layout,
    },
  };
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch("/config.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load config.json (${response.status})`);
    }

    const config = (await response.json()) as Partial<RuntimeConfig>;
    return mergeConfig(config);
  } catch (error) {
    console.warn("Falling back to default runtime config.", error);
    return defaultConfig;
  }
}

function normalizeBackgroundColorCandidate(value: string): string {
  const trimmed = value.trim();

  if (/^[0-9a-f]{3,8}$/i.test(trimmed)) {
    return `#${trimmed}`;
  }

  return trimmed;
}

function normalizeScaleCandidate(value: string): number | null {
  const parsed = Number.parseFloat(value.trim());

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(2, Math.max(0.5, parsed));
}

export function readPageBackgroundOverride(location: Pick<Location, "search">): string | null {
  const query = new URLSearchParams(location.search);
  const rawValue = query.get("bg") ?? query.get("background");

  if (!rawValue || rawValue.trim().length === 0) {
    return null;
  }

  const normalizedValue = normalizeBackgroundColorCandidate(rawValue);

  if (typeof CSS !== "undefined" && CSS.supports("color", normalizedValue)) {
    return normalizedValue;
  }

  console.warn(`Ignoring invalid background color override: ${rawValue}`);
  return null;
}

export function readUiScaleOverride(location: Pick<Location, "search">): number | null {
  const query = new URLSearchParams(location.search);
  const rawValue = query.get("scale") ?? query.get("uiScale");

  if (!rawValue || rawValue.trim().length === 0) {
    return null;
  }

  const normalizedValue = normalizeScaleCandidate(rawValue);

  if (normalizedValue !== null) {
    return normalizedValue;
  }

  console.warn(`Ignoring invalid scale override: ${rawValue}`);
  return null;
}

export function applyThemeToDocument(
  config: RuntimeConfig,
  overrides: ThemeDocumentOverrides = {},
): void {
  const root = document.documentElement;
  const pageBackgroundColor = overrides.pageBackgroundColor ?? config.theme.pageBackgroundColor;
  const uiScale = overrides.uiScale ?? config.layout.uiScale;

  root.style.setProperty("--theme-page-background", pageBackgroundColor);
  root.style.setProperty("--theme-surface", config.theme.surfaceColor);
  root.style.setProperty("--theme-surface-strong", config.theme.surfaceStrongColor);
  root.style.setProperty("--theme-border", config.theme.borderColor);
  root.style.setProperty("--theme-text", config.theme.textColor);
  root.style.setProperty("--theme-text-muted", config.theme.textMutedColor);
  root.style.setProperty("--theme-primary", config.theme.primaryColor);
  root.style.setProperty("--theme-primary-strong", config.theme.primaryStrongColor);
  root.style.setProperty("--theme-warning", config.theme.warningColor);
  root.style.setProperty("--theme-danger", config.theme.dangerColor);
  root.style.setProperty("--theme-success", config.theme.successColor);
  root.style.setProperty("--theme-shadow", config.theme.shadowColor);
  root.style.setProperty("--theme-font-body", config.theme.fontFamilyBody);
  root.style.setProperty("--theme-font-accent", config.theme.fontFamilyAccent);
  root.style.setProperty("--layout-region-width-vw", String(config.layout.regionWidthVw));
  root.style.setProperty("--layout-region-min-width", `${config.layout.regionMinWidthPx}px`);
  root.style.setProperty("--layout-region-max-width", `${config.layout.regionMaxWidthPx}px`);
  root.style.setProperty("--layout-ui-scale", String(uiScale));
  root.style.setProperty("--layout-outer-padding", `${config.layout.outerPaddingPx}px`);
  root.style.setProperty("--layout-card-gap", `${config.layout.cardGapPx}px`);
}
