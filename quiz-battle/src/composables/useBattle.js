import { ref } from 'vue'

export function useBattle() {
  const enemyScore = ref(0)
  const enemyAnswered = ref(false)


  const resetEnemy = () => {
    enemyAnswered.value = false
  }

  return {
    enemyScore,
    enemyAnswered,
    resetEnemy
  }
}
