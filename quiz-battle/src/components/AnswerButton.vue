<template>
  <button
    class="game-btn"
    :class="statusClass"
    :disabled="disabled"
    @click="handleClick"
  >
    <div class="btn-content">
      <span class="option-badge">{{ value }}</span>
      <span class="option-text">{{ label }}</span>
    </div>
    <!-- 光澤層 -->
    <div class="shine"></div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: String,
  disabled: Boolean,
  myChoice: String,
  correctAnswer: String
})

const emit = defineEmits(['select'])

const handleClick = () => {
  if (!props.disabled) {
    emit('select', props.value)
  }
}

// ⭐ 核心邏輯：決定按鈕的顏色狀態
const statusClass = computed(() => {
  // 1. 還沒公佈正確答案前 (correctAnswer 為 null)
  if (!props.correctAnswer) {
    // 如果我選了這個，顯示黃色 (status-selected)
    return props.myChoice === props.value ? 'status-selected' : 'status-normal'
  }

  // --- 以下是作答後 (correctAnswer 有值了) ---

  // 2. 這個選項是「正確答案」 -> 永遠變綠色 (status-correct)
  // (無論我有沒有選它，正確答案都要亮起來)
  if (props.value === props.correctAnswer) {
    return 'status-correct'
  }

  // 3. 這個選項是「我選的」且「它是錯的」 -> 變紅色 (status-wrong)
  if (props.myChoice === props.value && props.value !== props.correctAnswer) {
    return 'status-wrong'
  }

  // 4. 其他無關選項 -> 變暗/灰色 (status-dimmed)
  return 'status-dimmed'
})
</script>

<style scoped>
/* --- 基礎按鈕結構 --- */
.game-btn {
  position: relative;
  width: 100%;
  margin-bottom: 12px;
  padding: 16px 20px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.1s;
  outline: none;
  overflow: hidden;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  transform: translateY(0);
  
  /* 預設背景 (防止沒吃到狀態時全白) */
  background-color: #7f8c8d; 
}

.game-btn:active:not(:disabled) {
  transform: translateY(4px);
}

.btn-content {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.option-badge {
  background: rgba(255, 255, 255, 0.2);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: 900;
}

.option-text {
  flex: 1;
  text-align: left;
}

.shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 16px 16px 50% 50% / 16px 16px 20% 20%;
  pointer-events: none;
}

/* --- ⭐ 狀態配色 (請確保這裡的 class 名稱跟 script 裡的一樣) --- */

/* 1. 一般狀態 (藍色) */
.status-normal {
  background: linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%);
  background-color: #4facfe;
  box-shadow: 0 6px 0 #2c80b4;
}

/* 2. 選取中 (黃色) */
.status-selected {
  background: linear-gradient(to bottom, #f1c40f 0%, #f39c12 100%);
  background-color: #f1c40f;
  box-shadow: 0 6px 0 #d35400;
  transform: translateY(2px);
}

/* 3. 正確 (綠色) - 使用 !important 確保覆蓋 */
.status-correct {
  background: linear-gradient(to bottom, #2ecc71 0%, #27ae60 100%) !important;
  background-color: #2ecc71 !important;
  box-shadow: 0 6px 0 #1e8449 !important;
  color: white !important;
}

/* 4. 錯誤 (紅色) - 使用 !important 確保覆蓋 */
.status-wrong {
  background: linear-gradient(to bottom, #e74c3c 0%, #c0392b 100%) !important;
  background-color: #e74c3c !important;
  box-shadow: 0 6px 0 #922b21 !important;
  color: white !important;
  animation: shake 0.4s;
}

/* 5. 變暗 (灰色) */
.status-dimmed {
  background: #95a5a6 !important;
  box-shadow: 0 4px 0 #7f8c8d !important;
  opacity: 0.6;
  transform: scale(0.98);
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
