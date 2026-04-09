// js/page-and-round-flow/pageFlow.js
/**
 * 根據 screenId 顯示對應的畫面容器 [cite: 328]
 * @param {string} screenId - 可選值: 'home', 'game', 'result'
 */
export function renderPage(screenId) {
  const screens = {
    home: 'home-screen-root',
    game: 'game-screen-root',
    result: 'result-screen-root'
  };

  // 1. 隱藏所有頁面
  Object.values(screens).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // 2. 顯示目標頁面
  const targetId = screens[screenId];
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    targetElement.style.display = 'block';
  }
}