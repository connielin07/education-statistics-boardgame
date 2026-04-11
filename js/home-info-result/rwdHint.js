export function initRwdHint() {
  const hint = document.querySelector("#rwdHint");
  if (!hint) return;

  function updateRwdHint() {
    const isSmallScreen = window.innerWidth <= 768;
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isSmallScreen && isLandscape) {
      hint.hidden = false;
      hint.setAttribute("aria-hidden", "false");
    } else {
      hint.hidden = true;
      hint.setAttribute("aria-hidden", "true");
    }
  }

  updateRwdHint();

  window.addEventListener("resize", updateRwdHint);
  window.addEventListener("orientationchange", updateRwdHint);
}