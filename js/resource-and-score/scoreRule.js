/**
 * scoreRule.js - 計分引擎核心
 * 
 * 職責：
 * 1. 計算基礎分數（根據學校分類 × 分配點數）
 * 2. 套用中位數加成（低於中位且有獲資源）
 * 3. 套用事件卡效果（特殊條件判斷）
 * 4. 組合總分
 * 
 * 分層設計：每個函數只負責一件事，便於測試與維護
 */

// ============================================================
// 📋 資料契約定義
// 
// 期望 E 提供的學校資料格式：
// {
//   school_name: "示意學校 A",
//   region: "東部",
//   remote_area_level: "特偏",
//   count_111: "250",              // 字符串
//   count_113: "230",              // 字符串
//   change_rate: "-8.2",           // 字符串或數字（百分比形式）
//   change_category: "明顯下降",    // E 預先算好
//   is_below_median: true           // E 預先算好
// }
// ============================================================

// ============================================================
// 層級 1：基礎分數計算
// ============================================================

/**
 * 根據學校分類，返回該校每 1 點資源對應的基礎分數
 * @param {string} classification - 分類結果（明顯下降 / 小幅下降 / 穩定或成長）
 * @returns {number} 每 1 點資源的基礎分數
 */
export function getBaseScorePerPoint(classification) {
  const scoreMap = {
    "明顯下降": 2,
    "小幅下降": 1,
    "穩定或成長": 0
  };
  
  return scoreMap[classification] || 0;
}

/**
 * 計算單所學校的基礎分數
 * @param {string} classification - 分類結果
 * @param {number} allocatedPoints - 分配給該校的資源點數
 * @returns {number} 基礎分數（未含加成）
 */
export function calculateSchoolBaseScore(classification, allocatedPoints) {
  const scorePerPoint = getBaseScorePerPoint(classification);
  return scorePerPoint * allocatedPoints;
}

// ============================================================
// 層級 2：中位數加成計算
// ============================================================

/**
 * 判斷是否應該套用中位數加成
 * 條件：學校低於整體中位 且 本回合有獲得資源
 * @param {boolean} isBelowMedian - 是否低於整體中位
 * @param {number} allocatedPoints - 分配給該校的資源點數
 * @returns {number} 加成分數（0 或 1）
 */
export function calculateMedianBonus(isBelowMedian, allocatedPoints) {
  return (isBelowMedian && allocatedPoints > 0) ? 1 : 0;
}

/**
 * 計算單所學校的總分（基礎分 + 中位加成）
 * @param {object} schoolData - 學校資料
 * @param {number} allocatedPoints - 分配給該校的資源點數
 * @returns {number} 該校本回合總分
 */
export function calculateSchoolRoundScore(schoolData, allocatedPoints) {
  const baseScore = calculateSchoolBaseScore(
    schoolData.change_category, 
    allocatedPoints
  );
  const medianBonus = calculateMedianBonus(
    schoolData.is_below_median, 
    allocatedPoints
  );
  
  return baseScore + medianBonus;
}

// ============================================================
// 層級 3：事件卡效果計算
// ============================================================

/**
 * 檢查交通不便加劇事件是否觸發
 * 條件：特偏或極偏學校若未獲資源，本回合 -2 分
 * @param {array} schools - 所有學校資料
 * @param {array} allocation - 資源分配 [點數1, 點數2, 點數3]
 * @returns {number} 扣分（負數）或 0
 */
export function checkTransitPenalty(schools, allocation) {
  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    const points = allocation[i];
    
    // 特偏或極偏 且 未獲資源
    if (["特偏", "極偏"].includes(school.remote_area_level) && points === 0) {
      return -2;
    }
  }
  return 0;
}

/**
 * 檢查教師流動增加事件是否觸發
 * 條件：明顯下降學校若未獲資源，本回合 -2 分
 * @param {array} schools - 所有學校資料
 * @param {array} allocation - 資源分配
 * @returns {number} 扣分（負數）或 0
 */
export function checkTeacherFlowPenalty(schools, allocation) {
  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    const points = allocation[i];
    
    // 明顯下降 且 未獲資源
    if (school.change_category === "明顯下降" && points === 0) {
      return -2;
    }
  }
  return 0;
}

/**
 * 檢查數位設備補助事件是否觸發
 * 條件：本回合有獲得資源之學校其學生規模變動率低於整體中位，總分 +1
 * @param {array} schools - 所有學校資料
 * @param {array} allocation - 資源分配
 * @returns {number} 加分（正數）或 0
 */
export function checkDigitalDeviceBonus(schools, allocation) {
  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    const points = allocation[i];
    
    // 有獲資源 且 低於中位
    if (points > 0 && school.is_below_median) {
      return 1;
    }
  }
  return 0;
}

/**
 * 檢查地方社區支持事件是否觸發
 * 條件：若本回合資源有分配給變動率為負值的學校，總分 +1
 * @param {array} schools - 所有學校資料
 * @param {array} allocation - 資源分配
 * @returns {number} 加分（正數）或 0
 */
export function checkCommunityBonus(schools, allocation) {
  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    const points = allocation[i];
    
    // 有獲資源 且 變動率為負（明顯下降 或 小幅下降）
    const changeRate = parseFloat(school.change_rate);
    if (points > 0 && changeRate < 0) {
      return 1;
    }
  }
  return 0;
}

/**
 * 根據事件卡類型，計算事件卡效果
 * @param {object} eventCard - 事件卡資料
 * @param {array} schools - 所有學校資料
 * @param {array} allocation - 資源分配
 * @returns {number} 事件卡淨效果（可正可負）
 */
export function calculateEventEffect(eventCard, schools, allocation) {
  if (!eventCard || !eventCard.title) {
    return 0;
  }
  
  switch (eventCard.title) {
    case "交通不便加劇":
      return checkTransitPenalty(schools, allocation);
    case "教師流動增加":
      return checkTeacherFlowPenalty(schools, allocation);
    case "數位設備補助到位":
      return checkDigitalDeviceBonus(schools, allocation);
    case "地方社區支持活動":
      return checkCommunityBonus(schools, allocation);
    default:
      return 0;
  }
}

// ============================================================
// 層級 4：回合總分組合
// ============================================================

/**
 * 計算一整回合的分數（不含事件卡）
 * @param {array} schools - 所有學校資料
 * @param {array} allocation - 資源分配 [點數1, 點數2, 點數3]
 * @returns {number} 本回合資源配置得分
 */
export function calculateRoundScoreWithoutEvent(schools, allocation) {
  let roundScore = 0;
  
  for (let i = 0; i < schools.length; i++) {
    const schoolScore = calculateSchoolRoundScore(
      schools[i], 
      allocation[i]
    );
    roundScore += schoolScore;
  }
  
  return roundScore;
}

/**
 * 計算一整回合的完整分數（含事件卡效果）
 * @param {array} schools - 所有學校資料
 * @param {array} allocation - 資源分配
 * @param {object} eventCard - 本回合事件卡
 * @returns {number} 本回合完整得分
 */
export function calculateRoundScore(schools, allocation, eventCard) {
  const baseScore = calculateRoundScoreWithoutEvent(schools, allocation);
  const eventEffect = calculateEventEffect(eventCard, schools, allocation);
  
  return baseScore + eventEffect;
}

/**
 * 計算新的累積總分
 * @param {number} currentTotalScore - 目前累積總分
 * @param {number} roundScore - 本回合得分
 * @returns {number} 新的累積總分
 */
export function updateTotalScore(currentTotalScore, roundScore) {
  return currentTotalScore + roundScore;
}

// ============================================================
// 結果判定
// ============================================================

/**
 * 根據最終總分，給出結果評語
 * @param {number} totalScore - 最終累積總分
 * @returns {object} 結果評語物件
 */
export function getResultFeedback(totalScore) {
  if (totalScore >= 20) {
    return {
      level: "A",
      title: "資源調度成效良好",
      message: "恭喜！你的資源分配策略非常出色，各校獲得適切支援。",
      score: totalScore
    };
  } else if (totalScore >= 15) {
    return {
      level: "B",
      title: "整體校務支持大致穩定",
      message: "不錯！整體表現穩定，但仍有優化空間。",
      score: totalScore
    };
  } else {
    return {
      level: "C",
      title: "資源配置仍有改善空間",
      message: "繼續加油！下次可試著更仔細分析各校需求。",
      score: totalScore
    };
  }
}

// ============================================================
// 假資料（用於測試）
// ============================================================

export const MOCK_SCHOOLS = [
  {
    school_name: "示意學校 A",
    region: "東部",
    remote_area_level: "特偏",
    count_111: "250",
    count_113: "230",
    change_rate: "-8.2",
    change_category: "明顯下降",
    is_below_median: true
  },
  {
    school_name: "示意學校 B",
    region: "南部",
    remote_area_level: "偏遠",
    count_111: "320",
    count_113: "310",
    change_rate: "-3.1",
    change_category: "小幅下降",
    is_below_median: true
  },
  {
    school_name: "示意學校 C",
    region: "中部",
    remote_area_level: "非偏遠",
    count_111: "500",
    count_113: "508",
    change_rate: "1.5",
    change_category: "穩定或成長",
    is_below_median: false
  }
];

export const MOCK_EVENT = {
  id: "e1",
  title: "交通不便加劇",
  description: "特偏或極偏學校若未獲資源，本回合 -2 分"
};

export const MOCK_ALLOCATION = [2, 1, 0]; // 分配 2 點給 A，1 點給 B，0 點給 C
