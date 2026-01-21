<template>
    <div class="player-panel" :class="{ 'is-self': isSelf, 'is-enemy': !isSelf }">
      
      <!-- 1. 分數顯示 (在長方形上方) -->
      <div class="score-display">
        <span class="score-number">{{ score }}</span>
      </div>
  
      <!-- 2. 長方形能量條 -->
      <div class="bar-container">
        <!-- 填充層：高度根據分數動態改變 -->
        <div class="bar-fill" :style="{ height: fillPercent + '%' }">
          <!-- 頂部光暈效果 -->
          <div class="bar-glow"></div>
        </div>
      </div>
  
      <!-- 3. 玩家名稱與狀態 -->
      <div class="info-area">
        <div class="name-tag">{{ name }}</div>
        
        <!-- 已作答標記 (像知識王一樣，作答後亮燈或顯示圖示) -->
        <div class="status-indicator" 
            :class="{ 'active': answered,
                    'status-timeout': isTimeout 
            }">
            {{ statusText }}
        </div>
      </div>
  
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    name: String,
    score: Number,
    answered: Boolean,
    isSelf: Boolean, // ⭐ 新增：用來判斷是自己還是對手，決定顏色
    isTimeout: Boolean
  })
  
  // 計算高度百分比
  // 假設滿分大約是 2400 分 (8題 * 300分)，可根據實際遊戲平衡調整
  const MAX_SCORE = 3000 
  
  const fillPercent = computed(() => {
    const percent = (props.score / MAX_SCORE) * 100
    return Math.min(percent, 100) // 最高不超過 100%
  })

  const statusText = computed(() => {
    if (props.isTimeout) return '⌛ 超時'
    if (props.answered) return '✅ 已作答'
    return 'Thinking...'
  })
  </script>
  
  <style scoped>
  .player-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; /* 跟隨父容器寬度 */
    position: relative;
  }
  
  /* --- 分數數字 --- */
  .score-display {
    margin-bottom: 8px;
    height: 30px; /* 預留高度避免跳動 */
  }
  
  .score-number {
    font-family: 'Impact', sans-serif; /* 強烈的字體 */
    font-size: 1.8rem;
    font-weight: bold;
    text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
    letter-spacing: 1px;
  }
  
  /* 長方形容器 */
.bar-container {
  width: 30px;   /* ⭐ 變瘦：從 40px 改為 30px */
  height: 250px; /* ⭐ 變高：拉長視覺效果，適應側邊 */
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column-reverse;
}
  
  /* --- 填充層 (水位) --- */
  .bar-fill {
    width: 100%;
    /* 高度由 inline-style 控制 */
    transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1); /* 流暢上升動畫 */
    position: relative;
    min-height: 0px;
  }
  
  .bar-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.5);
  }
  
  /* --- 資訊區 --- */
  .info-area {
    margin-top: 10px;
    text-align: center;
  }
  
  .name-tag {
  font-weight: bold;
  color: white;
  font-size: 0.8rem; /* 縮小字體以防換行 */
  margin-bottom: 4px;
  text-shadow: 0 1px 2px black;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 55px; /* 限制寬度 */
  display: block;
}
  
  .status-indicator {
    font-size: 0.8rem;
    color: #7f8c8d;
    opacity: 0; /* 預設隱藏 */
    transition: opacity 0.3s;
    background: rgba(0,0,0,0.5);
    padding: 2px 12px;
    border-radius: 4px;
  }
  
  .status-indicator.active {
    opacity: 1; /* 作答後顯示 */
    color: #f1c40f; /* 黃色亮燈 */
    font-weight: bold;
  }

  /* ⭐ 新增：超時樣式 (紅色或灰色) */
  .status-indicator.status-timeout {
    color: #e74c3c; /* 紅色 */
    border: 3px solid #e74c3c;
  }
  
  /* --- 顏色主題：自己 (藍色系) --- */
  .is-self .score-number { color: #4facfe; }
  .is-self .bar-container { border-color: #4facfe; }
  .is-self .bar-fill {
    background: linear-gradient(to top, #0052d4, #4364f7, #6fb1fc);
    box-shadow: 0 0 15px #4facfe;
  }
  
  /* --- 顏色主題：對手 (紅色系) --- */
  .is-enemy .score-number { color: #ff6b6b; }
  .is-enemy .bar-container { border-color: #ff6b6b; }
  .is-enemy .bar-fill {
    background: linear-gradient(to top, #870000, #dc281e, #ff6b6b);
    box-shadow: 0 0 15px #ff6b6b;
  }
  </style>
  