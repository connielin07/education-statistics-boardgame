/**
 * ruleCheck.js - 規則驗證器
 * 
 * 職責：
 * 1. 驗證資源分配是否合法
 * 2. 檢查輸入資料的合理性
 * 3. 防止玩家輸入錯誤的分配方案
 * 
 * 使用場景：
 * - 玩家點按鈕調整資源時，實時檢查是否超過 3 點
 * - 玩家點擊 FINISH 時，確保恰好分配完 3 點
 * - 計分前再次確認資料完整性
 */

// ============================================================
// 資源分配驗證
// ============================================================

/**
 * 驗證資源分配總數
 * @param {array} allocation - 資源分配 [點數1, 點數2, 點數3]
 * @returns {boolean} 資源總數是否等於 3
 */
export function isAllocationComplete(allocation) {
  const total = allocation.reduce((sum, points) => sum + points, 0);
  return total === 3;
}

/**
 * 驗證單個分配值是否有效
 * @param {number} points - 要分配的點數
 * @returns {boolean} 是否在 0-3 之間
 */
export function isValidAllocationValue(points) {
  return Number.isInteger(points) && points >= 0 && points <= 3;
}

/**
 * 驗證整個分配陣列是否有效
 * @param {array} allocation - 資源分配陣列
 * @returns {object} { valid: boolean, error?: string }
 */
export function validateAllocation(allocation) {
  // 檢查陣列長度
  if (!Array.isArray(allocation) || allocation.length !== 3) {
    return {
      valid: false,
      error: "分配陣列必須包含 3 個值"
    };
  }
  
  // 檢查每個值是否有效
  for (let i = 0; i < allocation.length; i++) {
    if (!isValidAllocationValue(allocation[i])) {
      return {
        valid: false,
        error: `第 ${i + 1} 個分配值無效：${allocation[i]}`
      };
    }
  }
  
  // 檢查總數是否等於 3
  if (!isAllocationComplete(allocation)) {
    const total = allocation.reduce((sum, points) => sum + points, 0);
    return {
      valid: false,
      error: `資源總數為 ${total}，必須恰好是 3 點`
    };
  }
  
  return { valid: true };
}

/**
 * 獲取剩餘可分配的資源點數
 * @param {array} allocation - 目前分配
 * @returns {number} 剩餘點數（0-3）
 */
export function getRemainingPoints(allocation) {
  const total = allocation.reduce((sum, points) => sum + points, 0);
  return Math.max(0, 3 - total);
}

/**
 * 檢查是否可以再增加指定學校的分配
 * @param {array} allocation - 目前分配
 * @param {number} schoolIndex - 學校索引 (0, 1, 2)
 * @param {number} pointsToAdd - 要增加的點數
 * @returns {boolean} 是否可以增加
 */
export function canAddAllocation(allocation, schoolIndex, pointsToAdd) {
  if (schoolIndex < 0 || schoolIndex >= 3) {
    return false;
  }
  
  const currentPoints = allocation[schoolIndex];
  const newPoints = currentPoints + pointsToAdd;
  
  // 新分配值不能超過 3
  if (newPoints > 3) {
    return false;
  }
  
  // 計算其他兩校的總分配
  const otherTotal = allocation.reduce((sum, points, idx) => {
    return idx !== schoolIndex ? sum + points : sum;
  }, 0);
  
  // 總分配不能超過 3
  if (otherTotal + newPoints > 3) {
    return false;
  }
  
  return true;
}

// ============================================================
// 學校資料驗證
// ============================================================

/**
 * 驗證單所學校的資料完整性
 * @param {object} schoolData - 學校資料
 * @returns {object} { valid: boolean, missingFields?: array }
 */
export function validateSchoolData(schoolData) {
  const requiredFields = [
    "school_name",
    "region",
    "remote_area_level",
    "change_category",
    "is_below_median"
  ];
  
  const missingFields = requiredFields.filter(field => !(field in schoolData));
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      missingFields: missingFields
    };
  }
  
  return { valid: true };
}

/**
 * 驗證整個學校陣列
 * @param {array} schools - 學校資料陣列
 * @returns {object} { valid: boolean, errors?: array }
 */
export function validateSchools(schools) {
  const errors = [];
  
  if (!Array.isArray(schools) || schools.length !== 3) {
    return {
      valid: false,
      errors: ["必須提供恰好 3 所學校"]
    };
  }
  
  for (let i = 0; i < schools.length; i++) {
    const check = validateSchoolData(schools[i]);
    if (!check.valid) {
      errors.push(`學校 ${i + 1} 缺少欄位: ${check.missingFields.join(", ")}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

// ============================================================
// 事件卡驗證
// ============================================================

/**
 * 驗證事件卡資料
 * @param {object} eventCard - 事件卡資料
 * @returns {boolean} 是否包含基本資訊
 */
export function validateEventCard(eventCard) {
  return eventCard && eventCard.title && eventCard.description;
}

// ============================================================
// 整體流程驗證
// ============================================================

/**
 * 驗證回合是否可以結束
 * 需要檢查：1. 資源已完全分配
 *          2. 學校資料完整
 *          3. 事件卡有效
 * 
 * @param {array} schools - 學校資料
 * @param {array} allocation - 資源分配
 * @param {object} eventCard - 事件卡
 * @returns {object} { valid: boolean, errors?: array }
 */
export function canFinishRound(schools, allocation, eventCard) {
  const errors = [];
  
  // 檢查分配
  const allocationCheck = validateAllocation(allocation);
  if (!allocationCheck.valid) {
    errors.push(allocationCheck.error);
  }
  
  // 檢查學校
  const schoolsCheck = validateSchools(schools);
  if (!schoolsCheck.valid) {
    errors.push(...schoolsCheck.errors);
  }
  
  // 檢查事件卡
  if (!validateEventCard(eventCard)) {
    errors.push("事件卡資料不完整");
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

// ============================================================
// 可用性檢查輔助函數
// ============================================================

/**
 * 獲取當前分配狀態的人類可讀描述
 * @param {array} allocation - 資源分配
 * @returns {object} { isComplete: boolean, remaining: number, status: string }
 */
export function getAllocationStatus(allocation) {
  const total = allocation.reduce((sum, points) => sum + points, 0);
  const remaining = 3 - total;
  
  let status = "";
  if (total === 0) {
    status = "尚未分配";
  } else if (total < 3) {
    status = `已分配 ${total} 點，還剩 ${remaining} 點`;
  } else {
    status = "分配完成";
  }
  
  return {
    isComplete: remaining === 0,
    remaining: remaining,
    status: status
  };
}

/**
 * 檢查是否可以點擊 FINISH 按鈕
 * @param {array} allocation - 資源分配
 * @returns {boolean} 是否可以完成
 */
export function canClickFinish(allocation) {
  return isAllocationComplete(allocation);
}

// ============================================================
// 測試用輔助函數
// ============================================================

/**
 * 生成測試錯誤訊息集合（用於測試各種邊界情況）
 */
export const TEST_CASES = {
  VALID: {
    allocation: [2, 1, 0],
    expected: true
  },
  OVER_ALLOCATED: {
    allocation: [2, 2, 0],
    expected: false,
    error: "超過 3 點"
  },
  INVALID_VALUE: {
    allocation: [2, 1, -1],
    expected: false,
    error: "包含負數"
  },
  NOT_COMPLETE: {
    allocation: [2, 1, 1],
    expected: false,
    error: "等於 4 點"
  },
  ZERO_ALLOCATION: {
    allocation: [0, 0, 0],
    expected: false,
    error: "未分配任何資源"
  }
};
