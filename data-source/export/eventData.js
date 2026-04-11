export const eventData = [
  {
    id: "e1",
    title: "交通不便加劇",
    description: "特偏或極偏學校若未獲資源，本回合 -2 分",
    trigger_type: "level_match", 
    target_level: ["特偏", "極偏"],
    penalty: -2
  },
  {
    id: "e2",
    title: "教師流動增加",
    description: "明顯下降學校若未獲資源，本回合 -2 分",
    trigger_type: "category_match",
    target_category: "明顯下降",
    penalty: -2
  },
  {
    id: "e3",
    title: "數位設備補助到位",
    description: "本回合有獲得資源之學校其學生規模變動率低於整體中位，總分 +1",
    trigger_type: "median_bonus",
    bonus: 1
  },
  {
    id: "e4",
    title: "地方社區支持活動",
    description: "若本回合資源有分配給變動率為負值的學校，總分 +1",
    trigger_type: "negative_rate_bonus",
    bonus: 1
  }
];