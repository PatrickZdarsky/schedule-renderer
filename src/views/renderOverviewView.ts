import type { OverviewRoomModel } from "../domain/selectors";
import { renderCard } from "../ui/cards";
import { renderHero, renderOccurrenceBlock } from "./renderCommon";

interface RenderOverviewViewInput {
  rooms: OverviewRoomModel[];
  timezone: string;
  nowMs: number;
  windowMinutes: number;
}

export function renderOverviewView(input: RenderOverviewViewInput): string {
  const { rooms, timezone, nowMs, windowMinutes } = input;

  const body =
    rooms.length > 0
      ? `<div class="room-board">${rooms
          .map((room) => {
            const currentMarkup = room.current
              ? renderOccurrenceBlock(room.current, {
                  leadingLabel: room.current.state.isCurrent ? "NOW" : null,
                  timezone,
                  nowMs,
                  showRooms: false,
                  compact: true,
                  dense: true,
                  showDescription: false,
                  timingAside: true,
                })
              : `<p class="room-board__empty">Nothing live in this room right now.</p>`;
            const upcomingMarkup = room.upcoming
              ? renderOccurrenceBlock(room.upcoming, {
                  leadingLabel: "NEXT",
                  timezone,
                  nowMs,
                  showRooms: false,
                  compact: true,
                  dense: true,
                  showDescription: false,
                  timingAside: true,
                })
              : `<p class="room-board__empty room-board__empty--subtle">No more scheduled items in the current overview window.</p>`;

            return `
              <section class="room-board__section">
                <header class="room-board__header">
                  <h3 class="room-board__title">${room.room.name}</h3>
                  ${
                    room.room.venueName
                      ? `<p class="room-board__subtitle">${room.room.venueName}</p>`
                      : ""
                  }
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
          .join("")}</div>`
      : `<p class="empty-state">No rooms have activity in the current overview window.</p>`;

  return [
    renderHero("Overview", "Room Overview", `By room for the next ${windowMinutes} minutes`),
    renderCard(null, body, "card--overview-shell"),
  ].join("");
}
