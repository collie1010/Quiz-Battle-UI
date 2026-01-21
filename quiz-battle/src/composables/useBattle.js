import { ref } from 'vue'

export function useBattle() {
  const enemyScore = ref(0)
  const enemyAnswered = ref(false)

  // mock 對手行為（之後整個檔案可刪）
  const mockEnemyAnswer = (correct, timeLeft) => {
    setTimeout(() => {
      enemyAnswered.value = true
      if (Math.random() < 0.7) {
        enemyScore.value += 100 + timeLeft * 15
      }
    }, Math.random() * 5000)
  }

  const resetEnemy = () => {
    enemyAnswered.value = false
  }

  return {
    enemyScore,
    enemyAnswered,
    mockEnemyAnswer,
    resetEnemy
  }
}
