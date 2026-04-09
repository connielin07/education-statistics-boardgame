const gameMarkup = `
  <section class="screen game-screen" aria-labelledby="game-title">
    <header class="game-screen__topbar">
      <h2 id="game-title">偏鄉高級中等校園資源調度戰</h2>
      <div class="round-badge">ROUND 1/3</div>
    </header>

    <div class="game-screen__statusbar">
      <p class="status-points">POINTS : 10</p>
      <p class="status-used">USED: 0 / 3</p>
      <button class="dropdown-button" type="button">
        <span>EVENT</span>
        <span class="dropdown-button__arrow">▼</span>
      </button>
    </div>

    <div class="resource-strip" aria-label="資源調整列">
      <div class="resource-counter">
        <button type="button" aria-label="減少資源一">−</button>
        <strong>0</strong>
        <button type="button" aria-label="增加資源一">+</button>
      </div>
      <div class="resource-counter">
        <button type="button" aria-label="減少資源二">−</button>
        <strong>0</strong>
        <button type="button" aria-label="增加資源二">+</button>
      </div>
      <div class="resource-counter">
        <button type="button" aria-label="減少資源三">−</button>
        <strong>0</strong>
        <button type="button" aria-label="增加資源三">+</button>
      </div>
    </div>

    <div class="game-screen__body">
      <main class="school-grid" aria-label="學校卡片區">
        <article class="school-card">
          <header class="school-card__header">School A</header>
          <div class="school-card__body">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
          </div>
        </article>

        <article class="school-card">
          <header class="school-card__header">School B</header>
          <div class="school-card__body">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
          </div>
        </article>

        <article class="school-card">
          <header class="school-card__header">School C</header>
          <div class="school-card__body">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. At purus tellus arcu sit nibh consectetur.</p>
          </div>
        </article>
      </main>

      <aside class="side-actions" aria-label="遊戲操作">
        <button class="action-button action-button--panel" type="button">RESET ↻</button>
        <button class="action-button action-button--panel" type="button">FINISH →</button>
      </aside>
    </div>
  </section>
`;

export function renderInfoView() {
  const root = document.querySelector("#game-screen-root");

  if (!root) {
    return;
  }

  root.innerHTML = gameMarkup;
}

renderInfoView();
