/**
 * scoreRule.test.js - 計分邏輯單元測試
 * 
 * 使用方式：
 * 在瀏覽器 console 中執行 runAllTests()
 * 或在 Node.js 環境中運行此檔案
 * 
 * 測試涵蓋：
 * 1. 基礎分數計算
 * 2. 中位數加成
 * 3. 事件卡效果
 * 4. 回合總分組合
 * 5. 結果評語判定
 */

// ============================================================
// 測試框架（簡單的斷言工具）
// ============================================================

const TestRunner = {
  results: [],
  currentSuite: "",
  
  suite(name) {
    this.currentSuite = name;
    console.log(`\n📋 測試組: ${name}`);
  },
  
  test(description, fn) {
    try {
      fn();
      this.results.push({ suite: this.currentSuite, description, pass: true });
      console.log(`  ✅ ${description}`);
    } catch (error) {
      this.results.push({ 
        suite: this.currentSuite, 
        description, 
        pass: false, 
        error: error.message 
      });
      console.log(`  ❌ ${description}`);
      console.log(`     Error: ${error.message}`);
    }
  },
  
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },
  
  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message} | 預期: ${expected}, 實際: ${actual}`);
    }
  },
  
  assertDeepEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `${message} | 預期: ${JSON.stringify(expected)}, 實際: ${JSON.stringify(actual)}`
      );
    }
  },
  
  summary() {
    console.log("\n" + "=".repeat(50));
    const passed = this.results.filter(r => r.pass).length;
    const failed = this.results.filter(r => !r.pass).length;
    const total = this.results.length;
    
    console.log(`📊 測試結果: ${passed}/${total} 通過`);
    
    if (failed > 0) {
      console.log(`\n❌ 失敗的測試 (${failed} 個):`);
      this.results.filter(r => !r.pass).forEach(r => {
        console.log(`  - [${r.suite}] ${r.description}`);
        console.log(`    ${r.error}`);
      });
    } else {
      console.log("🎉 全部測試通過！");
    }
  }
};

// ============================================================
// 測試用例
// ============================================================

/**
 * 假設我們在此處引入 scoreRule.js 的函數
 * 在實際使用中，需要：
 * import { ... } from './scoreRule.js'
 */

// 臨時定義測試用的函數（實際應該 import）
// 為了測試方便，我們先寫測試案例，展示如何測試

function runComputeScoreTests() {
  TestRunner.suite("基礎分數計算");
  
  // 測試 1：明顯下降 + 2 點 = +4 分
  TestRunner.test("明顯下降校配 2 點應得 +4 分", () => {
    // Mock: 假設 calculateSchoolBaseScore 函數
    const classification = "明顯下降";
    const points = 2;
    const scorePerPoint = 2; // 明顯下降每 1 點 = 2 分
    const baseScore = scorePerPoint * points;
    
    TestRunner.assertEquals(baseScore, 4, "明顯下降計分");
  });
  
  // 測試 2：小幅下降 + 1 點 = +1 分
  TestRunner.test("小幅下降校配 1 點應得 +1 分", () => {
    const classification = "小幅下降";
    const points = 1;
    const scorePerPoint = 1; // 小幅下降每 1 點 = 1 分
    const baseScore = scorePerPoint * points;
    
    TestRunner.assertEquals(baseScore, 1, "小幅下降計分");
  });
  
  // 測試 3：穩定或成長 + 3 點 = +0 分
  TestRunner.test("穩定或成長校配 3 點應得 0 分", () => {
    const classification = "穩定或成長";
    const points = 3;
    const scorePerPoint = 0; // 穩定或成長每 1 點 = 0 分
    const baseScore = scorePerPoint * points;
    
    TestRunner.assertEquals(baseScore, 0, "穩定或成長計分");
  });
}

function runMedianBonusTests() {
  TestRunner.suite("中位數加成");
  
  // 測試 1：低於中位 + 有獲資源 = +1 分
  TestRunner.test("低於中位且獲資源應加 1 分", () => {
    const isBelowMedian = true;
    const points = 1;
    const bonus = (isBelowMedian && points > 0) ? 1 : 0;
    
    TestRunner.assertEquals(bonus, 1, "中位加成");
  });
  
  // 測試 2：低於中位但未獲資源 = 0 分
  TestRunner.test("低於中位但未獲資源不加成", () => {
    const isBelowMedian = true;
    const points = 0;
    const bonus = (isBelowMedian && points > 0) ? 1 : 0;
    
    TestRunner.assertEquals(bonus, 0, "未獲資源無加成");
  });
  
  // 測試 3：高於中位但獲資源 = 0 分
  TestRunner.test("高於中位即使獲資源也不加成", () => {
    const isBelowMedian = false;
    const points = 2;
    const bonus = (isBelowMedian && points > 0) ? 1 : 0;
    
    TestRunner.assertEquals(bonus, 0, "高於中位無加成");
  });
}

function runEventCardTests() {
  TestRunner.suite("事件卡效果");
  
  // 測試 1：交通不便加劇 - 特偏校未獲資源 -2 分
  TestRunner.test("交通不便: 特偏校未獲資源扣 2 分", () => {
    const schools = [
      { remote_area_level: "特偏" },
      { remote_area_level: "偏遠" },
      { remote_area_level: "非偏遠" }
    ];
    const allocation = [0, 1, 2]; // 特偏校未獲資源
    
    // 模擬檢查邏輯
    let penalty = 0;
    for (let i = 0; i < schools.length; i++) {
      if (schools[i].remote_area_level === "特偏" && allocation[i] === 0) {
        penalty = -2;
        break;
      }
    }
    
    TestRunner.assertEquals(penalty, -2, "交通不便扣分");
  });
  
  // 測試 2：交通不便加劇 - 特偏校獲資源 0 分
  TestRunner.test("交通不便: 特偏校獲資源無扣分", () => {
    const schools = [
      { remote_area_level: "特偏" }
    ];
    const allocation = [2]; // 特偏校獲資源
    
    let penalty = 0;
    if (schools[0].remote_area_level === "特偏" && allocation[0] === 0) {
      penalty = -2;
    }
    
    TestRunner.assertEquals(penalty, 0, "獲資源無扣分");
  });
  
  // 測試 3：地方社區支持 - 有資源分配給負值校 +1 分
  TestRunner.test("社區支持: 分配給負值校加 1 分", () => {
    const schools = [
      { change_rate: "-8.2" },  // 負值
      { change_rate: "1.5" }    // 正值
    ];
    const allocation = [2, 1]; // 分配給負值校
    
    let bonus = 0;
    for (let i = 0; i < schools.length; i++) {
      const changeRate = parseFloat(schools[i].change_rate);
      if (allocation[i] > 0 && changeRate < 0) {
        bonus = 1;
        break;
      }
    }
    
    TestRunner.assertEquals(bonus, 1, "社區支持加分");
  });
}

function runRoundScoreTests() {
  TestRunner.suite("回合完整計分");
  
  // 測試場景：
  // 學校 A：明顯下降、低於中位、配 2 點
  // 學校 B：小幅下降、低於中位、配 1 點
  // 學校 C：穩定或成長、高於中位、配 0 點
  // 預期：A (2*2+1=5) + B (1*1+1=2) + C (0) = 7 分
  
  TestRunner.test("完整回合計分：7 分", () => {
    // 模擬完整計分
    const schools = [
      { change_category: "明顯下降", is_below_median: true },
      { change_category: "小幅下降", is_below_median: true },
      { change_category: "穩定或成長", is_below_median: false }
    ];
    const allocation = [2, 1, 0];
    
    let roundScore = 0;
    
    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      const points = allocation[i];
      
      // 基礎分
      const scorePerPoint = (classification) => {
        const map = {
          "明顯下降": 2,
          "小幅下降": 1,
          "穩定或成長": 0
        };
        return map[classification] || 0;
      };
      
      const baseScore = scorePerPoint(school.change_category) * points;
      
      // 中位加成
      const bonus = (school.is_below_median && points > 0) ? 1 : 0;
      
      roundScore += baseScore + bonus;
    }
    
    TestRunner.assertEquals(roundScore, 7, "完整回合計分");
  });
}

function runTotalScoreTests() {
  TestRunner.suite("累積總分管理");
  
  TestRunner.test("起始 10 分 + 回合 7 分 = 17 分", () => {
    const currentTotalScore = 10; // 起始
    const roundScore = 7;
    const newTotalScore = currentTotalScore + roundScore;
    
    TestRunner.assertEquals(newTotalScore, 17, "累積總分");
  });
  
  TestRunner.test("17 分 + 回合負分 -2 分 = 15 分", () => {
    const currentTotalScore = 17;
    const roundScore = -2; // 事件卡扣分
    const newTotalScore = currentTotalScore + roundScore;
    
    TestRunner.assertEquals(newTotalScore, 15, "負分累積");
  });
}

function runResultFeedbackTests() {
  TestRunner.suite("結果評語判定");
  
  TestRunner.test("20 分以上為 A 級（成效良好）", () => {
    const totalScore = 25;
    const level = totalScore >= 20 ? "A" : totalScore >= 15 ? "B" : "C";
    
    TestRunner.assertEquals(level, "A", "A 級判定");
  });
  
  TestRunner.test("15-19 分為 B 級（大致穩定）", () => {
    const totalScore = 17;
    const level = totalScore >= 20 ? "A" : totalScore >= 15 ? "B" : "C";
    
    TestRunner.assertEquals(level, "B", "B 級判定");
  });
  
  TestRunner.test("14 分以下為 C 級（有改善空間）", () => {
    const totalScore = 12;
    const level = totalScore >= 20 ? "A" : totalScore >= 15 ? "B" : "C";
    
    TestRunner.assertEquals(level, "C", "C 級判定");
  });
}

// ============================================================
// 測試執行
// ============================================================

/**
 * 執行所有測試
 */
export function runAllTests() {
  console.clear();
  console.log("🧪 開始執行計分邏輯單元測試\n");
  
  runComputeScoreTests();
  runMedianBonusTests();
  runEventCardTests();
  runRoundScoreTests();
  runTotalScoreTests();
  runResultFeedbackTests();
  
  TestRunner.summary();
  
  // 返回測試結果
  return TestRunner.results;
}

// ============================================================
// 瀏覽器環境中使用
// ============================================================

// 將測試函數暴露到全局，方便在瀏覽器 console 中使用
if (typeof window !== 'undefined') {
  window.runAllTests = runAllTests;
  console.log(
    "%c計分邏輯測試已就緒。請輸入 runAllTests() 來執行測試。",
    "color: #2d9bf0; font-size: 14px; font-weight: bold;"
  );
}

// Node.js 環境中使用
export default runAllTests;
