// js/shared/stateStore.js
export const state = {
  currentScreen: 'home', // 目前顯示的頁面：home, game, result
  currentRound: 1,       // 目前回合數 [cite: 213, 329]
  totalScore: 10,        // 起始總分為 10 分 [cite: 31, 525]
  resources: 3,          // 每回合固定 3 點資源 [cite: 26, 585]
  // 這裡預留給 D 與 C 存放資料
  currentSchools: [],
  currentEvent: null
};