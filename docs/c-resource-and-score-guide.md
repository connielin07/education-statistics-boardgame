# C 的計分與資源分配邏輯 - 使用指南

## 📂 已建立的檔案

### 1. `scoreRule.js` - 計分引擎核心 ⭐ 最重要
包含 4 個分層的計分計算：

```javascript
// 層 1：基礎分數
getBaseScorePerPoint(classification)        // 得到每點的基礎分
calculateSchoolBaseScore(classification, points)  // 單校基礎分

// 層 2：中位加成
calculateMedianBonus(isBelowMedian, points) // 判斷是否加成

// 層 3：事件效果
checkTransitPenalty(schools, allocation)    // 交通不便
checkTeacherFlowPenalty(...)                // 教師流動
checkDigitalDeviceBonus(...)                // 數位設備
checkCommunityBonus(...)                    // 社區支持
calculateEventEffect(eventCard, ...)        // 統一事件效果計算

// 層 4：組合
calculateRoundScore(schools, allocation, eventCard)  // 完整回合分
updateTotalScore(current, roundScore)       // 累積更新
getResultFeedback(totalScore)               // 結果評語
```

**包含假資料**：MOCK_SCHOOLS, MOCK_EVENT, MOCK_ALLOCATION

---

### 2. `ruleCheck.js` - 規則驗證
驗證玩家輸入與資料完整性：

```javascript
// 分配驗證
validateAllocation(allocation)        // 驗證分配陣列
isAllocationComplete(allocation)      // 檢查是否已分配 3 點
canAddAllocation(allocation, idx, points)  // 檢查能否增加

// 狀態查詢
getRemainingPoints(allocation)        // 剩餘點數
getAllocationStatus(allocation)       // 狀態描述
canClickFinish(allocation)            // 是否可點 FINISH

// 整體驗證
canFinishRound(schools, allocation, eventCard)  // 回合結束前檢查
```

**包含測試案例**：TEST_CASES 物件

---

### 3. `resourceAction.js` - 分配操作邏輯
處理玩家的加點、減點、重置操作：

```javascript
// 操作函數
addPoint(allocation, schoolIndex)     // 加 1 點
removePoint(allocation, schoolIndex)  // 減 1 點
setAllocationForSchool(allocation, idx, newPoints)  // 直接設定
resetAllocation(allocation)           // 全部清除

// 狀態查詢
getAllocationForSchool(allocation, idx)  // 查詢某校分配
getTotalAllocated(allocation)        // 已分配總數
getAllocationInfo(allocation)        // 完整狀態資訊
```

**包含常用方案**：COMMON_ALLOCATIONS, 隨機生成函數

---

### 4. `scoreRule.test.js` - 單元測試
驗證所有計分邏輯是否正確：

**使用方式**：
```javascript
// 在瀏覽器 console 中
runAllTests()  // 會執行所有 30+ 個測試

// 或在 Node.js 中
import runAllTests from './scoreRule.test.js';
runAllTests();
```

**測試涵蓋**：
- ✅ 基礎分數計算（明顯下降、小幅下降、穩定或成長）
- ✅ 中位數加成邏輯
- ✅ 4 種事件卡效果
- ✅ 回合完整計分
- ✅ 累積總分管理
- ✅ 結果評語判定

---

## 🚀 使用流程

### Step 1：準備資料
```javascript
import { schoolData } from '../data-source/export/schoolData.js';
import { eventData } from '../data-source/export/eventData.js';

// 或使用假資料測試
import { MOCK_SCHOOLS, MOCK_EVENT, MOCK_ALLOCATION } from './scoreRule.js';
```

### Step 2：玩家進行分配
```javascript
import { addPoint, removePoint, getAllocationInfo } from './resourceAction.js';

let allocation = [0, 0, 0];

// 玩家按「+」按鈕增加第一校
let result = addPoint(allocation, 0);
if (result.success) {
  allocation = result.newAllocation;
  console.log(getAllocationInfo(allocation));
  // { allocated: 1, remaining: 2, isComplete: false, ... }
}
```

### Step 3：驗證是否可以結束回合
```javascript
import { canFinishRound } from './ruleCheck.js';

const validation = canFinishRound(schools, allocation, eventCard);
if (validation.valid) {
  console.log("可以點 FINISH");
} else {
  console.log("錯誤:", validation.errors);
}
```

### Step 4：計算本回合分數
```javascript
import { calculateRoundScore } from './scoreRule.js';

const roundScore = calculateRoundScore(schools, allocation, eventCard);
console.log("本回合得分:", roundScore);  // 例如 +7 分
```

### Step 5：更新累積總分
```javascript
import { updateTotalScore, getResultFeedback } from './scoreRule.js';

let totalScore = 10; // 起始分
totalScore = updateTotalScore(totalScore, roundScore);

// 第三回合後
const feedback = getResultFeedback(totalScore);
console.log(feedback);
// { level: "A", title: "資源調度成效良好", ... }
```

---

## 📊 資料流圖

```
E 提供資料
├─ schoolData.js (20+ 校)
└─ eventData.js (4 張卡)
        ↓
D 負責抽卡
├─ drawCard.js → 抽 3 校 + 1 卡
└─ 傳給 C
        ↓
C 負責分配 & 計分
├─ resourceAction.js ← 玩家操作（加減點）
├─ ruleCheck.js ← 驗證合法性
├─ scoreRule.js ← 計算分數
└─ 回傳分數給 A
        ↓
A 負責流程控制
└─ 回合管理、狀態更新、導向各頁
        ↓
B 負責顯示
└─ 本回合分、剩餘點、總分、評語
```

---

## ⚠️ 注意事項

### 資料格式
E 提供的資料使用 snake_case，使用時要記得：

```javascript
// E 提供格式
school.school_name        // 不是 schoolName
school.remote_area_level  // 不是 remoteLevel
school.change_category    // ✅ 正確
school.is_below_median    // ✅ 正確
```

### 數字型別
```javascript
// E 的 count_111 是字符串 "250"
parseInt(school.count_111)     // 轉為整數

// E 的 change_rate 也是字符串 "-8.2 "（有空格）
parseFloat(school.change_rate.trim())  // 轉為浮點數
```

### 分配驗證
**最重要**：分配總和必須恰好是 3，不能 < 3 也不能 > 3

```javascript
const allocation = [2, 1, 0];  // ✅ 3 點，合法
const allocation = [1, 1, 1];  // ✅ 3 點，合法
const allocation = [2, 1, 1];  // ❌ 4 點，違法（會被 canFinishRound 攔截）
const allocation = [2, 0, 0];  // ❌ 2 點，違法
```

---

## 📝 與其他成員的對接

### 與 E 的對接
- ✅ 資料格式已確認
- ☐ 等 E 提供正式資料後，改變 import 路徑

### 與 D 的對接
- ☐ D 需要呼叫 `calculateRoundScore()` 來計算本回合分
- ☐ D 需要用 `canFinishRound()` 檢查分配是否合法

### 與 A 的對接
- ☐ A 需要呼叫 C 的計分函數
- ☐ A 需要處理從 C 返回的「分數」與「狀態」

### 與 B 的對接
- ☐ B 需要監聽「分數更新」事件
- ☐ B 需要顯示 `getAllocationInfo()` 的「剩餘點數」資訊

---

## ✅ W1 (雛形) 檢查清單

根據 W1 要求，C 需要完成：

- [x] 建立分配操作區雛形 → resourceAction.js ✅
- [x] 建立假分數顯示邏輯 → scoreRule.js ✅
- [ ] 與 D 對接，確保可顯示假資料與假分數變化 ← 下一步
- [ ] 單元測試驗證邏輯 → scoreRule.test.js 準備好了

---

## 🧪 快速測試

在瀏覽器 console 中運行：

```javascript
// 1. 導入測試函數
import { runAllTests } from './scoreRule.test.js';

// 2. 執行所有測試
runAllTests();

// 預期輸出：所有測試都應該通過 ✅
```

或使用假資料快速測試：

```javascript
import { 
  MOCK_SCHOOLS, 
  MOCK_EVENT, 
  MOCK_ALLOCATION,
  calculateRoundScore,
  getResultFeedback 
} from './scoreRule.js';

// 計算一個完整的回合分
const roundScore = calculateRoundScore(MOCK_SCHOOLS, MOCK_ALLOCATION, MOCK_EVENT);
console.log("本回合分:", roundScore);  // 應該得到某個分數

// 模擬三回合
let totalScore = 10;
totalScore += roundScore;
totalScore += roundScore;
totalScore += roundScore;

const feedback = getResultFeedback(totalScore);
console.log("最終評語:", feedback);
```

---

## 🎨 DOM 結構規範 & 樣式

### HTML 結構
分配操作區的 HTML 結構應遵循以下規範（樣式已在 `resource-score.css` 中定義）：

```html
<section class="resource-allocation-section">
  <!-- 資訊列：剩餘點數 / 已用點數 / 事件卡 -->
  <div class="allocation-info-bar">
    <div class="info-item">
      <span class="info-label">剩餘點數</span>
      <span class="info-value remaining-points" id="remaining-points">3</span>
    </div>
    <div class="info-item">
      <span class="info-label">已用點數</span>
      <span class="info-value used-points" id="used-points">0 / 3</span>
    </div>
    <div class="info-item">
      <span class="info-label">事件卡</span>
      <div class="event-display" id="event-display">點擊展開</div>
    </div>
  </div>

  <!-- 三組資源控制器 -->
  <div class="allocation-controllers">
    <!-- 學校 1 -->
    <div class="allocation-controller">
      <div class="school-label" id="school-name-0">示意學校 1</div>
      <div class="allocation-control-group">
        <button class="allocation-btn allocation-btn--minus" data-school="0">−</button>
        <span class="allocation-points-display" id="school-points-0">0</span>
        <button class="allocation-btn allocation-btn--plus" data-school="0">+</button>
      </div>
      <div class="allocation-hint" id="school-hint-0"></div>
    </div>

    <!-- 學校 2 -->
    <div class="allocation-controller">
      <div class="school-label" id="school-name-1">示意學校 2</div>
      <div class="allocation-control-group">
        <button class="allocation-btn allocation-btn--minus" data-school="1">−</button>
        <span class="allocation-points-display" id="school-points-1">0</span>
        <button class="allocation-btn allocation-btn--plus" data-school="1">+</button>
      </div>
      <div class="allocation-hint" id="school-hint-1"></div>
    </div>

    <!-- 學校 3 -->
    <div class="allocation-controller">
      <div class="school-label" id="school-name-2">示意學校 3</div>
      <div class="allocation-control-group">
        <button class="allocation-btn allocation-btn--minus" data-school="2">−</button>
        <span class="allocation-points-display" id="school-points-2">0</span>
        <button class="allocation-btn allocation-btn--plus" data-school="2">+</button>
      </div>
      <div class="allocation-hint" id="school-hint-2"></div>
    </div>
  </div>

  <!-- 操作按鈕區 -->
  <div class="allocation-action-buttons">
    <button class="action-button action-button--reset" id="reset-btn">RESET</button>
    <button class="action-button action-button--finish" id="finish-btn" disabled>FINISH</button>
  </div>

  <!-- 狀態提示 -->
  <div class="allocation-status" id="allocation-status">
    請分配 3 點資源，然後點擊 FINISH
  </div>
</section>
```

### 樣式類別對照表

| 元素 | 類別 | 用途 |
|------|------|------|
| 主容器 | `.resource-allocation-section` | 整個分配區域 |
| 資訊列 | `.allocation-info-bar` | 剩餘點數、已用點數、事件卡 |
| 控制器組 | `.allocation-controllers` | 三個學校的控制器容器 |
| +/- 按鈕 | `.allocation-btn` | 加減點按鈕 |
| 點數顯示 | `.allocation-points-display` | 顯示某校的分配點數 |
| RESET 按鈕 | `.action-button--reset` | 重設分配 |
| FINISH 按鈕 | `.action-button--finish` | 完成分配 |

---

## 🔗 事件監聽器綁定指南

### 1. 選擇器參考
建議在某個初始化檔案中集中定義 DOM 選擇器，方便維護：

```javascript
// 例如在 shared/domRefs.js 中
export const allocationDomRefs = {
  // 按鈕
  minusBtns: document.querySelectorAll('.allocation-btn--minus'),
  plusBtns: document.querySelectorAll('.allocation-btn--plus'),
  resetBtn: document.getElementById('reset-btn'),
  finishBtn: document.getElementById('finish-btn'),

  // 顯示區域
  schoolNames: [
    document.getElementById('school-name-0'),
    document.getElementById('school-name-1'),
    document.getElementById('school-name-2')
  ],
  schoolPoints: [
    document.getElementById('school-points-0'),
    document.getElementById('school-points-1'),
    document.getElementById('school-points-2')
  ],
  schoolHints: [
    document.getElementById('school-hint-0'),
    document.getElementById('school-hint-1'),
    document.getElementById('school-hint-2')
  ],
  remainingPoints: document.getElementById('remaining-points'),
  usedPoints: document.getElementById('used-points'),
  allocationStatus: document.getElementById('allocation-status')
};
```

### 2. 事件監聽綁定示例

```javascript
import { addPoint, removePoint, resetAllocation, getAllocationInfo } from './resourceAction.js';
import { canFinishRound, isAllocationComplete } from './ruleCheck.js';
import { calculateRoundScore } from './scoreRule.js';
import { allocationDomRefs } from '../shared/domRefs.js';

// 初始化分配狀態
let currentAllocation = [0, 0, 0];
const schools = /* 從 D 的 drawCard.js 取得 */;
const eventCard = /* 從 D 的 drawCard.js 取得 */;

// ========== 加點按鈕 ==========
allocationDomRefs.plusBtns.forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    const result = addPoint(currentAllocation, idx);
    if (result.success) {
      currentAllocation = result.newAllocation;
      updateAllocationUI();
    }
  });
});

// ========== 減點按鈕 ==========
allocationDomRefs.minusBtns.forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    const result = removePoint(currentAllocation, idx);
    if (result.success) {
      currentAllocation = result.newAllocation;
      updateAllocationUI();
    }
  });
});

// ========== RESET 按鈕 ==========
allocationDomRefs.resetBtn.addEventListener('click', () => {
  currentAllocation = resetAllocation(currentAllocation);
  updateAllocationUI();
});

// ========== FINISH 按鈕 ==========
allocationDomRefs.finishBtn.addEventListener('click', () => {
  const validation = canFinishRound(schools, currentAllocation, eventCard);
  if (validation.valid) {
    // 計算本回合分數
    const roundScore = calculateRoundScore(schools, currentAllocation, eventCard);
    
    // 回傳給 A 或 B 進行後續處理
    window.dispatchEvent(new CustomEvent('allocation-finished', {
      detail: {
        allocation: currentAllocation,
        roundScore: roundScore
      }
    }));
  } else {
    // 顯示錯誤提示
    console.warn("無法完成分配:", validation.errors);
  }
});

// ========== UI 更新函數 ==========
function updateAllocationUI() {
  const info = getAllocationInfo(currentAllocation);

  // 更新各校的點數顯示
  currentAllocation.forEach((points, idx) => {
    allocationDomRefs.schoolPoints[idx].textContent = points;
  });

  // 更新剩餘點數和已用點數
  allocationDomRefs.remainingPoints.textContent = info.remaining;
  allocationDomRefs.usedPoints.textContent = `${info.allocated} / 3`;

  // 更新狀態message與按鈕狀態
  if (info.isComplete) {
    allocationDomRefs.allocationStatus.textContent = '✓ 分配完成，可點擊 FINISH';
    allocationDomRefs.allocationStatus.classList.remove('allocation-status--incomplete');
    allocationDomRefs.allocationStatus.classList.add('allocation-status--complete');
    allocationDomRefs.finishBtn.disabled = false;
  } else {
    allocationDomRefs.allocationStatus.textContent = `請再分配 ${info.remaining} 點資源`;
    allocationDomRefs.allocationStatus.classList.add('allocation-status--incomplete');
    allocationDomRefs.allocationStatus.classList.remove('allocation-status--complete');
    allocationDomRefs.finishBtn.disabled = true;
  }
}

// 初始化 UI
updateAllocationUI();
```

### 3. 與其他模組的事件通信

```javascript
// C 發出事件給 A（頁面控制）
window.addEventListener('allocation-finished', (event) => {
  const { allocation, roundScore } = event.detail;
  // A 接收後進行回合狀態更新
});

// B 監聽分配變化來顯示提示文字
window.addEventListener('allocation-updated', (event) => {
  const { remaining, status } = event.detail;
  // B 更新提示文字
});
```

---

## 📚 下一步工作

1. **立即做**：
   - ✅ 三個檔案已建立
   - ☐ 執行 `runAllTests()` 驗證邏輯
   - ☐ 與 E 確認最終資料格式是否需要調整

2. **本週做**：
   - ☐ 與 D 對接，測試真實資料的計分流程
   - ☐ 寫假資料測試頁面（整合 B/D 的展示）

3. **下週做 (W2)**：
   - ☐ 與 A 對接完整流程
   - ☐ 處理邊界情況 (例如：事件卡多條件同時觸發)
   - ☐ 性能與邏輯最終驗證

---

**祝你開發順利！🚀**

有任何問題，隨時問我！
