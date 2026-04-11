import { schoolData } from "../../data-source/export/schoolData.js";

export const gameState = {
  round: 1,
  totalRounds: 3,
  points: 10,
  used: 0,
  maxResource: 3,
  allocations: [0, 0, 0],
  eventTitle: "交通不便加劇",
  eventDescription: "特偏或極偏學校若未獲資源，本回合 -2 分。",
  currentSchools: [],
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

function formatRate(rate) {
  const numericRate = Number(rate);
  if (Number.isNaN(numericRate)) return rate;
  return `${(numericRate * 100).toFixed(1)}%`;
}

function formatMedianText(isBelow) {
  return isBelow ? "低於整體中位" : "高於或等於整體中位";
}

function getRandomSchools(data, count = 3) {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function ensureCurrentSchools() {
  if (!Array.isArray(gameState.currentSchools) || gameState.currentSchools.length !== 3) {
    gameState.currentSchools = getRandomSchools(schoolData, 3);
  }
}

function resetCurrentSchoolsForNextRound() {
  gameState.currentSchools = getRandomSchools(schoolData, 3);
}

function createSchoolCardMarkup(school) {
  return `
    <article class="school-card">
      <header class="school-card__header">${school.school_name}</header>
      <div class="school-card__body">
        <p>地區：${school.region}</p>
        <p>偏遠級別：${school.remote_area_level}</p>
        <p>111學年學生數：${school.count_111}</p>
        <p>113學年學生數：${school.count_113}</p>
        <p>學生規模變動率：${formatRate(school.change_rate)}</p>
        <p>分類結果：${school.change_category}</p>
        <p>中位比較：${formatMedianText(school.is_below_median)}</p>
      </div>
    </article>
  `;
}

function createGameMarkup(state) {
  ensureCurrentSchools();

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
          ${state.currentSchools.map(createSchoolCardMarkup).join("")}
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
  document.dispatchEvent(new CustomEvent("game:go-result"));
}

function handleFinish() {
  updateUsedResource();

  if (gameState.used !== gameState.maxResource) {
    alert("請先剛好分配完 3 點資源。");
    return;
  }

  if (gameState.round < gameState.totalRounds) {
    gameState.round += 1;
    gameState.allocations = [0, 0, 0];
    gameState.used = 0;
    resetCurrentSchoolsForNextRound();
    rerenderInfoView();
    return;
  }

  goToResultScreen();
}

function handleEscClose(event) {
  if (event.key === "Escape") {
    closeEventModal();
  }
}

let hasBoundEscListener = false;

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

  if (!hasBoundEscListener) {
    document.addEventListener("keydown", handleEscClose);
    hasBoundEscListener = true;
  }
}

export function renderInfoView() {
  ensureCurrentSchools();
  rerenderInfoView();
}