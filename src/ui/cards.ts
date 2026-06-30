import { escapeHtml } from "./escapeHtml";

export function renderCard(title: string | null, body: string, modifierClass = ""): string {
  const normalizedModifier = modifierClass ? ` ${modifierClass}` : "";
  const headerMarkup = title
    ? `<header class="card__header">${escapeHtml(title)}</header>`
    : "";

  return `
    <section class="card${normalizedModifier}">
      ${headerMarkup}
      <div class="card__body">
        ${body}
      </div>
    </section>
  `;
}
