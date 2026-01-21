<template>
    <div class="timer-wrapper">
      <svg class="timer-svg" viewBox="0 0 100 100">
        <!-- 背景圓環 (灰色底) -->
        <circle
          class="timer-bg"
          cx="50" cy="50" r="45"
        />
        
        <!-- 進度圓環 (彩色動態) -->
        <circle
          class="timer-progress"
          :stroke="currentColor"
          cx="50" cy="50" r="45"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
  
      <!-- 中央數字 -->
      <div class="timer-text" :class="{ 'urgent': isUrgent }">
        {{ displayTime }}
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    timeLeft: Number,
    duration: Number
  })
  
  // SVG 圓形參數
  const radius = 45
  const circumference = 2 * Math.PI * radius // 圓周長
  
  // 計算進度條偏移量 (控制圓環長度)
  const dashOffset = computed(() => {
    const progress = props.timeLeft / props.duration
    // 注意：SVG stroke-dashoffset 是反向的，0 是滿，circumference 是空
    return circumference * (1 - progress)
  })
  
  // 顯示整數秒數 (無條件進位)
  const displayTime = computed(() => {
    return Math.ceil(props.timeLeft)
  })
  
  // 判斷是否緊急 (剩餘 3 秒內)
  const isUrgent = computed(() => props.timeLeft <= 3)
  
  // 動態顏色計算
  const currentColor = computed(() => {
    const percentage = props.timeLeft / props.duration
    
    if (percentage > 0.5) return '#2ecc71' // 綠色 (安全)
    if (percentage > 0.25) return '#f1c40f' // 黃色 (警告)
    return '#e74c3c' // 紅色 (緊急)
  })
  </script>
  
  <style scoped>
  .timer-wrapper {
    position: relative;
    width: 120px;  /* 圓形大小 */
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: center;

    /* ⭐ 新增：深色背景與陰影，讓它能蓋住下方的線條 */
    background: #1a1a2e; /* 與題目卡背景接近的深色 */
    border-radius: 50%;
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    z-index: 20; /* 確保層級最高 */
  }
  
  .timer-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg); /* 讓起點從正上方開始 */
  }
  
  circle {
    fill: none;
    stroke-width: 7; /* 圓環粗細 */
    stroke-linecap: round; /* 圓頭端點 */
  }
  
  .timer-bg {
    stroke: rgba(255, 255, 255, 0.1);
  }
  
  .timer-progress {
    transition: stroke-dashoffset 0.1s linear, stroke 0.3s ease;
    filter: drop-shadow(0 0 8px rgba(0,0,0,0.5)); /* 發光效果 */
  }
  
  .timer-text {
    position: absolute;
    font-family: 'Impact', sans-serif;
    font-size: 3.5rem;
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }
  
  /* 緊急狀態下的文字動畫 */
  .timer-text.urgent {
    color: #e74c3c;
    animation: pulse 0.5s infinite alternate;
  }
  
  @keyframes pulse {
    from { transform: scale(1); }
    to { transform: scale(1.2); }
  }
  </style>
  