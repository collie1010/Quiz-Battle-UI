import { ref } from 'vue'
import Papa from 'papaparse'

export function useGame() {
  const questions = ref([])
  const currentIndex = ref(0)
  const score = ref(0)

  const loadQuestions = async () => {
    try {
      const response = await fetch('/question.csv')
      const csvText = await response.text()

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // 轉換 CSV 資料為問題格式
          questions.value = results.data.slice(0, 8).map((row, index) => ({
            id: index + 1,
            question: row['題目'],
            correctAnswer: parseInt(row['答案']),
            options: [
              row['選項1'],
              row['選項2'],
              row['選項3'],
              row['選項4']
            ]
          }))
        }
      })
    } catch (error) {
      console.error('載入問題失敗:', error)
    }
  }

  const answer = (choice, timeLeft) => {
    const currentQuestion = questions.value[currentIndex.value]
    if (!currentQuestion) return

    // 計算分數：正確 +100，時間加成
    if (choice === currentQuestion.correctAnswer) {
      score.value += 100 + Math.floor(timeLeft * 15)
    }
  }

  return {
    questions,
    currentIndex,
    score,
    loadQuestions,
    answer
  }
}
