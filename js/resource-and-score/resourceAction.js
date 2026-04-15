/**
 * resourceAction.js - 資源分配操作邏輯
 * 
 * 職責：
 * 1. 處理玩家的加點 / 減點操作
 * 2. 管理資源分配狀態
 * 3. 提供 UI 更新所需的資料
 * 
 * 使用場景：
 * - 玩家點按「+」按鈕時，調用 addPoint()
 * - 玩家點按「-」按鈕時，調用 removePoint()
 * - 玩家點按「RESET」時，調用 resetAllocation()
 */

import { 
  canAddAllocation, 
  getRemainingPoints, 
  isAllocationComplete,
  getAllocationStatus,
  canPerformOperation,
  getAvailableSchoolsForAllocation,
  getAllocationWarnings
} from './ruleCheck.js';

// ============================================================
// 分配操作函數
// ============================================================

/**
 * 為指定學校增加 1 點資源
 * 
 * @param {array} allocation - 目前分配 [點數1, 點數2, 點數3]
 * @param {number} schoolIndex - 學校索引 (0, 1, 2)
 * @returns {object} { 
 *   success: boolean,
 *   newAllocation?: array,
 *   error?: string
 * }
 */
export function addPoint(allocation, schoolIndex) {
  // 驗證輸入
  if (!Array.isArray(allocation) || allocation.length !== 3) {
    return {
      success: false,
      error: "分配陣列格式錯誤"
    };
  }
  
  if (schoolIndex < 0 || schoolIndex >= 3) {
    return {
      success: false,
      error: "學校索引無效"
    };
  }
  
  // 檢查是否可以增加
  if (!canAddAllocation(allocation, schoolIndex, 1)) {
    const remaining = getRemainingPoints(allocation);
    return {
      success: false,
      error: remaining === 0 
        ? "資源已全部分配完成" 
        : `無法增加：該校已滿，或總資源會超過 3 點`
    };
  }
  
  // 建立新的分配陣列
  const newAllocation = [...allocation];
  newAllocation[schoolIndex] += 1;
  
  return {
    success: true,
    newAllocation: newAllocation
  };
}

/**
 * 為指定學校減少 1 點資源
 * 
 * @param {array} allocation - 目前分配
 * @param {number} schoolIndex - 學校索引
 * @returns {object} { success: boolean, newAllocation?: array, error?: string }
 */
export function removePoint(allocation, schoolIndex) {
  // 驗證輸入
  if (!Array.isArray(allocation) || allocation.length !== 3) {
    return {
      success: false,
      error: "分配陣列格式錯誤"
    };
  }
  
  if (schoolIndex < 0 || schoolIndex >= 3) {
    return {
      success: false,
      error: "學校索引無效"
    };
  }
  
  // 檢查該校是否有可減的點數
  if (allocation[schoolIndex] <= 0) {
    return {
      success: false,
      error: "該校已無可減的資源"
    };
  }
  
  // 建立新的分配陣列
  const newAllocation = [...allocation];
  newAllocation[schoolIndex] -= 1;
  
  return {
    success: true,
    newAllocation: newAllocation
  };
}

/**
 * 直接設定特定學校的資源點數
 * 用於滑塊或直接輸入的情況
 * 
 * @param {array} allocation - 目前分配
 * @param {number} schoolIndex - 學校索引
 * @param {number} newPoints - 新的點數（0-3）
 * @returns {object} { success: boolean, newAllocation?: array, error?: string }
 */
export function setAllocationForSchool(allocation, schoolIndex, newPoints) {
  // 驗證輸入
  if (!Number.isInteger(newPoints) || newPoints < 0 || newPoints > 3) {
    return {
      success: false,
      error: `新點數必須是 0-3 之間的整數，不能是 ${newPoints}`
    };
  }
  
  if (schoolIndex < 0 || schoolIndex >= 3) {
    return {
      success: false,
      error: "學校索引無效"
    };
  }
  
  // 計算設定後的總分配
  const otherTotal = allocation.reduce((sum, points, idx) => {
    return idx !== schoolIndex ? sum + points : sum;
  }, 0);
  
  const totalAfterSet = otherTotal + newPoints;
  
  // 檢查不會超過 3 點
  if (totalAfterSet > 3) {
    return {
      success: false,
      error: `設定此學校為 ${newPoints} 點會導致總分配超過 3 點（目前其他校 ${otherTotal} 點）`
    };
  }
  
  // 建立新的分配陣列
  const newAllocation = [...allocation];
  newAllocation[schoolIndex] = newPoints;
  
  return {
    success: true,
    newAllocation: newAllocation
  };
}

/**
 * 重置所有分配為 0
 * 
 * @param {array} allocation - 目前分配
 * @returns {object} { success: boolean, newAllocation: array }
 */
export function resetAllocation(allocation) {
  return {
    success: true,
    newAllocation: [0, 0, 0]
  };
}

// ============================================================
// 分配狀態查詢
// ============================================================

/**
 * 獲取指定學校的目前分配點數
 * @param {array} allocation - 目前分配
 * @param {number} schoolIndex - 學校索引
 * @returns {number} 分配點數
 */
export function getAllocationForSchool(allocation, schoolIndex) {
  if (allocation && schoolIndex >= 0 && schoolIndex < 3) {
    return allocation[schoolIndex];
  }
  return 0;
}

/**
 * 獲取已分配的總點數
 * @param {array} allocation - 目前分配
 * @returns {number} 已分配點數
 */
export function getTotalAllocated(allocation) {
  return allocation.reduce((sum, points) => sum + points, 0);
}

/**
 * 獲取分配狀態，用於 UI 顯示
 * @param {array} allocation - 目前分配
 * @returns {object} {
 *   allocated: number,           // 已分配點數
 *   remaining: number,           // 剩餘點數
 *   isComplete: boolean,         // 是否完成分配
 *   percentUsed: number,         // 使用百分比 (0-100)
 *   status: string              // 可讀的狀態說明
 * }
 */
export function getAllocationInfo(allocation) {
  const allocated = getTotalAllocated(allocation);
  const remaining = getRemainingPoints(allocation);
  const isComplete = isAllocationComplete(allocation);
  const percentUsed = (allocated / 3) * 100;
  
  const allocationStatus = getAllocationStatus(allocation);
  
  return {
    allocated: allocated,
    remaining: remaining,
    isComplete: isComplete,
    percentUsed: Math.round(percentUsed),
    status: allocationStatus.status
  };
}

/**
 * 檢查每所學校是否已分配資源
 * @param {array} allocation - 目前分配
 * @returns {array} [boolean, boolean, boolean] 各校是否已分配
 */
export function getHasAllocationPerSchool(allocation) {
  return allocation.map(points => points > 0);
}

// ============================================================
// 操作歷史管理（可選）
// ============================================================

/**
 * 記錄操作歷史（用於「撤銷」功能）
 * @param {array} history - 歷史記錄陣列
 * @param {array} allocation - 新的分配狀態
 * @returns {array} 更新後的歷史
 */
export function recordAllocationHistory(history, allocation) {
  // 限制最多記錄 10 步操作
  const maxHistory = 10;
  const newHistory = [...history, [...allocation]];
  
  if (newHistory.length > maxHistory) {
    newHistory.shift(); // 移除最舊的紀錄
  }
  
  return newHistory;
}

/**
 * 撤銷上一步操作
 * @param {array} history - 歷史記錄
 * @returns {object} { 
 *   success: boolean, 
 *   allocation?: array,
 *   error?: string 
 * }
 */
export function undoAllocation(history) {
  if (!history || history.length === 0) {
    return {
      success: false,
      error: "沒有可撤銷的操作"
    };
  }
  
  const previousAllocation = history[history.length - 1];
  
  return {
    success: true,
    allocation: previousAllocation
  };
}

// ============================================================
// 假資料與測試情境
// ============================================================

/**
 * 初始分配（三個學校各 0 點）
 */
export const INITIAL_ALLOCATION = [0, 0, 0];

/**
 * 常見的分配方案（用於快速測試）
 */
export const COMMON_ALLOCATIONS = {
  EQUAL: [1, 1, 1],           // 均勻分配
  PRIORITY_FIRST: [2, 1, 0],  // 優先第一校
  PRIORITY_SECOND: [1, 2, 0], // 優先第二校
  EMERGENCY: [3, 0, 0],       // 全力救援第一校
  BALANCED: [1, 1, 1],        // 平衡分配
  DEBUG: [2, 1, 0]            // 測試用分配
};

/**
 * 生成隨機有效的分配方案
 * @returns {array} [點數1, 點數2, 點數3] 總和為 3
 */
export function generateRandomAllocation() {
  const allocations = [
    [0, 0, 3],
    [0, 1, 2],
    [0, 2, 1],
    [0, 3, 0],
    [1, 0, 2],
    [1, 1, 1],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
    [3, 0, 0]
  ];
  
  const randomIdx = Math.floor(Math.random() * allocations.length);
  return allocations[randomIdx];
}

// ============================================================
// 增強型操作（含驗證與詳情）
// ============================================================

/**
 * 智慧加點 - 自動檢查是否可行，返回詳細結果
 * 
 * @param {array} allocation - 目前分配
 * @param {number} schoolIndex - 學校索引
 * @returns {object} {
 *   success: boolean,
 *   newAllocation?: array,
 *   error?: string,
 *   warning?: string,
 *   canContinue: boolean  // 加完後還能繼續加
 * }
 */
export function addPointSmart(allocation, schoolIndex) {
  const canOp = canPerformOperation(allocation, schoolIndex, "add");
  
  if (!canOp.canDo) {
    return { success: false, error: canOp.reason, canContinue: false };
  }
  
  const result = addPoint(allocation, schoolIndex);
  
  if (result.success) {
    const newRemaining = getRemainingPoints(result.newAllocation);
    return {
      success: true,
      newAllocation: result.newAllocation,
      canContinue: newRemaining > 0,
      warning: newRemaining === 0 ? "✅ 資源已分配完成！可點擊 FINISH。" : undefined
    };
  }
  
  return { success: false, error: result.error, canContinue: true };
}

/**
 * 智慧減點 - 自動檢查是否可行
 * 
 * @param {array} allocation - 目前分配
 * @param {number} schoolIndex - 學校索引
 * @returns {object} { success: boolean, newAllocation?: array, error?: string }
 */
export function removePointSmart(allocation, schoolIndex) {
  const canOp = canPerformOperation(allocation, schoolIndex, "remove");
  
  if (!canOp.canDo) {
    return { success: false, error: canOp.reason };
  }
  
  return removePoint(allocation, schoolIndex);
}

/**
 * 獲取操作建議（用於 UI 提示）
 * 告訴玩家目前的分配狀態和下一步可以做什麼
 * 
 * @param {array} allocation - 目前分配
 * @returns {object} {
 *   nextStep: string,           // 下一步建議
 *   canFinish: boolean,         // 是否可以完成
 *   availableSchools: array,    // 可分配的學校
 *   warnings: array             // 警告訊息
 * }
 */
export function getAllocationAdvice(allocation) {
  const total = getTotalAllocated(allocation);
  const remaining = getRemainingPoints(allocation);
  const isComplete = isAllocationComplete(allocation);
  const available = getAvailableSchoolsForAllocation(allocation);
  const warnings = getAllocationWarnings(allocation);
  
  let nextStep = "";
  
  if (total === 0) {
    nextStep = "請開始分配資源。點擊任意學校的 + 按鈕。";
  } else if (remaining === 0) {
    nextStep = "資源已分配完成！點擊 FINISH 按鈕提交。";
  } else if (remaining === 1) {
    nextStep = `還剩 1 點資源。可分配給 ${available.length} 個學校。`;
  } else {
    nextStep = `還剩 ${remaining} 點資源。可分配給 ${available.length} 個學校。`;
  }
  
  return {
    nextStep: nextStep,
    canFinish: isComplete,
    availableSchools: available,
    warnings: warnings
  };
}

/**
 * 驗證整個分配流程（用於提交前最後檢查）
 * 返回是否所有條件都滿足
 * 
 * @param {array} allocation - 資源分配
 * @param {array?} schools - 學校資料（可選，用於額外驗證）
 * @returns {object} {
 *   valid: boolean,
 *   missingPoints?: number,
 *   issues?: array,
 *   readyToSubmit: boolean
 * }
 */
export function validateAllocationFlow(allocation, schools = null) {
  const issues = [];
  const total = getTotalAllocated(allocation);
  const remaining = getRemainingPoints(allocation);
  
  if (total < 3) {
    issues.push(`資源未完全分配（已分配 ${total}/3 點）`);
  }
  
  if (total > 3) {
    issues.push(`資源超額分配（已分配 ${total} 點，應為 3 點）`);
  }
  
  if (allocation.some(p => !Number.isInteger(p) || p < 0 || p > 3)) {
    issues.push("分配值無效");
  }
  
  // 如果提供校資料，檢查是否全部未獲資源（會失分）
  if (schools && Array.isArray(schools)) {
    const zeroAllocCount = allocation.filter(p => p === 0).length;
    if (zeroAllocCount === 3) {
      issues.push("警告：所有學校都未獲資源！");
    }
    if (zeroAllocCount === 2) {
      issues.push("警告：有兩所學校未獲資源，可能觸發負面事件。");
    }
  }
  
  return {
    valid: total === 3,
    missingPoints: remaining,
    issues: issues.length > 0 ? issues : undefined,
    readyToSubmit: total === 3 && issues.length === 0
  };
}

/**
 * 比較分配方案（用於「是否改進」提示）
 * 
 * @param {array} currentAllocation - 目前分配
 * @param {array} previousAllocation - 前一個分配
 * @returns {object} {
 *   improved: boolean,
 *   detail: string
 * }
 */
export function compareAllocations(currentAllocation, previousAllocation) {
  if (!previousAllocation || previousAllocation.every(p => p === 0)) {
    return {
      improved: "new",
      detail: "首次分配"
    };
  }
  
  const currentStr = JSON.stringify(currentAllocation);
  const previousStr = JSON.stringify(previousAllocation);
  
  if (currentStr === previousStr) {
    return {
      improved: false,
      detail: "分配未改變"
    };
  }
  
  return {
    improved: true,
    detail: `從 [${previousAllocation}] 改為 [${currentAllocation}]`
  };
}
