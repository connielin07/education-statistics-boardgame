/**
 * scoreRule.test.js - 計分邏輯單元測試
 *
 * 使用方式：
 * - 瀏覽器 console：runAllTests()
 * - Node.js：node -e "import('./js/resource-and-score/scoreRule.test.js').then(m => m.runAllTests())"
 *
 * 這份測試直接呼叫 scoreRule.js 的正式函式，避免測試內重寫一份邏輯。
 */

import {
  calculateEventEffect,
  calculateMedianBonus,
  calculateRoundScore,
  calculateRoundScoreSafe,
  calculateRoundScoreWithoutEvent,
  calculateSchoolBaseScore,
  calculateSchoolRoundScore,
  checkCommunityBonus,
  checkDigitalDeviceBonus,
  checkTeacherFlowPenalty,
  checkTransitPenalty,
  getBaseScorePerPoint,
  getBestAllocation,
  getDetailedScoreReport,
  getResultFeedback,
  updateTotalScore
} from './scoreRule.js';

const EVENT_TRANSIT = { title: "交通不便加劇", description: "特偏或極偏學校若未獲資源，本回合 -2 分" };
const EVENT_TEACHER = { title: "教師流動增加", description: "明顯下降學校若未獲資源，本回合 -2 分" };
const EVENT_DIGITAL = { title: "數位設備補助到位", description: "低於中位且有獲資源，總分 +1" };
const EVENT_COMMUNITY = { title: "地方社區支持活動", description: "分配給變動率為負值的學校，總分 +1" };

const TEST_SCHOOLS = [
  {
    school_name: "示意學校 A",
    region: "東部",
    remote_area_level: "特偏",
    change_rate: "-0.082",
    change_category: "明顯下降",
    is_below_median: true
  },
  {
    school_name: "示意學校 B",
    region: "南部",
    remote_area_level: "偏遠",
    change_rate: "-0.031",
    change_category: "小幅下降",
    is_below_median: true
  },
  {
    school_name: "示意學校 C",
    region: "中部",
    remote_area_level: "非偏遠",
    change_rate: "0.015",
    change_category: "穩定或成長",
    is_below_median: false
  }
];

const TestRunner = {
  results: [],
  currentSuite: "",

  reset() {
    this.results = [];
    this.currentSuite = "";
  },

  suite(name) {
    this.currentSuite = name;
    console.log(`\n測試組: ${name}`);
  },

  test(description, fn) {
    try {
      fn();
      this.results.push({ suite: this.currentSuite, description, pass: true });
      console.log(`  PASS ${description}`);
    } catch (error) {
      this.results.push({
        suite: this.currentSuite,
        description,
        pass: false,
        error: error.message
      });
      console.log(`  FAIL ${description}`);
      console.log(`       ${error.message}`);
    }
  },

  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message} | 預期: ${expected}, 實際: ${actual}`);
    }
  },

  assertDeepEquals(actual, expected, message) {
    const actualText = JSON.stringify(actual);
    const expectedText = JSON.stringify(expected);
    if (actualText !== expectedText) {
      throw new Error(`${message} | 預期: ${expectedText}, 實際: ${actualText}`);
    }
  },

  summary() {
    console.log("\n" + "=".repeat(50));
    const passed = this.results.filter(result => result.pass).length;
    const failed = this.results.length - passed;
    console.log(`測試結果: ${passed}/${this.results.length} 通過`);

    if (failed > 0) {
      console.log(`\n失敗的測試 (${failed} 個):`);
      this.results.filter(result => !result.pass).forEach(result => {
        console.log(`  - [${result.suite}] ${result.description}`);
        console.log(`    ${result.error}`);
      });
    }
  }
};

function runBaseScoreTests() {
  TestRunner.suite("基礎分數");

  TestRunner.test("明顯下降每點 2 分", () => {
    TestRunner.assertEquals(getBaseScorePerPoint("明顯下降"), 2, "明顯下降每點分數");
    TestRunner.assertEquals(calculateSchoolBaseScore("明顯下降", 2), 4, "明顯下降 2 點");
  });

  TestRunner.test("小幅下降每點 1 分", () => {
    TestRunner.assertEquals(getBaseScorePerPoint("小幅下降"), 1, "小幅下降每點分數");
    TestRunner.assertEquals(calculateSchoolBaseScore("小幅下降", 3), 3, "小幅下降 3 點");
  });

  TestRunner.test("穩定或成長每點 0 分", () => {
    TestRunner.assertEquals(getBaseScorePerPoint("穩定或成長"), 0, "穩定或成長每點分數");
    TestRunner.assertEquals(calculateSchoolBaseScore("穩定或成長", 3), 0, "穩定或成長 3 點");
  });

  TestRunner.test("未知分類不給基礎分", () => {
    TestRunner.assertEquals(getBaseScorePerPoint("未知分類"), 0, "未知分類分數");
  });
}

function runMedianBonusTests() {
  TestRunner.suite("中位數加成");

  TestRunner.test("低於中位且有獲資源加 1 分", () => {
    TestRunner.assertEquals(calculateMedianBonus(true, 1), 1, "低於中位且有資源");
  });

  TestRunner.test("低於中位但未獲資源不加成", () => {
    TestRunner.assertEquals(calculateMedianBonus(true, 0), 0, "低於中位但無資源");
  });

  TestRunner.test("未低於中位即使獲資源也不加成", () => {
    TestRunner.assertEquals(calculateMedianBonus(false, 2), 0, "未低於中位");
  });

  TestRunner.test("單校總分包含基礎分與中位加成", () => {
    TestRunner.assertEquals(calculateSchoolRoundScore(TEST_SCHOOLS[0], 2), 5, "A 校 2 點");
    TestRunner.assertEquals(calculateSchoolRoundScore(TEST_SCHOOLS[1], 1), 2, "B 校 1 點");
    TestRunner.assertEquals(calculateSchoolRoundScore(TEST_SCHOOLS[2], 3), 0, "C 校 3 點");
  });
}

function runEventEffectTests() {
  TestRunner.suite("事件卡效果");

  TestRunner.test("交通不便加劇：特偏或極偏學校未獲資源扣 2 分", () => {
    TestRunner.assertEquals(checkTransitPenalty(TEST_SCHOOLS, [0, 1, 2]), -2, "交通扣分");
    TestRunner.assertEquals(calculateEventEffect(EVENT_TRANSIT, TEST_SCHOOLS, [0, 1, 2]), -2, "交通事件");
  });

  TestRunner.test("交通不便加劇：特偏學校有獲資源不扣分", () => {
    TestRunner.assertEquals(checkTransitPenalty(TEST_SCHOOLS, [1, 1, 1]), 0, "交通不扣分");
  });

  TestRunner.test("教師流動增加：明顯下降學校未獲資源扣 2 分", () => {
    TestRunner.assertEquals(checkTeacherFlowPenalty(TEST_SCHOOLS, [0, 1, 2]), -2, "教師流動扣分");
    TestRunner.assertEquals(calculateEventEffect(EVENT_TEACHER, TEST_SCHOOLS, [0, 1, 2]), -2, "教師流動事件");
  });

  TestRunner.test("數位設備補助到位：分配給低於中位學校加 1 分", () => {
    TestRunner.assertEquals(checkDigitalDeviceBonus(TEST_SCHOOLS, [0, 1, 2]), 1, "數位補助加分");
    TestRunner.assertEquals(calculateEventEffect(EVENT_DIGITAL, TEST_SCHOOLS, [0, 1, 2]), 1, "數位補助事件");
  });

  TestRunner.test("地方社區支持活動：分配給負變動率學校加 1 分", () => {
    TestRunner.assertEquals(checkCommunityBonus(TEST_SCHOOLS, [0, 1, 2]), 1, "社區支持加分");
    TestRunner.assertEquals(calculateEventEffect(EVENT_COMMUNITY, TEST_SCHOOLS, [0, 1, 2]), 1, "社區支持事件");
  });

  TestRunner.test("未知或空事件不影響分數", () => {
    TestRunner.assertEquals(calculateEventEffect({ title: "未知事件" }, TEST_SCHOOLS, [2, 1, 0]), 0, "未知事件");
    TestRunner.assertEquals(calculateEventEffect(null, TEST_SCHOOLS, [2, 1, 0]), 0, "空事件");
  });
}

function runRoundScoreTests() {
  TestRunner.suite("回合與總分");

  TestRunner.test("不含事件的示範配置為 7 分", () => {
    TestRunner.assertEquals(calculateRoundScoreWithoutEvent(TEST_SCHOOLS, [2, 1, 0]), 7, "示範配置");
  });

  TestRunner.test("含交通事件且特偏學校有資源仍為 7 分", () => {
    TestRunner.assertEquals(calculateRoundScore(TEST_SCHOOLS, [2, 1, 0], EVENT_TRANSIT), 7, "示範配置含交通事件");
  });

  TestRunner.test("含教師流動事件且明顯下降學校未獲資源會扣分", () => {
    TestRunner.assertEquals(calculateRoundScore(TEST_SCHOOLS, [0, 1, 2], EVENT_TEACHER), 0, "教師流動扣分後");
  });

  TestRunner.test("更新總分是目前總分加本回合分數", () => {
    TestRunner.assertEquals(updateTotalScore(10, 7), 17, "正分累計");
    TestRunner.assertEquals(updateTotalScore(17, -2), 15, "負分累計");
  });
}

function runSafeAndReportTests() {
  TestRunner.suite("安全計分與報表");

  TestRunner.test("calculateRoundScoreSafe 對有效資料回傳成功", () => {
    const result = calculateRoundScoreSafe(TEST_SCHOOLS, [2, 1, 0], EVENT_TRANSIT);
    TestRunner.assertEquals(result.success, true, "有效資料 success");
    TestRunner.assertEquals(result.score, 7, "有效資料分數");
  });

  TestRunner.test("calculateRoundScoreSafe 會拒絕錯誤長度", () => {
    const result = calculateRoundScoreSafe(TEST_SCHOOLS.slice(0, 2), [2, 1, 0], EVENT_TRANSIT);
    TestRunner.assertEquals(result.success, false, "錯誤學校數量");
  });

  TestRunner.test("getDetailedScoreReport 回傳分項分數", () => {
    const report = getDetailedScoreReport(TEST_SCHOOLS, [2, 1, 0], EVENT_TRANSIT);
    TestRunner.assertEquals(report.baseScoreTotal, 5, "基礎分合計");
    TestRunner.assertEquals(report.medianBonusTotal, 2, "中位加成合計");
    TestRunner.assertEquals(report.eventEffect, 0, "事件效果");
    TestRunner.assertEquals(report.roundScore, 7, "回合總分");
    TestRunner.assertEquals(report.schoolScores.length, 3, "學校分項數量");
  });

  TestRunner.test("getBestAllocation 回傳分數最高的配置", () => {
    const best = getBestAllocation(TEST_SCHOOLS, EVENT_TRANSIT);
    TestRunner.assertDeepEquals(best.allocation, [2, 1, 0], "最佳配置");
    TestRunner.assertEquals(best.score, 7, "最佳配置分數");
  });
}

function runResultFeedbackTests() {
  TestRunner.suite("結果評語");

  TestRunner.test("28 分以上為 A", () => {
    const feedback = getResultFeedback(28);
    TestRunner.assertEquals(feedback.level, "A", "A 級門檻");
    TestRunner.assertEquals(feedback.score, 28, "A 級分數");
  });

  TestRunner.test("18 到 27 分為 B", () => {
    TestRunner.assertEquals(getResultFeedback(18).level, "B", "B 級下限");
    TestRunner.assertEquals(getResultFeedback(27).level, "B", "B 級上限");
  });

  TestRunner.test("17 分以下為 C", () => {
    TestRunner.assertEquals(getResultFeedback(17).level, "C", "C 級門檻");
  });
}

export function runAllTests() {
  TestRunner.reset();
  console.clear();
  console.log("開始執行計分邏輯單元測試\n");

  runBaseScoreTests();
  runMedianBonusTests();
  runEventEffectTests();
  runRoundScoreTests();
  runSafeAndReportTests();
  runResultFeedbackTests();

  TestRunner.summary();
  return TestRunner.results;
}

if (typeof window !== 'undefined') {
  window.runAllTests = runAllTests;
  console.log(
    "%c計分邏輯測試已就緒。請輸入 runAllTests() 來執行測試。",
    "color: #2d9bf0; font-size: 14px; font-weight: bold;"
  );
}

export default runAllTests;
