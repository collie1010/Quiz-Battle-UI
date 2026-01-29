<template>
  <div class="modal-overlay">
    <div class="modal-content" :class="resultStatus.toLowerCase()">
      
      <!-- 1. 結果標題 -->
      <h2 class="result-title" :class="resultStatus.toLowerCase()">
        {{ resultText }}
      </h2>

      <!-- ⭐ 2. 特殊訊息區塊 (例如：對手斷線) -->
      <!-- 只有當有 message 且是勝利狀態時顯示，讓玩家知道贏的原因 -->
      <div v-if="message && resultStatus === 'WIN'" class="reason-banner">
        ⚠️ {{ message }}
      </div>
      
      <div class="score-board">
        <!-- 我的分數 -->
        <div class="player-result me">
          <div class="name">
            {{ myName || '我' }}
            <span v-if="resultStatus === 'WIN'" class="crown-icon">👑</span>
          </div>
          <div class="score">{{ myScore }}</div>
        </div>

        <div class="divider">VS</div>

        <!-- 對手分數 -->
        <div class="player-result enemy">
          <div class="name">
            {{ enemyName || '對手' }}
            <!-- 如果對手斷線導致我贏，可以在對手名字旁標記 -->
            <span v-if="message && resultStatus === 'WIN'" class="disconnect-tag">(斷線)</span>
          </div>
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
  enemyName: String,
  myId: String,
  winnerId: String,
  message: String // ⭐ 新增：接收後端的結束訊息
})

defineEmits(['restart'])

// 計算比賽結果狀態：'WIN' | 'LOSE' | 'DRAW'
const resultStatus = computed(() => {
  // 1. 優先判定 winnerId (包含斷線判勝的情況)
  if (props.winnerId) {
    if (props.winnerId === props.myId) return 'WIN'
    return 'LOSE'
  }

  // 2. 如果沒有 winnerId (舊邏輯或平手)，才比分數
  if (props.myScore > props.enemyScore) return 'WIN'
  if (props.myScore < props.enemyScore) return 'LOSE'
  return 'DRAW'
})

// 根據狀態顯示對應文字
const resultText = computed(() => {
  switch (resultStatus.value) {
    case 'WIN': return '🏆 勝利！'
    case 'LOSE': return '😢 惜敗...'
    case 'DRAW': return '🤝 平手！'
    default: return ''
  }
})
</script>

<style scoped>
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
  border: 2px solid #f1c40f;
  border-radius: 20px;
  padding: 40px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 0 30px rgba(241, 196, 15, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* --- 結果狀態樣式 --- */
.modal-content.win {
  border-color: #f1c40f;
  box-shadow: 0 0 40px rgba(241, 196, 15, 0.5);
}
.result-title.win { color: #f1c40f; }

.modal-content.lose {
  border-color: #e74c3c;
  box-shadow: 0 0 30px rgba(231, 76, 60, 0.4);
}
.result-title.lose { color: #e74c3c; }

.modal-content.draw {
  border-color: #00f2fe;
  box-shadow: 0 0 30px rgba(0, 242, 254, 0.4);
}
.result-title.draw {
  color: #00f2fe;
  text-shadow: 0 0 10px rgba(0, 242, 254, 0.8);
}

/* --- ⭐ 新增：斷線訊息 Banner --- */
.reason-banner {
  background: rgba(241, 196, 15, 0.2);
  color: #f1c40f;
  padding: 8px 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 1rem;
  font-weight: bold;
  border: 1px solid rgba(241, 196, 15, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.disconnect-tag {
  font-size: 0.8rem;
  color: #e74c3c;
  margin-left: 5px;
  vertical-align: middle;
}

/* --- 通用樣式 --- */
.result-title {
  font-size: 2.5rem;
  margin: 0 0 20px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  font-weight: 900;
}

.score-board {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 10px;
}

.player-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.name {
  font-size: 1.2rem;
  color: #ffffff;
  margin-bottom: 5px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  white-space: nowrap;
}

.score {
  font-size: 2.2rem;
  font-weight: 900;
  color: white;
}

.me .score { color: #4facfe; }
.enemy .score { color: #e74c3c; }

.divider {
  font-size: 1.5rem;
  font-weight: bold;
  color: #666;
  margin: 0 10px;
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

.crown-icon {
  margin-left: 5px;
  font-size: 1.2rem;
}
</style>
