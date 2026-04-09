// js/page-and-round-flow/roundFlow.js
import { state } from '../shared/stateStore.js';
import { renderPage } from './pageFlow.js';
import { renderInfoView } from '../home-info-result/infoView.js';

export function handleRoundTransition(data) {
  if (state.currentRound < 3) {
    state.currentRound++; 
    console.log(`目前回合推進至: ${state.currentRound}`);

    // 發出一個自定義事件，通知「該歸零點數了」
    document.dispatchEvent(new CustomEvent("game:reset-resource"));

    // 更新回合數字並渲染
    renderInfoView(); 
    renderPage('game'); 
  } else {
    console.log("三回合結束，跳轉結果頁");
    renderPage('result');
  }
}