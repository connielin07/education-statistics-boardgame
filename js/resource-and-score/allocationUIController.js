/**
 * allocationUIController.js - 資源分配區 UI 控制層
 * 
 * 職責：
 * 1. 綁定分配按鈕的事件監聽
 * 2. 實時更新 DOM 的點數顯示
 * 3. 管理分配區的狀態反饋
 * 4. 與其他模組通信（事件派發）
 * 
 * 使用流程：
 * 1. 在 app-init.js 中導入此模組
 * 2. 呼叫 initAllocationUI(schools, eventCard)
 * 3. 監聽 'allocation-finished' 和 'allocation-updated' 事件
 */

import {
  addPoint,
  removePoint,
  resetAllocation,
  getAllocationInfo
} from './resourceAction.js';

import {
  canFinishRound,
  isAllocationComplete
} from './ruleCheck.js';

import {
  calculateRoundScore
} from './scoreRule.js';

// ============================================================
// DOM 元素參考
// ============================================================

const allocationDomRefs = {
  // 按鈕
  minusBtns: null,
  plusBtns: null,
  resetBtn: null,
  finishBtn: null,

  // 顯示區域
  schoolNames: [],
  schoolPoints: [],
  schoolHints: [],
  remainingPoints: null,
  usedPoints: null,
  allocationStatus: null,
  eventDisplay: null
};

// 當前分配狀態
let currentAllocation = [0, 0, 0];
let currentSchools = null;
let currentEventCard = null;

// ============================================================
// DOM 初始化
// ============================================================

/**
 * 初始化 DOM 元素參考
 * 
 * @returns {boolean} 初始化是否成功
 */
function initializeDOMRefs() {
  try {
    // 按鈕
    allocationDomRefs.minusBtns = document.querySelectorAll('.allocation-btn--minus');
    allocationDomRefs.plusBtns = document.querySelectorAll('.allocation-btn--plus');
    allocationDomRefs.resetBtn = document.getElementById('reset-btn');
    allocationDomRefs.finishBtn = document.getElementById('finish-btn');

    // 顯示區域
    allocationDomRefs.schoolNames = [
      document.getElementById('school-name-0'),
      document.getElementById('school-name-1'),
      document.getElementById('school-name-2')
    ];
    allocationDomRefs.schoolPoints = [
      document.getElementById('school-points-0'),
      document.getElementById('school-points-1'),
      document.getElementById('school-points-2')
    ];
    allocationDomRefs.schoolHints = [
      document.getElementById('school-hint-0'),
      document.getElementById('school-hint-1'),
      document.getElementById('school-hint-2')
    ];
    allocationDomRefs.remainingPoints = document.getElementById('remaining-points');
    allocationDomRefs.usedPoints = document.getElementById('used-points');
    allocationDomRefs.allocationStatus = document.getElementById('allocation-status');
    allocationDomRefs.eventDisplay = document.getElementById('event-display');

    // 檢查是否所有必要元素都存在
    const requiredElements = [
      allocationDomRefs.resetBtn,
      allocationDomRefs.finishBtn,
      allocationDomRefs.remainingPoints,
      allocationDomRefs.usedPoints,
      allocationDomRefs.allocationStatus
    ];

    const allExist = requiredElements.every(el => el !== null);
    
    if (!allExist) {
      console.warn("⚠️ 部分 DOM 元素未找到，某些功能可能無法正常運作");
    }

    return true;
  } catch (e) {
    console.error("❌ DOM 初始化失敗:", e.message);
    return false;
  }
}

// ============================================================
// 事件監聽綁定
// ============================================================

/**
 * 綁定所有事件監聽器
 */
function setupEventListeners() {
  // ========== 加點按鈕 ==========
  allocationDomRefs.plusBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => handlePlusClick(idx));
  });

  // ========== 減點按鈕 ==========
  allocationDomRefs.minusBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => handleMinusClick(idx));
  });

  // ========== RESET 按鈕 ==========
  if (allocationDomRefs.resetBtn) {
    allocationDomRefs.resetBtn.addEventListener('click', handleResetClick);
  }

  // ========== FINISH 按鈕 ==========
  if (allocationDomRefs.finishBtn) {
    allocationDomRefs.finishBtn.addEventListener('click', handleFinishClick);
  }
}

// ============================================================
// 事件處理函數
// ============================================================

/**
 * 處理加點按鈕點擊
 * @param {number} schoolIndex - 學校索引
 */
function handlePlusClick(schoolIndex) {
  const result = addPoint(currentAllocation, schoolIndex);
  
  if (result.success) {
    currentAllocation = result.newAllocation;
    updateAllocationUI();
    dispatchAllocationUpdatedEvent();
  } else {
    showHint(schoolIndex, result.error);
  }
}

/**
 * 處理減點按鈕點擊
 * @param {number} schoolIndex - 學校索引
 */
function handleMinusClick(schoolIndex) {
  const result = removePoint(currentAllocation, schoolIndex);
  
  if (result.success) {
    currentAllocation = result.newAllocation;
    updateAllocationUI();
    dispatchAllocationUpdatedEvent();
  } else {
    showHint(schoolIndex, result.error);
  }
}

/**
 * 處理 RESET 按鈕點擊
 */
function handleResetClick() {
  currentAllocation = resetAllocation(currentAllocation);
  updateAllocationUI();
  dispatchAllocationUpdatedEvent();
}

/**
 * 處理 FINISH 按鈕點擊
 */
function handleFinishClick() {
  const validation = canFinishRound(currentSchools, currentAllocation, currentEventCard);
  
  if (validation.valid) {
    // 計算本回合分數
    const roundScore = calculateRoundScore(
      currentSchools,
      currentAllocation,
      currentEventCard
    );
    
    // 派發完成事件給流程控制模組（A）
    window.dispatchEvent(new CustomEvent('allocation-finished', {
      detail: {
        allocation: currentAllocation,
        roundScore: roundScore
      }
    }));
    
    // 禁用所有按鈕（等待下一回合）
    disableAllocationButtons();
  } else {
    // 顯示錯誤提示
    if (allocationDomRefs.allocationStatus) {
      allocationDomRefs.allocationStatus.textContent = validation.errors?.[0] || "無法完成分配";
      allocationDomRefs.allocationStatus.classList.add('allocation-status--warning');
    }
  }
}

// ============================================================
// UI 更新函數
// ============================================================

/**
 * 更新分配區的所有 UI 顯示
 */
function updateAllocationUI() {
  const info = getAllocationInfo(currentAllocation);

  // 1. 更新各校的點數顯示
  currentAllocation.forEach((points, idx) => {
    if (allocationDomRefs.schoolPoints[idx]) {
      allocationDomRefs.schoolPoints[idx].textContent = points;
    }
  });

  // 2. 更新剩餘點數和已用點數
  if (allocationDomRefs.remainingPoints) {
    allocationDomRefs.remainingPoints.textContent = info.remaining;
  }
  if (allocationDomRefs.usedPoints) {
    allocationDomRefs.usedPoints.textContent = `${info.allocated} / 3`;
  }

  // 3. 更新狀態提示和按鈕狀態
  updateStatusDisplay(info);

  // 4. 更新按鈕的啟用/禁用狀態
  updateButtonStates();
}

/**
 * 更新狀態提示區域
 * @param {object} info - 分配資訊
 */
function updateStatusDisplay(info) {
  if (!allocationDomRefs.allocationStatus) return;

  if (info.isComplete) {
    allocationDomRefs.allocationStatus.textContent = '✓ 分配完成，可點擊 FINISH';
    allocationDomRefs.allocationStatus.classList.remove('allocation-status--incomplete');
    allocationDomRefs.allocationStatus.classList.add('allocation-status--complete');
    if (allocationDomRefs.finishBtn) {
      allocationDomRefs.finishBtn.disabled = false;
    }
  } else {
    allocationDomRefs.allocationStatus.textContent = `請再分配 ${info.remaining} 點資源`;
    allocationDomRefs.allocationStatus.classList.add('allocation-status--incomplete');
    allocationDomRefs.allocationStatus.classList.remove('allocation-status--complete');
    if (allocationDomRefs.finishBtn) {
      allocationDomRefs.finishBtn.disabled = true;
    }
  }
}

/**
 * 更新按鈕的啟用/禁用狀態
 */
function updateButtonStates() {
  allocationDomRefs.plusBtns.forEach((btn, idx) => {
    const remaining = 3 - currentAllocation.reduce((a, b) => a + b, 0);
    btn.disabled = remaining <= 0;
  });

  allocationDomRefs.minusBtns.forEach((btn, idx) => {
    btn.disabled = currentAllocation[idx] <= 0;
  });
}

/**
 * 顯示單點提示文字
 * @param {number} schoolIndex - 學校索引
 * @param {string} message - 提示信息
 */
function showHint(schoolIndex, message) {
  if (allocationDomRefs.schoolHints[schoolIndex]) {
    allocationDomRefs.schoolHints[schoolIndex].textContent = message;
    allocationDomRefs.schoolHints[schoolIndex].classList.add('allocation-hint--warning');
    
    // 3 秒後清除提示
    setTimeout(() => {
      allocationDomRefs.schoolHints[schoolIndex].textContent = '';
      allocationDomRefs.schoolHints[schoolIndex].classList.remove('allocation-hint--warning');
    }, 3000);
  }
}

/**
 * 禁用所有分配按鈕
 */
function disableAllocationButtons() {
  allocationDomRefs.plusBtns.forEach(btn => btn.disabled = true);
  allocationDomRefs.minusBtns.forEach(btn => btn.disabled = true);
  allocationDomRefs.resetBtn.disabled = true;
  allocationDomRefs.finishBtn.disabled = true;
}

/**
 * 啟用所有分配按鈕（重啟新回合）
 */
function enableAllocationButtons() {
  currentAllocation = [0, 0, 0];
  updateAllocationUI();
}

// ============================================================
// 事件派發
// ============================================================

/**
 * 派發「分配更新」事件給 B（提示文字）
 */
function dispatchAllocationUpdatedEvent() {
  const info = getAllocationInfo(currentAllocation);
  
  window.dispatchEvent(new CustomEvent('allocation-updated', {
    detail: {
      remaining: info.remaining,
      allocated: info.allocated,
      isComplete: info.isComplete,
      allocation: currentAllocation
    }
  }));
}

// ============================================================
// 公開介面
// ============================================================

/**
 * 初始化分配 UI 控制器
 * 
 * 這是主要的初始化函數，應在 app-init.js 中呼叫
 * 
 * @param {array} schools - 三張學校資料
 * @param {object} eventCard - 事件卡資料
 * @returns {boolean} 初始化是否成功
 * 
 * @example
 * import { initAllocationUI } from './resource-and-score/allocationUIController.js';
 * 
 * const schools = /* 從 D 的 drawCard.js 取得 */;
 * const eventCard = /* 從 D 的 drawCard.js 取得 */;
 * 
 * initAllocationUI(schools, eventCard);
 */
export function initAllocationUI(schools, eventCard) {
  try {
    currentSchools = schools;
    currentEventCard = eventCard;
    currentAllocation = [0, 0, 0];

    // 1. 初始化 DOM 參考
    if (!initializeDOMRefs()) {
      console.error("❌ DOM 初始化失敗");
      return false;
    }

    // 2. 綁定事件監聽
    setupEventListeners();

    // 3. 初始化 UI 顯示
    updateAllocationUI();

    // 4. 顯示事件卡信息
    if (allocationDomRefs.eventDisplay && eventCard) {
      allocationDomRefs.eventDisplay.textContent = eventCard.title || '點擊展開';
    }

    // 5. 顯示學校名稱
    schools.forEach((school, idx) => {
      if (allocationDomRefs.schoolNames[idx]) {
        allocationDomRefs.schoolNames[idx].textContent = school.school_name || `學校 ${idx + 1}`;
      }
    });

    console.log("✅ 分配 UI 控制器初始化成功");
    return true;
  } catch (e) {
    console.error("❌ 分配 UI 初始化失敗:", e.message);
    return false;
  }
}

/**
 * 取得當前分配狀態
 * @returns {array} 當前分配陣列
 */
export function getCurrentAllocation() {
  return [...currentAllocation];
}

/**
 * 重啟新回合（清空分配）
 */
export function resetForNewRound() {
  currentAllocation = [0, 0, 0];
  updateAllocationUI();
  enableAllocationButtons();
}

/**
 * 監聽整個分配流程的完成
 * 
 * 事件詳情：
 * - allocation: [點數1, 點數2, 點數3]
 * - roundScore: 本回合得分
 * 
 * @example
 * window.addEventListener('allocation-finished', (event) => {
 *   const { allocation, roundScore } = event.detail;
 *   console.log("分配完成:", allocation, "得分:", roundScore);
 * });
 */
export const AllocationEvents = {
  FINISHED: 'allocation-finished',   // 分配完成，要進入下一回合或結束遊戲
  UPDATED: 'allocation-updated'      // 分配有更新，提示文字需要同步
};

// ============================================================
// 邊界情況處理
// ============================================================

/**
 * 處理快速連點（防抖）
 * 
 * 原理：按鈕被點擊後禁用 300ms，防止快速多次觸發
 */
function debounceButtons() {
  const allButtons = [
    ...allocationDomRefs.plusBtns,
    ...allocationDomRefs.minusBtns,
    allocationDomRefs.resetBtn,
    allocationDomRefs.finishBtn
  ].filter(btn => btn !== null);

  allButtons.forEach(btn => {
    const originalDisabled = btn.disabled;
    
    btn.addEventListener('click', () => {
      btn.disabled = true;
      setTimeout(() => {
        btn.disabled = originalDisabled;
      }, 100);
    });
  });
}

/**
 * 初始化防抖機制
 */
export function enableDebounce() {
  debounceButtons();
}

// ============================================================
// 調試工具
// ============================================================

/**
 * 調試：打印當前分配狀態
 */
export function debugAllocation() {
  console.log("=== 分配狀態調試 ===");
  console.log("當前分配:", currentAllocation);
  console.log("分配資訊:", getAllocationInfo(currentAllocation));
  console.log("當前學校:", currentSchools);
  console.log("當前事件卡:", currentEventCard);
  
  if (currentSchools && currentEventCard) {
    const roundScore = calculateRoundScore(
      currentSchools,
      currentAllocation,
      currentEventCard
    );
    console.log("本回合分數:", roundScore);
  }
}

/**
 * 調試：打印所有 DOM 參考
 */
export function debugDOMRefs() {
  console.log("=== DOM 參考調試 ===");
  console.log("allocationDomRefs:", allocationDomRefs);
}
