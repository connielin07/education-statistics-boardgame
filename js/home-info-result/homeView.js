const homeMarkup = `
  <section class="screen home-screen" aria-labelledby="home-title">
    <div class="home-screen__content">
      <h1 id="home-title">偏鄉高級中等校園資源調度戰</h1>
      <p class="home-screen__subtitle">以教育部統計處資料為基礎的資源分配遊戲</p>

      <div class="home-screen__actions">
        <button class="action-button action-button--primary" type="button">START</button>
        <button class="action-button action-button--primary" type="button">RULES</button>
      </div>
    </div>
  </section>
`;

export function renderHomeView() {
  const root = document.querySelector("#home-screen-root");

  if (!root) {
    return;
  }

  root.innerHTML = homeMarkup;
}

renderHomeView();
