import type { PresentedOccurrence } from "../domain/selectors";
import { formatClockTime, formatEndsIn, formatRelativeWindow, formatTimeRange } from "../domain/time";
import { escapeHtml } from "../ui/escapeHtml";
import { renderOccurrenceBadges } from "../ui/badges";

interface RenderOccurrenceOptions {
  leadingLabel: "NOW" | "NEXT" | null;
  timezone: string;
  nowMs: number;
  showRooms: boolean;
  compact?: boolean;
  emphasize?: boolean;
  dense?: boolean;
  showDescription?: boolean;
  emphasizeLocation?: boolean;
  timingAside?: boolean;
}

function buildMetaParts(
  item: PresentedOccurrence,
  showRooms: boolean,
  includeRoomsInMeta: boolean,
): string[] {
  const parts: string[] = [];

  if (showRooms && includeRoomsInMeta && item.occurrence.roomNames.length > 0) {
    parts.push(item.occurrence.roomNames.join(", "));
  }

  if (item.occurrence.hostNames.length > 0) {
    parts.push(item.occurrence.hostNames.join(", "));
  }

  if (item.occurrence.typeName) {
    parts.push(item.occurrence.typeName);
  }

  if (item.occurrence.trackName) {
    parts.push(item.occurrence.trackName);
  }

  return parts;
}

function buildNotes(item: PresentedOccurrence, nowMs: number): string[] {
  const notes: string[] = [];

  if (item.state.isCurrent) {
    notes.push(formatEndsIn(item.occurrence.endMs, nowMs));
  } else if (item.state.justEnded) {
    notes.push("Just ended");
  } else {
    notes.push(formatRelativeWindow(item.occurrence.startMs, nowMs));
  }

  if (item.movedFromText) {
    notes.push(`Moved from ${item.movedFromText}`);
  }

  if (item.occurrence.apiStatus === "CANCELLED") {
    notes.push("This session will not take place.");
  }

  return notes;
}

export function renderOccurrenceBlock(item: PresentedOccurrence, options: RenderOccurrenceOptions): string {
  const modifierClasses = [
    "occurrence",
    options.compact ? "occurrence--compact" : "",
    options.dense ? "occurrence--dense" : "",
    options.timingAside ? "occurrence--timing-aside" : "",
    options.emphasize ? "occurrence--emphasis" : "",
    item.occurrence.apiStatus === "CANCELLED" ? "occurrence--cancelled" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const showDescription = options.showDescription ?? !options.compact;
  const emphasizeLocation = options.emphasizeLocation ?? false;
  const metaParts = buildMetaParts(item, options.showRooms, !emphasizeLocation);
  const noteParts = buildNotes(item, options.nowMs);
  const primaryNote = noteParts[0] ?? null;
  const secondaryNotes = noteParts.slice(1);
  const locationMarkup =
    options.showRooms && emphasizeLocation && item.occurrence.roomNames.length > 0
      ? `<p class="occurrence__location">Where: ${escapeHtml(item.occurrence.roomNames.join(", "))}</p>`
      : "";
  const timeMarkup = `<p class="occurrence__time">${escapeHtml(
    formatTimeRange(item.occurrence.startMs, item.occurrence.endMs, options.timezone),
  )}</p>`;
  const timingAsideMarkup = options.timingAside
    ? `
      <aside class="occurrence__timing">
        ${timeMarkup}
        ${
          primaryNote
            ? `<p class="occurrence__timing-note">${escapeHtml(primaryNote)}</p>`
            : ""
        }
      </aside>
    `
    : "";
  const notesMarkup =
    !options.timingAside || secondaryNotes.length > 0
      ? `
        <div class="occurrence__notes">
          ${(!options.timingAside ? noteParts : secondaryNotes)
            .map((note) => `<span>${escapeHtml(note)}</span>`)
            .join("")}
        </div>
      `
      : "";

  return `
    <article class="${modifierClasses}">
      <div class="occurrence__main">
        <div class="occurrence__content">
          <div class="occurrence__badges">
            ${renderOccurrenceBadges(item, options.leadingLabel)}
          </div>
          ${options.timingAside ? "" : timeMarkup}
          ${locationMarkup}
          <h3 class="occurrence__title">${escapeHtml(item.occurrence.title)}</h3>
          ${
            item.occurrence.description && showDescription
              ? `<p class="occurrence__description">${escapeHtml(item.occurrence.description)}</p>`
              : ""
          }
          ${
            metaParts.length > 0
              ? `<p class="occurrence__meta">${escapeHtml(metaParts.join(" • "))}</p>`
              : ""
          }
          ${notesMarkup}
        </div>
        ${timingAsideMarkup}
      </div>
    </article>
  `;
}

export function renderLaterList(items: PresentedOccurrence[], timezone: string): string {
  if (items.length === 0) {
    return `<p class="empty-state empty-state--subtle">No further events listed for today.</p>`;
  }

  return `
    <div class="later-list">
      ${items
        .map(
          (item) => `
            <div class="later-list__row">
              <span class="later-list__time">${escapeHtml(
                formatClockTime(item.occurrence.startMs, timezone),
              )}</span>
              <span class="later-list__title">${escapeHtml(item.occurrence.title)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

export function renderHero(eyebrow: string, title: string, subtitle: string | null): string {
  return `
    <section class="hero">
      <p class="hero__eyebrow">${escapeHtml(eyebrow)}</p>
      <h1 class="hero__title">${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="hero__subtitle">${escapeHtml(subtitle)}</p>` : ""}
    </section>
  `;
}
