// js/shared/stateStore.js
export const state = {
  // ========== A 管理：頁面與回合流程 ==========
  currentScreen: 'home', // 目前顯示的頁面：home, game, result
  currentRound: 1,       // 目前回合數 [cite: 213, 329]
  totalScore: 10,        // 起始總分為 10 分 [cite: 31, 525]
  resources: 3,          // 每回合固定 3 點資源 [cite: 26, 585]

  // ========== D 管理：卡片資料 ==========
  currentSchools: [],    // 本回合的 3 所學校資料
  currentEvent: null,    // 本回合的事件卡

  // ========== C 管理：分配與計分 ==========
  currentAllocation: [0, 0, 0],  // 目前資源分配 [點數1, 點數2, 點數3]
  roundScore: 0,                 // 本回合得分
  allocationHistory: [],         // 分配操作歷史（用於撤銷功能）

  // ========== B 管理：提示與顯示 ==========
  hintText: "",                  // 目前提示文字
  allocationStatus: {            // 分配狀態資訊
    allocated: 0,
    remaining: 3,
    isComplete: false,
    percentUsed: 0,
    status: "提示：請先分配 3 點資源。"
  }
};