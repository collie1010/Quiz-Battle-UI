<template>
  <div class="container">
    
    <!-- 1. 大廳狀態 -->
    <div v-if="gameState === 'LOBBY'" class="lobby-container">
      <div class="lobby-content">
        <h1 class="game-title">華語知識王爭霸 🏆</h1>
        
        <div class="input-group">
          <input 
            v-model="inputName" 
            placeholder="請輸入你的暱稱" 
            class="game-input" 
            @keyup.enter="handleMatch"
          />
        </div>

        <button 
          class="game-btn start-btn" 
          @click="handleMatch" 
          :disabled="!inputName"
        >
          <span class="btn-text">🔍 開始配對</span>
        </button>
      </div>
    </div>

    <!-- 2. 等待配對中 -->
    <div v-else-if="gameState === 'WAITING'" class="waiting-container">
      <div class="waiting-content">
        <h2>正在尋找對手...</h2>
        <div class="loader"></div>
        <p>請稍候，即將開始</p>
      </div>
    </div>

    <!-- 3. 遊戲進行中 -->
    <div v-else-if="gameState === 'PLAYING'" class="game-board">

      <!-- 頂部資訊列 (題數、倒數計時) -->
      <div class="top-bar">
        <div class="progress-pill">
          第 {{ questionIndex + 1 }} / {{ totalQuestions }} 題
        </div>
        <!-- 計時條移到這裡，橫跨中間 -->
        <div class="timer-wrapper-center">
          <TimerBar 
            :key="currentQuestion?.index" 
            :timeLeft="timeLeft" 
            :duration="8" />
        </div>
      </div>

      <!-- ⭐ 核心戰場區域 (左 - 中 - 右) -->
      <div class="battle-field">
        
        <!-- 左側：自己 -->
        <div class="side-column left">
          <PlayerPanel 
            :name="playerInfo.playerId" 
            :score="myScore" 
            :answered="isMyTurnAnswered" 
            :isTimeout="isTimeout" 
            :isSelf="true" 
          />
        </div>

        <!-- 中間：題目與選項 -->
        <div class="center-column">
          <QuestionCard
            v-if="currentQuestion"
            :question="currentQuestion"
            :locked="isMyTurnAnswered"
            :mySelectedAnswer="mySelectedAnswer" 
            :correctAnswer="correctAnswer"
            @answer="onAnswer"
          />
        </div>

        <!-- 右側：對手 -->
        <div class="side-column right">
          <PlayerPanel 
            :name="enemyId" 
            :score="enemyScore" 
            :answered="false" 
            :isSelf="false" 
          />
        </div>

      </div>
      </div>

    <!-- 4. 結算畫面 -->
    <div v-if="gameState === 'FINISHED'" class="result-view">
      <ResultModal 
        :myScore="myScore"
        :enemyScore="enemyScore"
        :myName="playerInfo.playerId"
        :enemyName="enemyId"
        @restart="handleRestart" 
      />
    </div>

  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useBattleGame } from './composables/useBattleGame'
import { useTimer } from './composables/useTimer'

// Components
import PlayerPanel from './components/PlayerPanel.vue'
import TimerBar from './components/TimerBar.vue'
import QuestionCard from './components/QuestionCard.vue'
import ResultModal from './components/ResultModal.vue'

const {
  gameState,
  playerInfo,
  currentQuestion,
  questionIndex,
  totalQuestions,
  myScore,
  enemyScore,
  enemyId,
  isTimeout, 
  isMyTurnAnswered,
  mySelectedAnswer, // 記得解構出來
  correctAnswer,    // 記得解構出來
  findMatch,
  resetGame,
  submitAnswer
} = useBattleGame()

const { timeLeft, start } = useTimer(8)

// 表單資料
const inputName = ref('')

// 開始配對
const handleMatch = () => {
  if (!inputName.value) return
  findMatch(inputName.value)
}

// 監聽題目變更，重置計時器
watch(currentQuestion, (newVal) => {
  if (newVal) {
    start(() => {
      // 時間到自動送出空答案
      if (!isMyTurnAnswered.value) {
        // 這裡可以選擇自動送出一個錯誤答案，或者讓後端處理超時
        // 為了 UI 狀態一致，建議前端也標記已作答
        isMyTurnAnswered.value = true
        isTimeout.value = true 
      }
    })
  }
})

const onAnswer = (key) => {
  submitAnswer(key)
}

// 處理重新開始
const handleRestart = () => {
  resetGame() 
}
</script>

<style>
/* 全域設定 */
body {
  margin: 0;
  padding: 0;
  background: radial-gradient(circle at 50% 30%, #4b134f 0%, #190a23 80%);
  background-attachment: fixed;
  font-family: 'Segoe UI', 'Microsoft JhengHei', sans-serif;
  color: white;
  min-height: 100vh;
  overflow-x: hidden;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* --- 大廳樣式 --- */
.lobby-container, .waiting-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.game-title {
  font-size: 2.5rem;
  color: #f1c40f;
  text-shadow: 0 4px 10px rgba(0,0,0,0.5);
  margin-bottom: 40px;
  text-align: center;
  font-style: italic;
}

.game-input {
  width: 100%;
  padding: 15px;
  font-size: 1.2rem;
  border: 2px solid #4facfe;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border-radius: 12px;
  text-align: center;
  outline: none;
  margin-bottom: 20px;
  transition: all 0.3s;
}

.game-input:focus {
  border-color: #f1c40f;
  box-shadow: 0 0 15px rgba(241, 196, 15, 0.3);
}

.game-btn {
  padding: 15px 40px;
  font-size: 1.3rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  background: linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%);
  color: white;
  font-weight: bold;
  box-shadow: 0 5px 15px rgba(0, 242, 254, 0.4);
  transition: transform 0.2s;
}

.game-btn:active {
  transform: scale(0.95);
}

.game-btn:disabled {
  background: #7f8c8d;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.7;
}

/* --- 遊戲畫面佈局 --- */
.game-board {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 10px; /* 減少邊距以爭取空間 */
  box-sizing: border-box;
  overflow: hidden; /* 防止捲動 */
}

/* 頂部資訊列 */
.top-bar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 5px; /* 稍微縮小間距 */
  position: relative;
  z-index: 20; /* 確保計時器在最上層 */
}

.top-section {
  /* 上方區域：包含進度、玩家、計時 */
  flex-shrink: 0; /* 防止被壓縮 */
}

.progress-pill {
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #ddd;
  margin: 0 auto 15px auto;
  width: fit-content;
  backdrop-filter: blur(5px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  padding: 0 10px;
}

.timer-wrapper-center {
  margin-top: 5px;
  /* 增加一點發光背景，讓計時器更突出 */
  background: radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 70%);
  border-radius: 50%;
  padding: 5px;
  margin-bottom: 5px;
}

/* ⭐ 核心戰場 (Flex Row) */
.battle-field {
  flex-grow: 1;
  display: flex;
  flex-direction: row; /* 水平排列 */
  justify-content: space-between;
  align-items: center; /* 垂直置中 */
  width: 100%;
  position: relative;
}

/* 兩側欄位 */
.side-column {
  flex-shrink: 0; /* 防止被壓縮 */
  width: 60px;    /* 固定寬度，給中間留空間 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

/* 中間欄位 */
.center-column {
  flex-grow: 1; /* 佔據剩餘空間 */
  margin: 0 10px; /* 與兩側保持距離 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 400px; /* 限制最大寬度，避免在大螢幕太寬 */
}

.vs {
  font-family: 'Arial Black', sans-serif;
  font-size: 2.5rem;
  color: #e74c3c;
  text-shadow: 2px 2px 0px #fff, 0 0 10px rgba(231, 76, 60, 0.8);
  font-style: italic;
  transform: skew(-10deg);
}

.game-content {
  /* ⭐ 核心：讓題目區佔據剩餘空間，並往下推 */
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直置中 */
  padding-top: 20px;       /* 稍微再往下推一點 */
  padding-bottom: 40px;    /* 底部留白 */
}

/* --- 等待與讀取 --- */
.loader {
  border: 5px solid rgba(255, 255, 255, 0.1);
  border-top: 5px solid #f1c40f;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
