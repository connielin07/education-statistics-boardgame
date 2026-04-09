const resultState = {
  roundScores: [7, 10, 5],
  finalScore: 22,
};

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

function createResultMarkup(state) {
  const grade = getGrade(state.finalScore);
  const comment = getComment(state.finalScore);

  return `
    <section class="screen result-screen" aria-labelledby="result-title">
      <div class="result-card">
        <h2 id="result-title" class="result-card__title">Final Score</h2>

        <div class="result-card__content">
          <h3 class="result-card__subtitle">Calculate :</h3>

          <div class="result-card__rounds">
            <p>Round 1 : +${state.roundScores[0]}</p>
            <p>Round 2 : +${state.roundScores[1]}</p>
            <p>Round 3 : +${state.roundScores[2]}</p>
          </div>

          <p class="result-card__total">Total : ${state.finalScore}</p>
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

function bindResultEvents() {
  const homeBtn = document.getElementById("homeBtn");
  const restartBtn = document.getElementById("restartBtn");

  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("game:go-home"));
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("game:restart"));
    });
  }
}

export function renderResultView(customState = resultState) {
  const root = document.querySelector("#result-screen-root");

  if (!root) return;

  root.innerHTML = createResultMarkup(customState);
  bindResultEvents();
}