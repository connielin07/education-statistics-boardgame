const resultMarkup = `
  <section class="result-screen" aria-labelledby="result-title">
    <div class="result-card">
      <header class="result-card__header">
        <h2 id="result-title">Final Score</h2>
      </header>

      <div class="result-card__body">
        <section class="result-summary" aria-labelledby="result-calculate-title">
          <h3 id="result-calculate-title">Calculate :</h3>
          <div class="result-rounds">
            <p>Round 1 : +7</p>
            <p>Round 2 : +10</p>
            <p>Round 3 : +5</p>
          </div>
          <p class="result-total">Total : 22</p>
        </section>

        <section class="result-outcome" aria-label="結果操作區">
          <div class="grade-mark" aria-label="等級">A</div>
          <div class="result-actions">
            <button class="action-button action-button--result" type="button">HOME</button>
            <button class="action-button action-button--result" type="button">RESTART</button>
          </div>
        </section>
      </div>
    </div>
  </section>
`;

export function renderResultView() {
  const root = document.querySelector("#result-screen-root");

  if (!root) {
    return;
  }

  root.innerHTML = resultMarkup;
}

renderResultView();
