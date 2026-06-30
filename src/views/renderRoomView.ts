import type { RuntimeConfig } from "../config";
import type { RoomViewModel } from "../domain/selectors";
import { renderCard } from "../ui/cards";
import { renderHero, renderLaterList, renderOccurrenceBlock } from "./renderCommon";

interface RenderRoomViewInput {
  model: RoomViewModel;
  config: RuntimeConfig;
  timezone: string;
  nowMs: number;
  roomId: string | null;
}

export function renderRoomView(input: RenderRoomViewInput): string {
  const { model, config, timezone, nowMs, roomId } = input;

  if (!roomId) {
    return [
      renderHero("Room display", "Room parameter required", "Use ?room=room-id to choose a room."),
      renderCard(
        "Missing room",
        `<p class="empty-state">Example: <code>/signage/room?room=panel-1</code></p>`,
      ),
    ].join("");
  }

  const subtitle =
    model.room && config.showVenueInRoomHeader ? model.room.venueName : "Schedule renderer";
  const blocks: string[] = [renderHero("Room display", model.room?.name ?? roomId, subtitle ?? null)];
  const shouldShowLaterCard = model.current !== null || model.next !== null || model.later.length > 0;

  if (model.current) {
    blocks.push(
      renderCard(
        null,
        renderOccurrenceBlock(model.current, {
          leadingLabel: "NOW",
          timezone,
          nowMs,
          showRooms: false,
          emphasize: true,
        }),
        "card--strong",
      ),
    );
  } else {
    blocks.push(
      renderCard(
        null,
        `<p class="empty-state">${
          model.emptyMessage ?? "No current event in this room. The next session will appear below."
        }</p>`,
      ),
    );
  }

  if (model.next) {
    blocks.push(
      renderCard(
        null,
        renderOccurrenceBlock(model.next, {
          leadingLabel: "NEXT",
          timezone,
          nowMs,
          showRooms: false,
        }),
      ),
    );
  }

  if (shouldShowLaterCard) {
    blocks.push(renderCard("Later today", renderLaterList(model.later, timezone)));
  }

  return blocks.join("");
}
