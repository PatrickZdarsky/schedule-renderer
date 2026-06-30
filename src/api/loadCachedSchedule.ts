const CACHE_KEY_PREFIX = "awoostria-schedule-cache.v1";

interface CachedScheduleRecord {
  savedAt: string;
  payload: unknown;
}

function buildCacheKey(endpoint: string): string {
  return `${CACHE_KEY_PREFIX}:${endpoint}`;
}

export function loadCachedSchedule(endpoint: string): CachedScheduleRecord | null {
  try {
    const raw = window.localStorage.getItem(buildCacheKey(endpoint));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CachedScheduleRecord;
  } catch (error) {
    console.warn("Failed to load cached schedule.", error);
    return null;
  }
}

export function saveCachedSchedule(endpoint: string, payload: unknown): void {
  try {
    const record: CachedScheduleRecord = {
      savedAt: new Date().toISOString(),
      payload,
    };

    window.localStorage.setItem(buildCacheKey(endpoint), JSON.stringify(record));
  } catch (error) {
    console.warn("Failed to save cached schedule.", error);
  }
}
