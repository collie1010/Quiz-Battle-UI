import { ref } from 'vue'

export function useTimer(defaultDuration = 10) {
  const timeLeft = ref(defaultDuration)
  let intervalId = null

  // ⭐ 修改：start 接受兩個參數 (時間, 回呼)
  // 為了相容性，我們做一點參數判斷
  const start = (durationOrCallback, callback) => {
    stop() // 先清除舊的計時器

    let duration = defaultDuration
    let onFinish = null

    // 判斷第一個參數是什麼
    if (typeof durationOrCallback === 'number') {
      duration = durationOrCallback
      onFinish = callback
    } else if (typeof durationOrCallback === 'function') {
      onFinish = durationOrCallback
    }

    timeLeft.value = duration

    intervalId = setInterval(() => {
      timeLeft.value -= 0.1 

      if (timeLeft.value <= 0) {
        timeLeft.value = 0
        stop()
        if (onFinish) onFinish() // 執行回呼
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
