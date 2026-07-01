import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/signage.css";
import { bootApplication } from "./app";
import { escapeHtml } from "./ui/escapeHtml";

void bootApplication().catch((error) => {
  const root = document.querySelector<HTMLDivElement>("#app");
  const message = error instanceof Error ? error.message : "Unknown bootstrap failure.";

  if (root) {
    root.innerHTML = `
      <div class="app-shell app-shell--left">
        <main class="signage-column">
          <section class="card">
            <header class="card__header">Startup error</header>
            <div class="card__body">
              <p class="empty-state">${escapeHtml(message)}</p>
            </div>
          </section>
        </main>
      </div>
    `;
  }

  console.error(error);
});
