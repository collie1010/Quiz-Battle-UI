<template>
  <div v-if="question" class="question-container">
    <!-- 題目卡片 -->
    <div class="question-board">
      <h2 class="question-text">{{ question.question }}</h2>
    </div>

    <!-- 選項區域 -->
    <div class="options-grid">
      <AnswerButton
        v-for="option in getOptions()"
        :key="option.key"
        :label="option.text" 
        :value="option.key"
        :disabled="locked"
        :my-choice="mySelectedAnswer" 
        :correct-answer="correctAnswer"
        @select="$emit('answer', option.key)"
      />
      <!-- 注意：這裡假設父層傳入了 mySelectedAnswer 和 correctAnswer -->
      <!-- 如果父層還沒傳，請記得在 App.vue 補上 -->
    </div>
  </div>
</template>

<script setup>
import AnswerButton from './AnswerButton.vue'

// 接收父層傳來的狀態，這樣 AnswerButton 才能變色
const props = defineProps({
  question: Object,
  locked: Boolean,
  mySelectedAnswer: String, // 新增
  correctAnswer: String,    // 新增
  gameFinished: Boolean     // 新增：遊戲是否已結束
})


  // 處理不同格式的選項屬性名稱，並清理編號前綴
  const getOptions = () => {
    if (!props.question) return []

    const options = []

    // 優先檢查是否有 options 陣列
    if (props.question.options && Array.isArray(props.question.options)) {
      for (let i = 0; i < props.question.options.length && i < 4; i++) {
        const upperKey = String.fromCharCode(65 + i) // 'A', 'B', 'C', 'D'
        let text = props.question.options[i]

        if (text) {
          // 清理編號前綴（如 "3. "），只保留實際選項內容
          text = text.replace(/^\d+\.\s*/, '')
          options.push({
            key: upperKey,
            text: text
          })
        }
      }
    } else {
      // 回退到舊格式：檢查 A, B, C, D 屬性
      for (let i = 0; i < 4; i++) {
        const upperKey = String.fromCharCode(65 + i) // 'A', 'B', 'C', 'D'
        const lowerKey = String.fromCharCode(97 + i) // 'a', 'b', 'c', 'd'

        // 優先使用大寫屬性，如果沒有則使用小寫屬性
        let text = props.question[upperKey] || props.question[lowerKey]

        if (text) {
          // 清理編號前綴（如 "3. "），只保留實際選項內容
          text = text.replace(/^\d+\.\s*/, '')
          options.push({
            key: upperKey,
            text: text
          })
        }
      }
    }

    return options
  }
  </script>
<style scoped>
  .question-container {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    perspective: 1000px; /* 增加 3D 視角 */
  }
  
  /* 題目顯示板 - 模擬電視螢幕 */
  .question-board {
    background: rgba(20, 20, 40, 0.85); /* 深藍黑半透明 */
    border: 2px solid #4facfe;
    border-radius: 20px;
    padding: 25px;
    margin-bottom: 25px;
    box-shadow: 
      0 0 15px rgba(79, 172, 254, 0.4), /* 藍色外發光 */
      inset 0 0 20px rgba(0, 0, 0, 0.5); /* 內部陰影 */
    backdrop-filter: blur(10px);
    transform: rotateX(5deg); /* 微微傾斜，增加立體感 */
    text-align: center;
  }
  
  .question-text {
    color: #fff;
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.5;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  }
  
  .options-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  </style>