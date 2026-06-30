import type { PresentedOccurrence } from "../domain/selectors";
import { escapeHtml } from "./escapeHtml";

function renderBadge(label: string, className: string): string {
  return `<span class="badge ${className}">${escapeHtml(label)}</span>`;
}

export function renderOccurrenceBadges(
  occurrence: PresentedOccurrence,
  leadingLabel: "NOW" | "NEXT" | null,
): string {
  const badges: string[] = [];

  if (leadingLabel) {
    badges.push(renderBadge(leadingLabel, "badge--primary"));
  }

  if (occurrence.state.isStartingSoon && !occurrence.state.isCurrent) {
    badges.push(renderBadge("STARTS SOON", "badge--success"));
  }

  if (occurrence.occurrence.apiStatus === "DELAYED") {
    badges.push(
      renderBadge(
        occurrence.delayText ? `DELAYED ${occurrence.delayText}` : "DELAYED",
        "badge--warning",
      ),
    );
  }

  if (occurrence.occurrence.apiStatus === "CANCELLED") {
    badges.push(renderBadge("CANCELLED", "badge--danger"));
  }

  if (occurrence.occurrence.apiStatus === "MOVED") {
    badges.push(renderBadge("MOVED", "badge--info"));
  }

  return badges.join("");
}
