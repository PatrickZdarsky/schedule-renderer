import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DateTime } from "luxon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const sourcePath = path.join(repoRoot, "2026-awoo-events_sessions.json");
const outputPath = path.join(repoRoot, "public", "mock-data", "full-convention-2026.json");

const eventDateByDayNumber = {
  1: "2026-07-22",
  2: "2026-07-23",
  3: "2026-07-24",
  4: "2026-07-25",
};

const rooms = [
  { id: "main-stage", name: "Main Stage", venueId: "awoostria-campus" },
  { id: "artist", name: "Artist", venueId: "awoostria-campus" },
  { id: "healthlab", name: "HealthLab", venueId: "awoostria-campus" },
];

const roomPriority = {
  "main-stage": 0,
  artist: 1,
  healthlab: 2,
};

const sessionTypes = [
  ["panel", "Panel"],
  ["meetup", "Meetup"],
  ["workshop", "Workshop"],
  ["show", "Show"],
  ["social", "Social"],
  ["ceremony", "Ceremony"],
];

const tracks = [
  ["stage", "Stage & Spotlight"],
  ["creative", "Creative & Maker"],
  ["community", "Community & Wellbeing"],
];

function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function unique(values) {
  return [...new Set(values)];
}

function parseTags(entry) {
  return Array.isArray(entry.Tags) ? entry.Tags.filter(Boolean) : [];
}

function parsePreferredStarts(rawValue) {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return [];
  }

  const regex = /Day\s+(\d+)\s*-\s*[A-Z]{3}\s+(\d{2}:\d{2})/g;
  const results = [];
  let match;

  while ((match = regex.exec(rawValue)) !== null) {
    const dayNumber = Number.parseInt(match[1], 10);
    const time = match[2];
    const date = eventDateByDayNumber[dayNumber];

    if (!date) {
      continue;
    }

    results.push(`${date}T${time}:00+02:00`);
  }

  return unique(results).sort();
}

function inferRoom(entry) {
  const title = String(entry["Proposal title"] ?? "");
  const abstract = String(entry.Abstract ?? "");
  const audience = String(entry["Estimated headcount"] ?? "");
  const tags = parseTags(entry);
  const text = `${title} ${abstract} ${audience} ${tags.join(" ")}`.toLowerCase();

  if (
    audience.includes("XXXL (Main Stage)") ||
    tags.includes("Core Event") ||
    /opening|concert|competition|karaoke|showcase|dj|dance|maid caf|q&a|streamer|deep paws|water temple|earth temple|fire temple/.test(text)
  ) {
    return "main-stage";
  }

  if (
    /draw|animate|artist|photo|camera|plushie|plush|vj|indie game|game dev|craft|tinker|swap|trading|pok[eé]|mahjong|story|thermal|patterns/.test(
      text,
    ) ||
    tags.includes("Creative Exchange")
  ) {
    return "artist";
  }

  return "healthlab";
}

function inferTrackId(roomId) {
  if (roomId === "main-stage") {
    return "stage";
  }

  if (roomId === "artist") {
    return "creative";
  }

  return "community";
}

function inferSessionTypeId(entry) {
  const title = String(entry["Proposal title"] ?? "").toLowerCase();

  if (/opening/.test(title)) {
    return "ceremony";
  }

  if (/workshop|learn to play/.test(title)) {
    return "workshop";
  }

  if (/meet ?up|meet and|meet &|greet|social/.test(title)) {
    return "meetup";
  }

  if (/concert|competition|karaoke|showcase|dance/.test(title)) {
    return "show";
  }

  if (/cafe|caf\u00e9|tasting|fr\u00fchshoppen/.test(title)) {
    return "social";
  }

  return "panel";
}

function extractHostNames(entry) {
  if (Array.isArray(entry["Speaker names"]) && entry["Speaker names"].length > 0) {
    return entry["Speaker names"].filter(Boolean).map(String);
  }

  if (typeof entry["Host(s)"] === "string" && entry["Host(s)"].trim().length > 0) {
    return [entry["Host(s)"].trim()];
  }

  return ["TBA"];
}

function parseAudienceRank(entry) {
  const audience = String(entry["Estimated headcount"] ?? "");

  if (audience.includes("XXXL")) {
    return 4;
  }
  if (audience.includes("L (200")) {
    return 3;
  }
  if (audience.includes("M (100")) {
    return 2;
  }

  return 1;
}

function toMillis(isoString) {
  return Date.parse(isoString);
}

function formatViennaIso(timestampMs) {
  return DateTime.fromMillis(timestampMs, { zone: "Europe/Vienna" }).toISO({
    suppressMilliseconds: true,
  });
}

function isSlotFree(roomSchedule, startMs, endMs) {
  return roomSchedule.every((item) => endMs <= item.startMs || startMs >= item.endMs);
}

function sortRoomSchedule(roomSchedule) {
  roomSchedule.sort((left, right) => left.startMs - right.startMs);
}

function getRoomDayLoad(roomSchedule, dateKey) {
  return roomSchedule.filter((item) => item.dateKey === dateKey).length;
}

function createFallbackStarts(preferredStarts) {
  const preferredDays = unique(
    preferredStarts
      .map((isoString) => isoString.slice(0, 10))
      .filter(Boolean),
  );
  const allDays = Object.values(eventDateByDayNumber);
  const orderedDays =
    preferredDays.length > 0
      ? [...preferredDays, ...allDays.filter((day) => !preferredDays.includes(day))]
      : allDays;
  const fallbackStarts = [];

  for (const date of orderedDays) {
    for (let hour = 10; hour <= 21; hour += 1) {
      for (const minute of [0, 15, 30, 45]) {
        const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        fallbackStarts.push(`${date}T${time}:00+02:00`);
      }
    }
  }

  return fallbackStarts;
}

function pickStart(entry, roomSchedule) {
  const durationMinutes = Number(entry.Duration ?? 60);
  const preferredStarts = parsePreferredStarts(entry["Preferred time slots"]);
  const fallbackStarts = createFallbackStarts(preferredStarts);
  const chooseBestStart = (isoStrings) => {
    const freeCandidates = isoStrings
      .map((isoString) => {
        const startMs = toMillis(isoString);
        const endMs = startMs + durationMinutes * 60_000;
        const dayEndMs = toMillis(`${isoString.slice(0, 10)}T23:59:00+02:00`);

        return {
          isoString,
          startMs,
          endMs,
          dateKey: isoString.slice(0, 10),
          dayEndMs,
        };
      })
      .filter(
        (candidate) =>
          candidate.endMs <= candidate.dayEndMs &&
          isSlotFree(roomSchedule, candidate.startMs, candidate.endMs),
      );

    freeCandidates.sort((left, right) => {
      const loadDelta =
        getRoomDayLoad(roomSchedule, left.dateKey) - getRoomDayLoad(roomSchedule, right.dateKey);

      if (loadDelta !== 0) {
        return loadDelta;
      }

      return left.startMs - right.startMs;
    });

    return freeCandidates[0] ?? null;
  };

  const choice = chooseBestStart(preferredStarts.length > 0 ? preferredStarts : []) ?? chooseBestStart(fallbackStarts);

  if (choice) {
    roomSchedule.push({
      startMs: choice.startMs,
      endMs: choice.endMs,
      dateKey: choice.dateKey,
    });
    sortRoomSchedule(roomSchedule);
    return choice.isoString;
  }

  throw new Error(`Could not place session ${entry.ID} (${entry["Proposal title"]}).`);
}

function buildLabels(entries) {
  const tagNames = unique(
    entries.flatMap((entry) => parseTags(entry)),
  ).sort((left, right) => left.localeCompare(right));

  return tagNames.map((tagName) => ({
    id: slugify(tagName),
    displayName: { "en-US": tagName },
  }));
}

async function main() {
  const rawSource = await readFile(sourcePath, "utf8");
  const entries = JSON.parse(rawSource);
  const labels = buildLabels(entries);
  const labelIdByName = new Map(labels.map((label) => [label.displayName["en-US"], label.id]));
  const hosts = [];
  const hostIdByName = new Map();

  for (const entry of entries) {
    for (const hostName of extractHostNames(entry)) {
      if (hostIdByName.has(hostName)) {
        continue;
      }

      const hostId = slugify(hostName) || `host-${hosts.length + 1}`;
      hostIdByName.set(hostName, hostId);
      hosts.push({
        id: hostId,
        displayName: hostName,
      });
    }
  }

  const roomSchedule = new Map(rooms.map((room) => [room.id, []]));
  const schedulableEntries = [...entries].sort((left, right) => {
    const leftRoomId = inferRoom(left);
    const rightRoomId = inferRoom(right);
    const leftPrefCount = parsePreferredStarts(left["Preferred time slots"]).length || 99;
    const rightPrefCount = parsePreferredStarts(right["Preferred time slots"]).length || 99;
    const roomDelta = roomPriority[leftRoomId] - roomPriority[rightRoomId];

    if (roomDelta !== 0) {
      return roomDelta;
    }

    if (leftPrefCount !== rightPrefCount) {
      return leftPrefCount - rightPrefCount;
    }

    const audienceDelta = parseAudienceRank(right) - parseAudienceRank(left);

    if (audienceDelta !== 0) {
      return audienceDelta;
    }

    return Number(right.Duration ?? 0) - Number(left.Duration ?? 0);
  });

  const scheduledById = new Map();

  for (const entry of schedulableEntries) {
    const roomId = inferRoom(entry);
    const slotStart = pickStart(entry, roomSchedule.get(roomId));
    scheduledById.set(entry.ID, { roomId, slotStart });
  }

  const sessions = entries.map((entry) => {
    const roomAssignment = scheduledById.get(entry.ID);
    const hostIds = extractHostNames(entry).map((hostName) => hostIdByName.get(hostName));
    const durationMinutes = Number(entry.Duration ?? 60);
    const startMs = toMillis(roomAssignment.slotStart);
    const endMs = startMs + durationMinutes * 60_000;
    const startIso = formatViennaIso(startMs);
    const endIso = formatViennaIso(endMs);
    const labelIds = parseTags(entry)
      .map((tagName) => labelIdByName.get(tagName))
      .filter(Boolean);
    const tags = parseTags(entry);

    return {
      id: String(entry.ID).toLowerCase(),
      displayName: {
        "en-US": String(entry["Proposal title"]),
      },
      description: {
        "en-US": String(entry.Abstract ?? "No abstract provided."),
      },
      timeSlots: [
        {
          id: `${String(entry.ID).toLowerCase()}-slot`,
          startTime: startIso,
          endTime: endIso,
          roomIds: [roomAssignment.roomId],
          hostIds,
        },
      ],
      typeId: inferSessionTypeId(entry),
      trackId: inferTrackId(roomAssignment.roomId),
      labelIds,
      minAge: tags.includes("NSFW") ? 18 : 0,
      ticketed: false,
    };
  });

  const output = {
    schemaVersion: "1.0.0",
    updatedAt: "2026-07-21T20:00:00+02:00",
    source: {
      name: "Awoostria full convention mock generator",
      vendorId: "mock-generator",
      appVersion: "1.0.0",
      lastModifiedBy: "Codex",
      lastModifiedAt: "2026-07-21T20:00:00+02:00",
    },
    event: {
      id: "awoostria-2026-full-mock",
      displayName: {
        "en-US": "Awoostria 2026 Full Convention Mock",
      },
      formattedAddress: "Hyatt Regency Vienna & Cape 10, Vienna, Austria",
      startTime: "2026-07-22T09:00:00+02:00",
      endTime: "2026-07-25T23:30:00+02:00",
      timezone: "Europe/Vienna",
      description: {
        "en-US": "Generated mock schedule using the current 2026 panel submissions, roughly spread across Main Stage, Artist, and HealthLab.",
      },
    },
    membershipLevels: [],
    tracks: tracks.map(([id, name]) => ({
      id,
      displayName: { "en-US": name },
    })),
    sessionTypes: sessionTypes.map(([id, name]) => ({
      id,
      displayName: { "en-US": name },
    })),
    labels,
    venues: [
      {
        id: "awoostria-campus",
        displayName: {
          "en-US": "Awoostria Campus",
        },
        formattedAddress: "Hyatt Regency Vienna & Cape 10, Vienna, Austria",
      },
    ],
    rooms: rooms.map((room) => ({
      id: room.id,
      displayName: { "en-US": room.name },
      venueId: room.venueId,
    })),
    hosts,
    sessions,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Generated ${sessions.length} sessions into ${path.relative(repoRoot, outputPath)}.`);
}

await main();
