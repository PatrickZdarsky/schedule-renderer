import type { RuntimeConfig } from "../config";
import type { RouteState } from "../router";
import type { ScheduleData } from "../types/schema";
import type { NormalizedSchedule, OccurrenceChangeInfo } from "../types/view-model";
import { fetchScheduleData } from "../api/fetchSchedule";
import { loadCachedSchedule, saveCachedSchedule } from "../api/loadCachedSchedule";
import { validateScheduleData } from "../api/validateSchedule";
import { diffOccurrences } from "../domain/diffOccurrences";
import { normalizeSchedule } from "../domain/normalizeSchedule";

export interface AppState {
  config: RuntimeConfig;
  route: RouteState;
  nowMs: number;
  isLoading: boolean;
  isUsingCachedData: boolean;
  fetchError: string | null;
  lastFetchAttemptAt: number | null;
  lastFetchSucceededAt: number | null;
  rawSchedule: ScheduleData | null;
  schedule: NormalizedSchedule | null;
  changesByOccurrenceId: Map<string, OccurrenceChangeInfo>;
}

type Listener = (state: AppState) => void;

function safelyParseTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export class ScheduleStore {
  private state: AppState;
  private listeners = new Set<Listener>();
  private refreshTimerId: number | null = null;
  private clockTimerId: number | null = null;
  private reloadTimerId: number | null = null;

  constructor(config: RuntimeConfig, route: RouteState) {
    this.state = {
      config,
      route,
      nowMs: this.getNowMsForRoute(route),
      isLoading: true,
      isUsingCachedData: false,
      fetchError: null,
      lastFetchAttemptAt: null,
      lastFetchSucceededAt: null,
      rawSchedule: null,
      schedule: null,
      changesByOccurrenceId: new Map(),
    };
  }

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async start(): Promise<void> {
    this.hydrateFromCache();
    this.startTimers();
    await this.refresh();
  }

  dispose(): void {
    if (this.refreshTimerId) {
      window.clearInterval(this.refreshTimerId);
    }

    if (this.clockTimerId) {
      window.clearInterval(this.clockTimerId);
    }

    if (this.reloadTimerId) {
      window.clearTimeout(this.reloadTimerId);
    }
  }

  updateRoute(route: RouteState): void {
    this.setState({
      route,
      nowMs: this.getNowMsForRoute(route),
    });
  }

  async refresh(): Promise<void> {
    this.setState({
      isLoading: true,
      fetchError: null,
      lastFetchAttemptAt: Date.now(),
      nowMs: this.getNowMsForRoute(),
    });

    try {
      const payload = await fetchScheduleData(this.state.config);
      const validated = validateScheduleData(payload);
      const normalized = normalizeSchedule(validated, this.state.config);
      const changesByOccurrenceId = diffOccurrences(this.state.schedule, normalized);

      saveCachedSchedule(this.state.config.scheduleDataEndpoint, payload);

      this.setState({
        isLoading: false,
        isUsingCachedData: false,
        fetchError: null,
        lastFetchSucceededAt: Date.now(),
        rawSchedule: validated,
        schedule: normalized,
        changesByOccurrenceId,
        nowMs: this.getNowMsForRoute(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown schedule refresh error.";

      this.setState({
        isLoading: false,
        fetchError: message,
        nowMs: this.getNowMsForRoute(),
      });
    }
  }

  private hydrateFromCache(): void {
    const cachedRecord = loadCachedSchedule(this.state.config.scheduleDataEndpoint);

    if (!cachedRecord) {
      return;
    }

    try {
      const validated = validateScheduleData(cachedRecord.payload);
      const normalized = normalizeSchedule(validated, this.state.config);

      this.setState({
        isLoading: true,
        isUsingCachedData: true,
        rawSchedule: validated,
        schedule: normalized,
        lastFetchSucceededAt: safelyParseTimestamp(cachedRecord.savedAt),
        nowMs: this.getNowMsForRoute(),
      });
    } catch (error) {
      console.warn("Ignoring invalid cached schedule payload.", error);
    }
  }

  private startTimers(): void {
    this.refreshTimerId = window.setInterval(
      () => void this.refresh(),
      this.state.config.refreshSeconds * 1000,
    );

    this.clockTimerId = window.setInterval(() => {
      this.setState({ nowMs: this.getNowMsForRoute() });
    }, 30_000);

    if (this.state.config.hardReloadMinutes > 0) {
      this.reloadTimerId = window.setTimeout(() => {
        window.location.reload();
      }, this.state.config.hardReloadMinutes * 60_000);
    }
  }

  private setState(patch: Partial<AppState>): void {
    this.state = {
      ...this.state,
      ...patch,
    };

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private getNowMsForRoute(route = this.state.route): number {
    return route.nowOverrideMs ?? Date.now();
  }
}
