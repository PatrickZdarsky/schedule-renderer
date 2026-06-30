import type { StaleLevel } from "../types/view-model";
import { escapeHtml } from "./escapeHtml";

export function renderStatusBanner(
  level: StaleLevel,
  message: string | null,
  secondaryMessage: string | null = null,
): string {
  if (!message) {
    return "";
  }

  const secondaryMarkup = secondaryMessage
    ? `<span class="status-banner__secondary">${escapeHtml(secondaryMessage)}</span>`
    : "";

  return `
    <aside class="status-banner status-banner--${level}">
      <span>${escapeHtml(message)}</span>
      ${secondaryMarkup}
    </aside>
  `;
}
