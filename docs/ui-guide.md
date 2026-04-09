# UI Guide

## Overview

本版面直接對齊兩張參考圖的低保真配置，不做額外裝飾性設計。重點是保留清楚的大標題、深色功能按鈕、藍色外框，以及遊戲頁「上方資訊列 + 中段資源操作 + 下方三張學校卡 + 右側行動鍵」的結構。

## Home Screen

- 主畫面採單一置中區塊。
- `h1` 使用超大粗體，維持首頁第一視覺焦點。
- 副標置於主標下方，字色比主標更淡。
- `START` 與 `RULES` 以垂直堆疊的大型深色按鈕呈現。
- 整體畫面保留大量留白，避免分散注意力。

## Game Screen

- 頂部列左側放遊戲名稱，右側放 `ROUND 1/3` 狀態框。
- 第二列分成三區：左側 `POINTS`、中央 `USED: 0 / 3`、右側 `EVENT` 下拉按鈕。
- 第三列為三組資源控制器，每組都維持 `- 0 +` 的水平排列。
- 主內容區左側是三張等寬學校卡，右側是 `RESET` 與 `FINISH` 兩顆垂直按鈕。
- 學校卡保留標題列與內文區，作為後續學校資料與效果欄位的容器。

## Style Rules

- 全頁背景使用白底加極淡藍灰底色。
- 每個主要畫面容器都加藍色外框，對應參考圖的畫面邊界。
- 文字與按鈕主色統一使用深藍灰。
- 邊框、卡片與分隔線維持筆直、扁平、低保真，不加入圓潤玻璃感或漸層按鈕。

## Responsive Notes

- 小螢幕下遊戲頁會改為單欄堆疊。
- 右側 `RESET` / `FINISH` 會移到學校卡下方。
- 三張學校卡與三組資源控制器在窄版時改為直向排列。
- 首頁兩顆主按鈕在手機寬度下改成滿版。

## File Scope

- [`/Users/lin/education-statistics-boardgame/index.html`](/Users/lin/education-statistics-boardgame/index.html)
  目前同時放首頁與遊戲頁的版面參考。
- [`/Users/lin/education-statistics-boardgame/assets/styles/base/reset.css`](/Users/lin/education-statistics-boardgame/assets/styles/base/reset.css)
  提供基本 reset。
- [`/Users/lin/education-statistics-boardgame/assets/styles/base/base.css`](/Users/lin/education-statistics-boardgame/assets/styles/base/base.css)
  定義色彩、字型與共用按鈕基礎。
- [`/Users/lin/education-statistics-boardgame/assets/styles/base/layout.css`](/Users/lin/education-statistics-boardgame/assets/styles/base/layout.css)
  定義首頁與遊戲頁的主要版面。
- [`/Users/lin/education-statistics-boardgame/assets/styles/screen-ui-structure/skeleton.css`](/Users/lin/education-statistics-boardgame/assets/styles/screen-ui-structure/skeleton.css)
  補上外框、卡片邊線與 RWD 行為。
