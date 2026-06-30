import type { RuntimeConfig } from "../config";

export class FetchScheduleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchScheduleError";
  }
}

export async function fetchScheduleData(config: RuntimeConfig): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), config.fetchTimeoutMs);

  try {
    const response = await fetch(config.scheduleDataEndpoint, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new FetchScheduleError(`Schedule request failed with ${response.status}.`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FetchScheduleError("Schedule request timed out.");
    }

    if (error instanceof FetchScheduleError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown schedule fetch error.";
    throw new FetchScheduleError(message);
  } finally {
    window.clearTimeout(timeoutId);
  }
}
