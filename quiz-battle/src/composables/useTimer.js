import { ref } from 'vue'

export function useTimer(duration = 8) {
  const timeLeft = ref(duration)
  let intervalId = null

  const start = (callback) => {
    timeLeft.value = duration
    stop() // 確保之前沒有執行中的計時器

    intervalId = setInterval(() => {
      timeLeft.value -= 0.1 // 每100ms減0.1秒

      if (timeLeft.value <= 0) {
        timeLeft.value = 0
        stop()
        if (callback) callback()
      }
    }, 100)
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return {
    timeLeft,
    start,
    stop
  }
}
