import type { PresentedOccurrence } from "../domain/selectors";
import { renderCard } from "../ui/cards";
import { renderHero, renderOccurrenceBlock } from "./renderCommon";

interface RenderCompactViewInput {
  items: PresentedOccurrence[];
  timezone: string;
  nowMs: number;
  windowMinutes: number;
}

export function renderCompactView(input: RenderCompactViewInput): string {
  const { items, timezone, nowMs, windowMinutes } = input;

  const body =
    items.length > 0
      ? `<div class="program-list program-list--compact">${items
          .map((item) =>
            renderOccurrenceBlock(item, {
              leadingLabel: item.state.isCurrent ? "NOW" : null,
              timezone,
              nowMs,
              showRooms: true,
              compact: true,
            }),
          )
          .join("")}</div>`
      : `<p class="empty-state">No sessions available in the next ${windowMinutes} minutes.</p>`;

  return [
    renderHero("Compact", "Program Snapshot", `Designed for a narrow left-side layout`),
    renderCard("Upcoming", body, "card--compact"),
  ].join("");
}
