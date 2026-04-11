// js/app-init.js
import { renderPage } from './page-and-round-flow/pageFlow.js';
import { handleRoundTransition } from './page-and-round-flow/roundFlow.js'; // 引入 A 的主責邏輯 
import { state } from './shared/stateStore.js';
import { renderHomeView } from './home-info-result/homeView.js';
import { initRwdHint } from "./home-info-result/rwdHint.js";
import { renderInfoView } from './home-info-result/infoView.js';
import { renderResultView } from './home-info-result/resultView.js';

function init() {
  console.log("全流程串接系統啟動中...");
  
  // 初始化渲染所有畫面 [cite: 211]
  renderHomeView();
  initRwdHint();
  renderInfoView();
  renderResultView();

  // 初始顯示首頁 [cite: 212]
  renderPage(state.currentScreen); 

  setupEventListeners();
}

function setupEventListeners() {
  // 從首頁進入遊戲 [cite: 46]
  document.addEventListener("game:start", () => {
    state.currentScreen = 'game';
    renderPage('game');
  });

  // 處理回合結束 - 這裡是關鍵：呼叫專業的 roundFlow 處理 [cite: 213]
  document.addEventListener("game:finish-round", (e) => {
    handleRoundTransition(e.detail);
  });

  // 其他 UI 切換 (go-home / restart)
  document.addEventListener("game:go-home", () => {
    location.reload(); 
  });

  document.addEventListener("game:restart", () => {
    state.currentRound = 1;
    state.totalScore = 10;
    renderPage('game');
  });
}

document.addEventListener("DOMContentLoaded", init);