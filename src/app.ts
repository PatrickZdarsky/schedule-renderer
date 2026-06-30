import type { RuntimeConfig } from "./config";
import { applyThemeToDocument, loadRuntimeConfig, readPageBackgroundOverride, readUiScaleOverride } from "./config";
import { getCompactItems, getLastUpdatedMs, getOverviewRooms, getRoomViewModel, getStaleLevel } from "./domain/selectors";
import { formatClockTime, formatLastUpdated } from "./domain/time";
import { parseRoute } from "./router";
import type { AppState } from "./state/store";
import { ScheduleStore } from "./state/store";
import { escapeHtml } from "./ui/escapeHtml";
import { renderStatusBanner } from "./ui/staleBanner";
import { renderCompactView } from "./views/renderCompactView";
import { renderOverviewView } from "./views/renderOverviewView";
import { renderRoomView } from "./views/renderRoomView";

function renderChromeHeader(state: AppState, timezone: string): string {
  const logoMarkup = state.config.showLogo
    ? `<img class="topbar__logo" src="/assets/logo.svg" alt="Awoostria logo" />`
    : "";

  return `
    <header class="topbar">
      ${logoMarkup}
      <div class="topbar__main">
        <!-- <p class="topbar__label">Awoostria signage</p> -->
        <h2 class="topbar__title">${escapeHtml(state.schedule?.eventName ?? "Schedule Renderer")}</h2>
      </div>
      <div class="topbar__clock">
        <span class="topbar__clock-time">${formatClockTime(state.nowMs, timezone)}</span>
        <span class="topbar__clock-zone">${escapeHtml(timezone)}</span>
      </div>
    </header>
  `;
}

function renderStatusMessage(state: AppState): { level: "fresh" | "warning" | "error"; message: string | null; secondary: string | null } {
  if (!state.schedule && state.fetchError) {
    return {
      level: "error",
      message: "Schedule currently unavailable.",
      secondary: state.fetchError,
    };
  }

  
  if (state.route.nowOverrideMs !== null) {
    return {
    level: "fresh",
    message: null,
    secondary: null,
  };
    return {
      level: "fresh",
      message: "Preview mode is active.",
      secondary: "Using the timestamp from the URL now parameter.",
    };
  }
    

  const staleLevel = getStaleLevel(state.nowMs, state.lastFetchSucceededAt, state.config);

  if (state.fetchError && state.schedule) {
    return {
      level: "warning",
      message: "Showing the last known valid schedule.",
      secondary: state.fetchError,
    };
  }

  if (staleLevel === "error" && state.schedule) {
    return {
      level: "error",
      message: "Schedule may be outdated.",
      secondary: "No successful refresh for an extended period.",
    };
  }

  if (staleLevel === "warning" && state.schedule) {
    return {
      level: "warning",
      message: "Schedule data is getting stale.",
      secondary: "The display is still using the latest successful payload.",
    };
  }

  if (state.isUsingCachedData && state.schedule) {
    return {
      level: "fresh",
      message: "Loaded cached schedule while fetching a fresh copy.",
      secondary: null,
    };
  }

  return {
    level: "fresh",
    message: null,
    secondary: null,
  };
}

function renderFallbackBody(state: AppState): string {
  if (state.isLoading) {
    return `
      <section class="card">
        <header class="card__header">Loading</header>
        <div class="card__body">
          <p class="empty-state">Fetching schedule data...</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="card">
      <header class="card__header">Unavailable</header>
      <div class="card__body">
        <p class="empty-state">No valid schedule payload is available yet.</p>
      </div>
    </section>
  `;
}

function renderFooter(state: AppState, timezone: string): string {
  const lastUpdatedMs = getLastUpdatedMs(state.schedule);
  const updatedLabel = formatLastUpdated(lastUpdatedMs, timezone);
  const previewLabel =
    state.route.nowOverrideMs !== null ? formatLastUpdated(state.route.nowOverrideMs, timezone) : null;

  return `
    <footer class="footer">
      <div><strong>View:</strong> ${escapeHtml(state.route.mode)}</div>
      <div><strong>Updated:</strong> ${escapeHtml(updatedLabel ?? "Unknown")}</div>
      ${
        previewLabel
          ? `<div><strong>Preview time:</strong> ${escapeHtml(previewLabel)} ${escapeHtml(timezone)}</div>`
          : ""
      }
      <div><strong>Source:</strong> ${escapeHtml(state.config.scheduleDataEndpoint)}</div>
    </footer>
  `;
}

function renderViewBody(state: AppState): string {
  if (!state.schedule) {
    return renderFallbackBody(state);
  }

  switch (state.route.mode) {
    case "room":
      return renderRoomView({
        model: getRoomViewModel(
          state.schedule,
          state.route.roomId ?? "",
          state.nowMs,
          state.config,
          state.changesByOccurrenceId,
        ),
        config: state.config,
        timezone: state.schedule.timezone,
        nowMs: state.nowMs,
        roomId: state.route.roomId,
      });
    case "compact":
      return renderCompactView({
        items: getCompactItems(
          state.schedule,
          state.route.windowMinutes,
          state.nowMs,
          state.config,
          state.changesByOccurrenceId,
        ),
        timezone: state.schedule.timezone,
        nowMs: state.nowMs,
        windowMinutes: state.route.windowMinutes,
      });
    case "overview":
    default:
      return renderOverviewView({
        rooms: getOverviewRooms(
          state.schedule,
          state.route.windowMinutes,
          state.nowMs,
          state.config,
          state.changesByOccurrenceId,
        ),
        timezone: state.schedule.timezone,
        nowMs: state.nowMs,
        windowMinutes: state.route.windowMinutes,
      });
  }
}

function renderApp(state: AppState): string {
  const timezone = state.schedule?.timezone ?? state.config.timezone;
  const statusMessage = renderStatusMessage(state);

  return `
    <div class="app-shell app-shell--${state.config.layout.align}">
      <main class="signage-column">
        ${renderChromeHeader(state, timezone)}
        ${renderStatusBanner(statusMessage.level, statusMessage.message, statusMessage.secondary)}
        ${renderViewBody(state)}
        <!-- ${renderFooter(state, timezone)} -->
      </main>
    </div>
  `;
}

export async function bootApplication(): Promise<void> {
  const root = document.querySelector<HTMLDivElement>("#app");

  if (!root) {
    throw new Error("Could not find #app root element.");
  }

  const config: RuntimeConfig = await loadRuntimeConfig();
  const applyLocationTheme = (): void => {
    applyThemeToDocument(config, {
      pageBackgroundColor: readPageBackgroundOverride(window.location) ?? undefined,
      uiScale: readUiScaleOverride(window.location) ?? undefined,
    });
  };

  applyLocationTheme();

  const store = new ScheduleStore(config, parseRoute(window.location, config.defaultWindowMinutes));

  store.subscribe((state) => {
    root.innerHTML = renderApp(state);
  });

  window.addEventListener("popstate", () => {
    applyLocationTheme();
    store.updateRoute(parseRoute(window.location, config.defaultWindowMinutes));
  });

  await store.start();
}
