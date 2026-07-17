// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeConfig } from "../src/config";
import { createChangedSchedulePair, createRuntimeConfig, createScheduleFixture } from "./helpers/fixtures";

interface BootstrapOptions {
  config?: RuntimeConfig;
  schedulePayload?: unknown;
  scheduleError?: Error;
}

function buildCacheKey(endpoint: string): string {
  return `awoostria-schedule-cache.v1:${endpoint}`;
}

function mockFetchResponses(options: BootstrapOptions = {}): void {
  const config = options.config ?? createRuntimeConfig();
  const schedulePayload = options.schedulePayload ?? createScheduleFixture();

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/config.json") || url === "/config.json") {
        return {
          ok: true,
          json: async () => config,
        } as Response;
      }

      if (url === config.scheduleDataEndpoint) {
        if (options.scheduleError) {
          throw options.scheduleError;
        }

        return {
          ok: true,
          json: async () => schedulePayload,
        } as Response;
      }

      throw new Error(`Unexpected fetch request in smoke test: ${url}`);
    }),
  );
}

async function bootAt(pathnameWithSearch: string, options: BootstrapOptions = {}): Promise<void> {
  window.history.replaceState({}, "", pathnameWithSearch);
  document.body.innerHTML = `<div id="app"></div>`;
  mockFetchResponses(options);
  vi.resetModules();
  const { bootApplication } = await import("../src/app");
  await bootApplication();
}

function getAppText(): string {
  return document.querySelector("#app")?.textContent ?? "";
}

function installLocalStorageMock(): void {
  const storage = new Map<string, string>();
  const localStorageMock: Storage = {
    get length() {
      return storage.size;
    },
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(storage.keys())[index] ?? null;
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  };

  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
  });
}

describe("route smoke tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-18T12:40:00Z"));
    installLocalStorageMock();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  it("boots the overview route and renders active rooms", async () => {
    await bootAt("/signage/overview?now=2026-06-18T14:40:00%2B02:00");

    const text = getAppText();

    expect(text).toContain("Awoostria 2026");
    expect(text).toContain("Preview mode is active.");
    expect(text).toContain("Overview");
    expect(text).toContain("Panel Room 1");
    expect(text).toContain("Main Stage");
    expect(text).not.toContain("Room Overview");
  });

  it("applies the global room whitelist across route rendering", async () => {
    await bootAt("/signage/overview?now=2026-06-18T14:40:00%2B02:00", {
      config: createRuntimeConfig({
        roomWhitelist: ["panel-1"],
      }),
    });

    const text = getAppText();

    expect(text).toContain("Panel Room 1");
    expect(text).not.toContain("Main Stage");
    expect(text).not.toContain("Workshop Room");
  });

  it("boots the single-room route and renders current and next content", async () => {
    await bootAt("/signage/room?room=panel-1&now=2026-06-18T14:40:00%2B02:00");

    const text = getAppText();

    expect(text).toContain("Panel Room 1");
    expect(text).toContain("Running a Friendly Furry Con");
    expect(text).toContain("How to Survive Your First Con");
    expect(text).toContain("Later today");
  });

  it("boots the room-multi route and preserves selected room ids including missing ones", async () => {
    await bootAt("/signage/room-multi?rooms=main-stage,missing-room,panel-1&now=2026-06-18T14:40:00%2B02:00");

    const text = getAppText();

    expect(text).toContain("Selected rooms");
    expect(text).toContain("Main Stage");
    expect(text).toContain("missing-room");
    expect(text).toContain("Room not found in the current schedule");
    expect(text).toContain("Panel Room 1");
  });

  it("boots the compact route and renders a program snapshot", async () => {
    await bootAt("/signage/compact?windowMinutes=120&now=2026-06-18T14:40:00%2B02:00");

    const text = getAppText();

    expect(text).toContain("Program Snapshot");
    expect(text).toContain("Upcoming");
    expect(text).toContain("Running a Friendly Furry Con");
    expect(text).toContain("Fursuit Dance Showcase");
  });

  it("renders cached schedule content when the live fetch fails", async () => {
    const config = createRuntimeConfig({
      hardReloadMinutes: 0,
    });

    window.localStorage.setItem(
      buildCacheKey(config.scheduleDataEndpoint),
      JSON.stringify({
        savedAt: "2026-06-18T12:45:00.000Z",
        payload: createScheduleFixture(),
      }),
    );

    await bootAt("/signage/overview", {
      config,
      scheduleError: new Error("Network down"),
    });

    const text = getAppText();

    expect(text).toContain("Showing the last known valid schedule.");
    expect(text).toContain("Network down");
    expect(text).toContain("Panel Room 1");
  });

  it("renders delayed and moved details after a refreshed schedule change", async () => {
    const { previous, next } = createChangedSchedulePair();
    const config = createRuntimeConfig({
      hardReloadMinutes: 0,
    });

    window.localStorage.setItem(
      buildCacheKey(config.scheduleDataEndpoint),
      JSON.stringify({
        savedAt: "2026-06-18T12:39:00.000Z",
        payload: previous,
      }),
    );

    await bootAt("/signage/compact?windowMinutes=180&now=2026-06-18T14:40:00%2B02:00", {
      config,
      schedulePayload: next,
    });

    const text = getAppText();

    expect(text).toContain("DELAYED +20 min");
    expect(text).toContain("MOVED");
    expect(text).toContain("Moved from Workshop Room");
  });
});
