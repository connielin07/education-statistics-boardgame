// js/page-and-round-flow/roundFlow.js
import { state } from '../shared/stateStore.js';
import { renderPage } from './pageFlow.js';
import { renderInfoView } from '../home-info-result/infoView.js'; // 引入渲染函數

export function handleRoundTransition(data) {
  // 任務 3：預留回合切換邏輯 [cite: 151, 199]
  if (state.currentRound < 3) {
    state.currentRound++; 
    console.log(`目前回合推進至: ${state.currentRound}`);
    
    // 關鍵：重新渲染遊戲畫面，讓畫面上 ROUND 的數字更新
    // 注意：因為現在是 Phase 1，資料還沒對接，所以學校卡內容不會變
    renderInfoView(); 
    renderPage('game'); 
  } else {
    // 任務 2：串接結果頁切換 [cite: 150, 201]
    console.log("三回合結束，跳轉結果頁");
    renderPage('result');
  }
}