import { eventData } from "../../data-source/export/eventData.js";
import { schoolData } from "../../data-source/export/schoolData.js";
import {
  addPoint,
  getAllocationInfo,
  removePoint,
  resetAllocation
} from "../resource-and-score/resourceAction.js";
import { canFinishRound } from "../resource-and-score/ruleCheck.js";
import { calculateRoundScore, updateTotalScore } from "../resource-and-score/scoreRule.js";
import { state } from "../shared/stateStore.js";

export const gameState = {
  round: 1,
  totalRounds: 3,
  points: 10,
  used: 0,
  maxResource: 3,
  allocations: [0, 0, 0],
  eventTitle: "交通不便加劇",
  eventDescription: "特偏或極偏學校若未獲資源，本回合 -2 分。",
  currentEvent: null,
  usedEventIds: [],
  eventModalShownRound: null,
  isGameActive: false,
  currentSchools: [],
  activeCardIndex: 0,
};

const REMOTE_AREA_LEVELS = ["偏遠", "特偏", "極偏"];
const HIGH_REMOTE_AREA_LEVELS = ["特偏", "極偏"];

function getHintText(viewState) {
  const allocationInfo = getAllocationInfo(viewState.allocations);

  if (allocationInfo.allocated === 0) {
    return "提示：請先分配 3 點資源。";
  }

  if (!allocationInfo.isComplete) {
    return `提示：尚有 ${allocationInfo.remaining} 點資源未分配完成。`;
  }

  return "提示：資源已分配完成，可按 FINISH。";
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
  const eventCard = getCurrentEventCard();
  const selectedSchools = [];
  const requiredPredicates = getRequiredSchoolPredicates(eventCard);

  addSchoolMatchingAllPredicates(data, selectedSchools, requiredPredicates);

  requiredPredicates.forEach(predicate => {
    if (selectedSchools.some(predicate.test)) return;

    const candidates = data.filter(school => {
      return !selectedSchools.includes(school) && predicate.test(school);
    });

    if (candidates.length === 0) {
      console.warn(`找不到符合條件的學校卡：${predicate.label}`);
      return;
    }

    selectedSchools.push(getRandomItem(candidates));
  });

  const remainingSchools = shuffle(data.filter(school => {
    return !selectedSchools.includes(school);
  }));

  return [...selectedSchools, ...remainingSchools].slice(0, count);
}

function getRandomItem(items) {
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function addSchoolMatchingAllPredicates(data, selectedSchools, requiredPredicates) {
  if (requiredPredicates.length <= 1) return;

  const candidates = data.filter(school => {
    return requiredPredicates.every(predicate => predicate.test(school));
  });

  if (candidates.length > 0) {
    selectedSchools.push(getRandomItem(candidates));
  }
}

function getRequiredSchoolPredicates(eventCard) {
  const predicates = [
    {
      label: "偏遠、特偏或極偏學校",
      test: school => REMOTE_AREA_LEVELS.includes(school.remote_area_level),
    }
  ];

  if (eventCard?.title === "交通不便加劇") {
    predicates.push({
      label: "特偏或極偏學校",
      test: school => HIGH_REMOTE_AREA_LEVELS.includes(school.remote_area_level),
    });
  }

  if (eventCard?.title === "教師流動增加") {
    predicates.push({
      label: "學生規模變動率低於整體中位的學校",
      test: school => school.is_below_median === true,
    });
  }

  if (eventCard?.title === "地方社區支持活動") {
    predicates.push({
      label: "變動率為負值的學校",
      test: school => Number.parseFloat(school.change_rate) < 0,
    });
  }

  return predicates;
}

function getRandomEvent(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      title: gameState.eventTitle,
      description: gameState.eventDescription,
    };
  }

  const availableEvents = data.filter(eventCard => {
    return !gameState.usedEventIds.includes(eventCard.id);
  });
  const eventPool = availableEvents.length > 0 ? availableEvents : data;
  const randomIndex = Math.floor(Math.random() * eventPool.length);
  return eventPool[randomIndex];
}

function setCurrentEvent(eventCard) {
  gameState.currentEvent = eventCard;
  gameState.eventTitle = eventCard.title;
  gameState.eventDescription = eventCard.description;

  if (eventCard.id && !gameState.usedEventIds.includes(eventCard.id)) {
    gameState.usedEventIds = [...gameState.usedEventIds, eventCard.id];
  }
}

function syncPointsFromSharedState() {
  if (typeof state.totalScore !== "number") {
    state.totalScore = 10;
  }
  gameState.points = state.totalScore;
}

function syncSharedStateForRound() {
  state.currentRound = gameState.round;
  state.currentSchools = [...gameState.currentSchools];
  state.currentAllocation = [...gameState.allocations];
  state.currentEvent = getCurrentEventCard();
}

function ensureCurrentSchools() {
  if (!gameState.currentEvent) {
    setCurrentEvent(getRandomEvent(eventData));
  }
  if (!Array.isArray(gameState.currentSchools) || gameState.currentSchools.length !== 3) {
    gameState.currentSchools = getRandomSchools(schoolData, 3);
  }
  syncSharedStateForRound();
}

function resetCurrentSchoolsForNextRound() {
  setCurrentEvent(getRandomEvent(eventData));
  gameState.currentSchools = getRandomSchools(schoolData, 3);
  gameState.activeCardIndex = 0;
  syncSharedStateForRound();
}

function getCurrentEventCard() {
  return gameState.currentEvent || {
    title: gameState.eventTitle,
    description: gameState.eventDescription,
  };
}

function createSchoolCardMarkup(school, index) {
  return `
    <article class="school-card" data-card-index="${index}">
      <header class="school-card__header">${school.school_name}</header>
      <div class="school-card__body">
        <p>地區：${school.region}</p>
        <p>偏遠級別：${school.remote_area_level}</p>
        <p>規模變動分類：${school.change_category}</p>
        <p>規模變動率 / 中位數：
        <br/>
        ${formatRate(school.change_rate)} / -2%
        </p>
      </div>
    </article>
  `;
}

function createDesktopResourceCounter(index) {
  return `
    <div class="resource-counter">
      <button type="button" class="minus-btn" data-index="${index}" aria-label="減少資源">−</button>
      <strong>${gameState.allocations[index]}</strong>
      <button type="button" class="plus-btn" data-index="${index}" aria-label="增加資源">+</button>
    </div>
  `;
}

function createGameMarkup(viewState) {
  ensureCurrentSchools();
  syncPointsFromSharedState();

  const activeIndex = viewState.activeCardIndex;
  const activeValue = viewState.allocations[activeIndex] ?? 0;

  return `
    <section class="screen game-screen" aria-labelledby="game-title">
      <header class="game-screen__topbar">
        <h2 id="game-title">偏鄉高級中等校園資源調度戰</h2>
        <div class="round-badge">ROUND ${viewState.round}/${viewState.totalRounds}</div>
      </header>

      <div class="game-screen__statusbar">
        <div class="mobile-points-event">
          <p class="status-points">POINTS : ${viewState.points}</p>

          <button
            id="eventBtn"
            class="dropdown-button mobile-only"
            type="button"
            aria-haspopup="dialog"
          >
            <span>EVENT</span>
            <span class="dropdown-button__arrow">▼</span>
          </button>
        </div>

        <div class="status-center">
          <p class="status-used">USED: ${viewState.used} / ${viewState.maxResource}</p>
          <p class="game-hint">${getHintText(viewState)}</p>
        </div>

        <div class="desktop-event-holder desktop-only">
          <button
            id="eventBtnDesktop"
            class="dropdown-button"
            type="button"
            aria-haspopup="dialog"
          >
            <span>EVENT</span>
            <span class="dropdown-button__arrow">▼</span>
          </button>
        </div>
      </div>

      <div class="resource-strip desktop-only" aria-label="資源調整列">
        ${createDesktopResourceCounter(0)}
        ${createDesktopResourceCounter(1)}
        ${createDesktopResourceCounter(2)}
      </div>

      <div class="mobile-control-row mobile-only">
        <div class="mobile-resource-counter">
          <button
            type="button"
            class="minus-btn mobile-counter-btn"
            data-mobile="true"
            aria-label="減少目前卡片資源"
          >
            −
          </button>
          <strong id="mobileAllocationValue">${activeValue}</strong>
          <button
            type="button"
            class="plus-btn mobile-counter-btn"
            data-mobile="true"
            aria-label="增加目前卡片資源"
          >
            +
          </button>
        </div>

        <div class="mobile-side-actions">
          <button class="action-button action-button--panel reset-btn" type="button">RESET ↻</button>
          <button class="action-button action-button--panel finish-btn" type="button">FINISH →</button>
        </div>
      </div>

      <div class="game-screen__body">
        <main class="school-grid" aria-label="學校卡片區">
          ${viewState.currentSchools.map((school, index) => createSchoolCardMarkup(school, index)).join("")}
        </main>

        <aside class="side-actions desktop-only" aria-label="遊戲操作">
          <button id="resetBtn" class="action-button action-button--panel reset-btn" type="button">RESET ↻</button>
          <button id="finishBtn" class="action-button action-button--panel finish-btn" type="button">FINISH →</button>
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
          <h3 id="eventModalTitle" class="event-modal__title">${viewState.eventTitle}</h3>
          <p class="event-modal__desc">${viewState.eventDescription}</p>

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
  const allocationInfo = getAllocationInfo(gameState.allocations);
  gameState.used = allocationInfo.allocated;
  state.currentAllocation = [...gameState.allocations];
  state.allocationStatus = allocationInfo;
}

function applyAllocationResult(result) {
  if (!result.success) {
    return;
  }

  gameState.allocations = [...result.newAllocation];
  updateUsedResource();
  rerenderInfoView();
}

function rerenderInfoView() {
  const root = document.querySelector("#game-screen-root");
  if (!root) return;

  syncPointsFromSharedState();
  updateUsedResource();
  syncSharedStateForRound();

  root.innerHTML = createGameMarkup(gameState);
  bindInfoEvents();

  requestAnimationFrame(() => {
    restoreMobileCardPosition();
    syncMobileCounter();
    openRoundEventModalIfNeeded();
  });
}

function getButtonTargetIndex(button) {
  if (button.dataset.mobile === "true") {
    return gameState.activeCardIndex;
  }
  return Number(button.dataset.index);
}

function increaseResource(index) {
  applyAllocationResult(addPoint(gameState.allocations, index));
}

function decreaseResource(index) {
  applyAllocationResult(removePoint(gameState.allocations, index));
}

function resetResources() {
  applyAllocationResult(resetAllocation(gameState.allocations));
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

function openRoundEventModalIfNeeded() {
  if (!gameState.isGameActive) return;
  if (gameState.eventModalShownRound === gameState.round) return;

  const root = document.querySelector("#game-screen-root");
  if (root && root.style.display === "none") return;

  openEventModal();
  gameState.eventModalShownRound = gameState.round;
}

function goToResultScreen() {
  document.dispatchEvent(new CustomEvent("game:go-result"));
}

function handleFinish() {
  updateUsedResource();

  const eventCard = getCurrentEventCard();
  const validation = canFinishRound(
    gameState.currentSchools,
    gameState.allocations,
    eventCard
  );

  if (!validation.valid) {
    alert(validation.errors?.[0] || "目前無法完成回合。");
    return;
  }

  syncSharedStateForRound();

  const roundScore = calculateRoundScore(
    gameState.currentSchools,
    gameState.allocations,
    eventCard
  );

  state.roundScore = roundScore;
  state.allocationHistory.push({
    round: gameState.round,
    allocation: [...gameState.allocations],
    roundScore,
    eventTitle: gameState.eventTitle,
  });

  state.totalScore = updateTotalScore(state.totalScore, roundScore);
  gameState.points = state.totalScore;

  if (gameState.round < gameState.totalRounds) {
    gameState.round += 1;
    state.currentRound = gameState.round;
    const resetResult = resetAllocation(gameState.allocations);
    gameState.allocations = [...resetResult.newAllocation];
    updateUsedResource();

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

function syncMobileCounter() {
  const mobileValue = document.getElementById("mobileAllocationValue");
  if (!mobileValue) return;
  mobileValue.textContent = String(gameState.allocations[gameState.activeCardIndex] ?? 0);
}

function bindMobileCardScroll() {
  const schoolGrid = document.querySelector(".school-grid");
  if (!schoolGrid) return;

  let scrollTimer;

  schoolGrid.addEventListener("scroll", () => {
    if (window.innerWidth > 768) return;

    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const cards = schoolGrid.querySelectorAll(".school-card");
      if (!cards.length) return;

      let closestIndex = 0;
      let closestDistance = Infinity;

      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft - schoolGrid.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      gameState.activeCardIndex = closestIndex;
      syncMobileCounter();
    }, 50);
  });
}

function restoreMobileCardPosition() {
  if (window.innerWidth > 768) return;

  const schoolGrid = document.querySelector(".school-grid");
  const cards = schoolGrid?.querySelectorAll(".school-card");
  if (!schoolGrid || !cards || !cards.length) return;

  const activeCard = cards[gameState.activeCardIndex];
  if (!activeCard) return;

  schoolGrid.scrollTo({
    left: activeCard.offsetLeft,
    behavior: "auto",
  });
}

let hasBoundEscListener = false;

function bindInfoEvents() {
  const plusButtons = document.querySelectorAll(".plus-btn");
  const minusButtons = document.querySelectorAll(".minus-btn");
  const resetButtons = document.querySelectorAll(".reset-btn");
  const finishButtons = document.querySelectorAll(".finish-btn");
  const eventBtn = document.getElementById("eventBtn");
  const eventBtnDesktop = document.getElementById("eventBtnDesktop");
  const closeEventBtn = document.getElementById("closeEventBtn");
  const backdrop = document.querySelector(".event-modal__backdrop");

  plusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = getButtonTargetIndex(button);
      increaseResource(index);
    });
  });

  minusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = getButtonTargetIndex(button);
      decreaseResource(index);
    });
  });

  resetButtons.forEach((button) => {
    button.addEventListener("click", resetResources);
  });

  finishButtons.forEach((button) => {
    button.addEventListener("click", handleFinish);
  });

  if (eventBtn) {
    eventBtn.addEventListener("click", openEventModal);
  }

  if (eventBtnDesktop) {
    eventBtnDesktop.addEventListener("click", openEventModal);
  }

  if (closeEventBtn) {
    closeEventBtn.addEventListener("click", closeEventModal);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeEventModal);
  }

  bindMobileCardScroll();

  if (!hasBoundEscListener) {
    document.addEventListener("keydown", handleEscClose);
    hasBoundEscListener = true;
  }
}

export function renderInfoView() {
  ensureCurrentSchools();
  syncPointsFromSharedState();
  syncSharedStateForRound();
  rerenderInfoView();
}
