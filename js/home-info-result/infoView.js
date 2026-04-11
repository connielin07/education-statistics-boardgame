import { renderResultView } from "./resultView.js";

export const gameState = {
  round: 1,
  totalRounds: 3,
  points: 10,
  used: 0,
  maxResource: 3,
  allocations: [0, 0, 0],
  eventTitle: "交通不便加劇",
  eventDescription: "特偏或極偏學校若未獲資源，本回合 -2 分。",
};

function getHintText(state) {
  if (state.used === 0) {
    return "提示：請先分配 3 點資源。";
  }

  if (state.used < state.maxResource) {
    return `提示：尚有 ${state.maxResource - state.used} 點資源未分配完成。`;
  }

  return "提示：分配完成，請按 FINISH。";
}

function createGameMarkup(state) {
  return `
    <section class="screen game-screen" aria-labelledby="game-title">
      <header class="game-screen__topbar">
        <h2 id="game-title">偏鄉高級中等校園資源調度戰</h2>
        <div class="round-badge">ROUND ${state.round}/${state.totalRounds}</div>
      </header>

      <div class="game-screen__statusbar">
        <p class="status-points">POINTS : ${state.points}</p>
        <p class="status-used">USED: ${state.used} / ${state.maxResource}</p>

        <button
          id="eventBtn"
          class="dropdown-button"
          type="button"
          aria-haspopup="dialog"
        >
          <span>EVENT</span>
          <span class="dropdown-button__arrow">▼</span>
        </button>
      </div>

      <div class="game-hint-row">
        <div class="game-hint">${getHintText(state)}</div>
      </div>

      <div class="resource-strip" aria-label="資源調整列">
        <div class="resource-counter">
          <button type="button" class="minus-btn" data-index="0" aria-label="減少資源一">−</button>
          <strong>${state.allocations[0]}</strong>
          <button type="button" class="plus-btn" data-index="0" aria-label="增加資源一">+</button>
        </div>

        <div class="resource-counter">
          <button type="button" class="minus-btn" data-index="1" aria-label="減少資源二">−</button>
          <strong>${state.allocations[1]}</strong>
          <button type="button" class="plus-btn" data-index="1" aria-label="增加資源二">+</button>
        </div>

        <div class="resource-counter">
          <button type="button" class="minus-btn" data-index="2" aria-label="減少資源三">−</button>
          <strong>${state.allocations[2]}</strong>
          <button type="button" class="plus-btn" data-index="2" aria-label="增加資源三">+</button>
        </div>
      </div>

      <div class="game-screen__body">
        <main class="school-grid" aria-label="學校卡片區">
          <article class="school-card">
            <header class="school-card__header">School A</header>
            <div class="school-card__body">
              <p>地區：東部</p>
              <p>偏遠級別：特偏</p>
              <p>學生規模變動率：-8.2%</p>
              <p>分類結果：明顯下降</p>
              <p>中位比較：低於整體中位</p>
            </div>
          </article>

          <article class="school-card">
            <header class="school-card__header">School B</header>
            <div class="school-card__body">
              <p>地區：南部</p>
              <p>偏遠級別：偏遠</p>
              <p>學生規模變動率：-3.1%</p>
              <p>分類結果：小幅下降</p>
              <p>中位比較：低於整體中位</p>
            </div>
          </article>

          <article class="school-card">
            <header class="school-card__header">School C</header>
            <div class="school-card__body">
              <p>地區：中部</p>
              <p>偏遠級別：非偏遠</p>
              <p>學生規模變動率：1.5%</p>
              <p>分類結果：穩定或成長</p>
              <p>中位比較：高於整體中位</p>
            </div>
          </article>
        </main>

        <aside class="side-actions" aria-label="遊戲操作">
          <button id="resetBtn" class="action-button action-button--panel" type="button">RESET ↻</button>
          <button id="finishBtn" class="action-button action-button--panel" type="button">FINISH →</button>
        </aside>
      </div>

      <div id="eventModal" class="event-modal" hidden>
        <div class="event-modal__backdrop"></div>

        <div
          class="event-modal__card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eventModalTitle"
        >
          <h3 id="eventModalTitle" class="event-modal__title">${state.eventTitle}</h3>
          <p class="event-modal__desc">${state.eventDescription}</p>

          <button
            id="closeEventBtn"
            class="action-button action-button--primary"
            type="button"
          >
            CLOSE
          </button>
        </div>
      </div>
    </section>
  `;
}

function updateUsedResource() {
  gameState.used = gameState.allocations.reduce((sum, value) => sum + value, 0);
}

function rerenderInfoView() {
  const root = document.querySelector("#game-screen-root");

  if (!root) return;

  updateUsedResource();
  root.innerHTML = createGameMarkup(gameState);
  bindInfoEvents();
}

function increaseResource(index) {
  updateUsedResource();

  if (gameState.used >= gameState.maxResource) {
    return;
  }

  gameState.allocations[index] += 1;
  rerenderInfoView();
}

function decreaseResource(index) {
  if (gameState.allocations[index] <= 0) {
    return;
  }

  gameState.allocations[index] -= 1;
  rerenderInfoView();
}

function resetResources() {
  gameState.allocations = [0, 0, 0];
  rerenderInfoView();
}

function openEventModal() {
  const modal = document.getElementById("eventModal");
  if (!modal) return;
  modal.hidden = false;
}

function closeEventModal() {
  const modal = document.getElementById("eventModal");
  if (!modal) return;
  modal.hidden = true;
}

function goToResultScreen() {
  const homeRoot = document.querySelector("#home-screen-root");
  const gameRoot = document.querySelector("#game-screen-root");
  const resultRoot = document.querySelector("#result-screen-root");

  if (homeRoot) homeRoot.style.display = "none";
  if (gameRoot) gameRoot.style.display = "none";
  if (resultRoot) resultRoot.style.display = "block";

  renderResultView();
}

function handleFinish() {
  updateUsedResource();

  if (gameState.used !== gameState.maxResource) {
    alert("請先剛好分配完 3 點資源。");
    return;
  }

  // 第 1、2 回合：進下一回合
  if (gameState.round < gameState.totalRounds) {
    gameState.round += 1;
    gameState.allocations = [0, 0, 0];
    gameState.used = 0;
    rerenderInfoView();
    return;
  }

  // 第 3 回合：跳到結算頁
  goToResultScreen();
}

function handleEscClose(event) {
  if (event.key === "Escape") {
    closeEventModal();
  }
}

function bindInfoEvents() {
  const plusButtons = document.querySelectorAll(".plus-btn");
  const minusButtons = document.querySelectorAll(".minus-btn");
  const resetBtn = document.getElementById("resetBtn");
  const finishBtn = document.getElementById("finishBtn");
  const eventBtn = document.getElementById("eventBtn");
  const closeEventBtn = document.getElementById("closeEventBtn");
  const backdrop = document.querySelector(".event-modal__backdrop");

  plusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      increaseResource(index);
    });
  });

  minusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      decreaseResource(index);
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", resetResources);
  }

  if (finishBtn) {
    finishBtn.addEventListener("click", handleFinish);
  }

  if (eventBtn) {
    eventBtn.addEventListener("click", openEventModal);
  }

  if (closeEventBtn) {
    closeEventBtn.addEventListener("click", closeEventModal);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeEventModal);
  }

  document.addEventListener("keydown", handleEscClose);
}

export function renderInfoView() {
  rerenderInfoView();
}

renderInfoView();