import { gameState, renderInfoView } from "./infoView.js";

const homeMarkup = `
  <section class="screen home-screen" aria-labelledby="home-title">
    <div class="home-screen__content">
      <h1 id="home-title">偏鄉高級中等校園資源調度戰</h1>
      <p class="home-screen__subtitle">以教育部統計處資料為基礎的資源分配遊戲</p>

      <div class="home-screen__actions">
        <button
          id="startBtn"
          class="action-button action-button--primary"
          type="button"
        >
          START
        </button>

        <button
          id="rulesBtn"
          class="action-button action-button--primary"
          type="button"
        >
          RULES
        </button>
      </div>
    </div>

    <div
      id="rulesModal"
      class="rules-modal"
      hidden
      aria-hidden="true"
      role="dialog"
      aria-labelledby="rules-title"
    >
      <div class="rules-modal__backdrop"></div>

      <div class="rules-modal__panel">
        <h2 id="rules-title">遊戲規則</h2>

        <div class="rules-modal__content">
          <p>1. 本遊戲共 3 回合，每回合需在 3 所學校間分配 3 點資源。</p>
          <p>2. 請根據學校資料卡與事件卡內容判斷資源優先順序。</p>
          <p>3. 明顯下降學校每 1 點資源 +2 分；小幅下降每 1 點 +1 分；穩定或成長 +0 分。</p>
          <p>4. 若該校低於整體中位且本回合有獲得資源，可額外 +1 分。</p>
          <p>5. 三回合結束後，系統會顯示總分與結果評語。</p>
        </div>

        <div class="rules-modal__actions">
          <button
            id="closeRulesBtn"
            class="action-button action-button--primary"
            type="button"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  </section>
`;

function resetGameState() {
  gameState.round = 1;
  gameState.points = 10;
  gameState.used = 0;
  gameState.allocations = [0, 0, 0];
}

function goToGameScreen() {
  const homeRoot = document.querySelector("#home-screen-root");
  const gameRoot = document.querySelector("#game-screen-root");
  const resultRoot = document.querySelector("#result-screen-root");

  if (homeRoot) homeRoot.style.display = "none";
  if (gameRoot) gameRoot.style.display = "block";
  if (resultRoot) resultRoot.style.display = "none";
}

function openRulesModal() {
  const rulesModal = document.getElementById("rulesModal");
  if (!rulesModal) return;

  rulesModal.hidden = false;
  rulesModal.setAttribute("aria-hidden", "false");
}

function closeRulesModal() {
  const rulesModal = document.getElementById("rulesModal");
  if (!rulesModal) return;

  rulesModal.hidden = true;
  rulesModal.setAttribute("aria-hidden", "true");
}

function bindHomeEvents() {
  const startBtn = document.getElementById("startBtn");
  const rulesBtn = document.getElementById("rulesBtn");
  const closeRulesBtn = document.getElementById("closeRulesBtn");
  const rulesModal = document.getElementById("rulesModal");
  const backdrop = document.querySelector(".rules-modal__backdrop");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      // 1. 重設狀態
      resetGameState();

      // 2. 切到遊戲頁
      goToGameScreen();

      // 3. 重新 render 第一回合
      renderInfoView();
    });
  }

  if (rulesBtn) {
    rulesBtn.addEventListener("click", openRulesModal);
  }

  if (closeRulesBtn) {
    closeRulesBtn.addEventListener("click", closeRulesModal);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeRulesModal);
  }

  document.addEventListener("keydown", (event) => {
    const isModalOpen = rulesModal && !rulesModal.hidden;
    if (event.key === "Escape" && isModalOpen) {
      closeRulesModal();
    }
  });
}

export function renderHomeView() {
  const root = document.querySelector("#home-screen-root");

  if (!root) return;

  root.innerHTML = homeMarkup;
  bindHomeEvents();
}