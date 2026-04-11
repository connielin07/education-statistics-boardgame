export function initRwdHint() {
  const hint = document.querySelector("#rwdHint");
  if (!hint) return;

  function updateRwdHint() {
    const isSmallScreen = window.innerWidth <= 900;
    const isPortrait = window.innerHeight > window.innerWidth;

    if (isSmallScreen && isPortrait) {
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