import type { MultiRoomViewModel } from "../domain/selectors";
import { renderCard } from "../ui/cards";
import { escapeHtml } from "../ui/escapeHtml";
import { renderHero, renderOccurrenceBlock } from "./renderCommon";

interface RenderRoomMultiViewInput {
  rooms: MultiRoomViewModel[];
  timezone: string;
  nowMs: number;
  windowMinutes: number;
}

export function renderRoomMultiView(input: RenderRoomMultiViewInput): string {
  const { rooms, timezone, nowMs, windowMinutes } = input;

  if (rooms.length === 0) {
    return [
      renderHero("Selected rooms", null, "Choose room IDs in the URL to render a custom room board."),
      renderCard(
        "Missing rooms",
        `<p class="empty-state">Example: <code>/signage/room-multi?rooms=panel-1,main-stage</code></p>`,
      ),
    ].join("");
  }

  const body = `<div class="room-board">${rooms
    .map(({ requestedRoomId, model }) => {
      const title = model.room?.name ?? requestedRoomId;
      const subtitle = model.room?.venueName ?? (model.room ? "" : "Room not found in the current schedule");
      const currentMarkup = model.current
        ? renderOccurrenceBlock(model.current, {
            leadingLabel: model.current.state.isCurrent ? "NOW" : null,
            timezone,
            nowMs,
            showRooms: false,
            compact: true,
            dense: true,
            showDescription: false,
            timingAside: true,
          })
        : `<p class="room-board__empty">${escapeHtml(
            model.emptyMessage ?? "Nothing live in this room right now.",
          )}</p>`;
      const upcomingMarkup = model.next
        ? renderOccurrenceBlock(model.next, {
            leadingLabel: "NEXT",
            timezone,
            nowMs,
            showRooms: false,
            compact: true,
            dense: true,
            showDescription: false,
            timingAside: true,
          })
        : `<p class="room-board__empty room-board__empty--subtle">${escapeHtml(
            model.room
              ? "No more scheduled items in the current overview window."
              : "Check the room ID in the URL or schedule payload.",
          )}</p>`;

      return `
        <section class="room-board__section">
          <header class="room-board__header">
            <h3 class="room-board__title">${escapeHtml(title)}</h3>
            ${subtitle ? `<p class="room-board__subtitle">${escapeHtml(subtitle)}</p>` : ""}
          </header>
          <div class="room-board__current">
            ${currentMarkup}
          </div>
          <div class="room-board__upcoming">
            ${upcomingMarkup}
          </div>
        </section>
      `;
    })
    .join("")}</div>`;

  return [
    renderHero("Selected rooms", null, `Showing ${rooms.length} chosen rooms for the next ${windowMinutes} minutes`),
    renderCard(null, body, "card--overview-shell"),
  ].join("");
}
