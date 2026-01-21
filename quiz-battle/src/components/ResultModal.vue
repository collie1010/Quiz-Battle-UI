<template>
    <div class="modal-overlay">
      <div class="modal-content" :class="resultStatus.toLowerCase()">
        <!-- ⭐ 標題文字與顏色根據結果動態改變 -->
        <h2 class="result-title" :class="resultStatus.toLowerCase()">
          {{ resultText }}
        </h2>
        
        <div class="score-board">
          <!-- 我的分數 -->
          <div class="player-result me">
            <div class="name">{{ myName || '我' }}</div>
            <div class="score">{{ myScore }}</div>
          </div>
  
          <div class="divider">VS</div>
  
          <!-- 對手分數 -->
          <div class="player-result enemy">
            <div class="name">{{ enemyName || '對手' }}</div>
            <div class="score">{{ enemyScore }}</div>
          </div>
        </div>
  
        <div class="footer">
          <button class="restart-btn" @click="$emit('restart')">再來一局</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    myScore: Number,
    enemyScore: Number,
    myName: String,
    enemyName: String
  })
  
  defineEmits(['restart'])
  
  // ⭐ 計算比賽結果狀態：'WIN' | 'LOSE' | 'DRAW'
  const resultStatus = computed(() => {
    if (props.myScore > props.enemyScore) return 'WIN'
    if (props.myScore < props.enemyScore) return 'LOSE'
    return 'DRAW'
  })
  
  // ⭐ 根據狀態顯示對應文字
  const resultText = computed(() => {
    switch (resultStatus.value) {
      case 'WIN': return '🏆 勝利！'
      case 'LOSE': return '😢 惜敗...'
      case 'DRAW': return '🤝 平手！' // 平手文字
      default: return ''
    }
  })
  </script>
  
  <style scoped>
  /* ... modal-overlay 保持不變 ... */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
  }
  
  .modal-content {
    background: linear-gradient(135deg, #2c3e50, #000000);
    border: 2px solid #f1c40f; /* 預設金色 */
    border-radius: 20px;
    padding: 40px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 0 30px rgba(241, 196, 15, 0.3);
    transition: all 0.3s ease;
  }
  
  /* --- ⭐ 針對不同結果的邊框與標題顏色 --- */
  
  /* 勝利 (金色) */
  .modal-content.win {
    border-color: #f1c40f;
    box-shadow: 0 0 30px rgba(241, 196, 15, 0.4);
  }
  .result-title.win {
    color: #f1c40f;
  }
  
  /* 失敗 (紅色/灰色) */
  .modal-content.lose {
    border-color: #e74c3c;
    box-shadow: 0 0 30px rgba(231, 76, 60, 0.4);
  }
  .result-title.lose {
    color: #e74c3c;
  }
  
  /* 平手 (電光藍/銀白色) - 勢均力敵的感覺 */
  .modal-content.draw {
    border-color: #00f2fe;
    box-shadow: 0 0 30px rgba(0, 242, 254, 0.4);
  }
  .result-title.draw {
    color: #00f2fe; /* 電光藍 */
    text-shadow: 0 0 10px rgba(0, 242, 254, 0.8);
  }
  
  /* --- 通用樣式保持不變 --- */
  .result-title {
    font-size: 2.5rem;
    margin: 0 0 30px 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    font-weight: 900;
  }
  
  .score-board {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .player-result {
    flex: 1;
  }
  
  .name {
    font-size: 1.4rem;
    color: #ffffff;
    margin-bottom: 10px;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }
  
  .score {
    font-size: 2.5rem;
    font-weight: 900;
    color: white;
  }
  
  .me .score { color: #4facfe; }
  .enemy .score { color: #e74c3c; }
  
  .divider {
    font-size: 1.5rem;
    font-weight: bold;
    color: #666;
    margin: 0 15px;
  }
  
  .restart-btn {
    background: linear-gradient(to bottom, #f1c40f, #f39c12);
    border: none;
    padding: 15px 30px;
    font-size: 1.2rem;
    font-weight: bold;
    color: black;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 5px 15px rgba(243, 156, 18, 0.4);
    transition: transform 0.2s;
  }
  
  .restart-btn:active {
    transform: scale(0.95);
  }
  </style>
  