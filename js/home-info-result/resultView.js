import { renderInfoView, gameState } from "./infoView.js";
import { state } from "../shared/stateStore.js";

function getGrade(score) {
  if (score >= 20) return "A";
  if (score >= 15) return "B";
  return "C";
}

function getComment(score) {
  if (score >= 20) return "資源調度成效良好";
  if (score >= 15) return "整體校務支持大致穩定";
  return "資源配置仍有改善空間";
}

function getRoundScores() {
  const history = Array.isArray(state.allocationHistory) ? state.allocationHistory : [];

  return [0, 1, 2].map((index) => {
    const item = history[index];
    if (!item) return "-";

    if (typeof item.roundScore === "number") return item.roundScore;
    if (typeof item.score === "number") return item.score;
    if (typeof item.pointsEarned === "number") return item.pointsEarned;

    return "-";
  });
}

function getFinalScore() {
  if (typeof state.totalScore === "number") {
    return state.totalScore;
  }
  return 0;
}

function formatRoundScore(score) {
  if (score === "-") return "-";
  return score > 0 ? `+${score}` : `${score}`;
}

function createResultMarkup() {
  const roundScores = getRoundScores();
  const finalScore = getFinalScore();
  const grade = getGrade(finalScore);
  const comment = getComment(finalScore);

  return `
    <section class="screen result-screen" aria-labelledby="result-title">
      <div class="result-card">
        <h2 id="result-title" class="result-card__title">Final Score</h2>

        <div class="result-card__content">
          <h3 class="result-card__subtitle">Calculate :</h3>

          <div class="result-card__rounds">
            <p>Round 1 : ${formatRoundScore(roundScores[0])}</p>
            <p>Round 2 : ${formatRoundScore(roundScores[1])}</p>
            <p>Round 3 : ${formatRoundScore(roundScores[2])}</p>
          </div>

          <p class="result-card__total">Total : ${finalScore}</p>
          <p class="result-card__comment">${comment}</p>

          <div class="result-card__bottom">
            <div class="result-card__grade">${grade}</div>

            <div class="result-card__actions">
              <button
                id="homeBtn"
                class="action-button action-button--primary"
                type="button"
              >
                HOME
              </button>

              <button
                id="restartBtn"
                class="action-button action-button--primary"
                type="button"
              >
                RESTART
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function resetSharedState() {
  state.currentScreen = "home";
  state.currentRound = 1;
  state.totalScore = 10;
  state.resources = 3;
  state.currentSchools = [];
  state.currentEvent = null;
  state.currentAllocation = [0, 0, 0];
  state.roundScore = 0;
  state.allocationHistory = [];
  state.hintText = "";
  state.allocationStatus = {
    allocated: 0,
    remaining: 3,
    isComplete: false,
    percentUsed: 0,
    status: "提示：請先分配 3 點資源。"
  };
}

function resetLocalGameState() {
  gameState.round = 1;
  gameState.points = 10;
  gameState.used = 0;
  gameState.allocations = [0, 0, 0];
  gameState.currentSchools = [];
  gameState.activeCardIndex = 0;
}

function resetAllState() {
  resetSharedState();
  resetLocalGameState();
}

function bindResultEvents() {
  const homeBtn = document.getElementById("homeBtn");
  const restartBtn = document.getElementById("restartBtn");

  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      resetAllState();

      const homeRoot = document.querySelector("#home-screen-root");
      const gameRoot = document.querySelector("#game-screen-root");
      const resultRoot = document.querySelector("#result-screen-root");

      if (homeRoot) homeRoot.style.display = "block";
      if (gameRoot) gameRoot.style.display = "none";
      if (resultRoot) resultRoot.style.display = "none";
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      resetAllState();

      const homeRoot = document.querySelector("#home-screen-root");
      const gameRoot = document.querySelector("#game-screen-root");
      const resultRoot = document.querySelector("#result-screen-root");

      if (homeRoot) homeRoot.style.display = "none";
      if (gameRoot) gameRoot.style.display = "block";
      if (resultRoot) resultRoot.style.display = "none";

      renderInfoView();
    });
  }
}

export function renderResultView() {
  const root = document.querySelector("#result-screen-root");

  if (!root) return;

  root.innerHTML = createResultMarkup();
  bindResultEvents();
}

document.addEventListener("game:go-result", () => {
  const homeRoot = document.querySelector("#home-screen-root");
  const gameRoot = document.querySelector("#game-screen-root");
  const resultRoot = document.querySelector("#result-screen-root");

  if (homeRoot) homeRoot.style.display = "none";
  if (gameRoot) gameRoot.style.display = "none";
  if (resultRoot) resultRoot.style.display = "block";

  renderResultView();
});