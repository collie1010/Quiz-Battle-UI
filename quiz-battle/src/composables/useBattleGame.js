import { ref, reactive } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function useBattleGame() {
  const gameState = ref('LOBBY')
  const playerInfo = reactive({
    roomId: '',
    playerId: '',
    playerName: '' 
  })

  const currentQuestion = ref(null)
  const questionIndex = ref(0) 
  const totalQuestions = 10     

  const myScore = ref(0)
  const enemyScore = ref(0)
  const enemyId = ref('等待中...') 
  const enemyName = ref('等待中...')

  const isMyTurnAnswered = ref(false)
  const isTimeout = ref(false)
  const mySelectedAnswer = ref(null) 
  const correctAnswer = ref(null)    

  const isMatching = ref(false) 
  const winnerId = ref(null)
  const gameEndMessage = ref('')
  const initialTime = ref(10)

  let stompClient = null
  let hiddenAnswer = null

  // 儲存狀態 (只在確定進入房間後呼叫)
  const saveState = () => {
    // 防護：如果沒有 roomId，不要儲存 (避免存到髒資料)
    if (!playerInfo.roomId) return

    const state = {
      roomId: playerInfo.roomId,
      playerId: playerInfo.playerId,
      playerName: playerInfo.playerName
    }
    localStorage.setItem('battle_state', JSON.stringify(state))
  }

  const clearState = () => {
    localStorage.removeItem('battle_state')
  }

  // 訂閱房間頻道 (抽離共用邏輯)
  const subscribeToRoom = (roomId) => {
    if (stompClient && stompClient.connected) {
      stompClient.subscribe(`/topic/room/${roomId}`, (msg) => {
        handleMessage(JSON.parse(msg.body))
      })
    }
  }

  // 嘗試重連
  const tryReconnect = () => {
    const saved = localStorage.getItem('battle_state')
    if (saved) {
      try {
        const state = JSON.parse(saved)
        
        // ⭐ 關鍵防護：如果沒有 roomId，代表上次根本沒配對成功，不需要重連
        if (!state.roomId) {
          clearState()
          return false
        }

        console.log('偵測到未完成的遊戲，嘗試重連...', state)

        // 恢復變數
        playerInfo.roomId = state.roomId
        playerInfo.playerId = state.playerId
        playerInfo.playerName = state.playerName
        gameState.value = 'WAITING' 

        // 建立連線
        stompClient = new Client({
          webSocketFactory: () => new SockJS('http://localhost:8088/ws'),
          reconnectDelay: 5000,
        })

        stompClient.onConnect = () => {
          // 訂閱個人頻道 (接收重連失敗訊息)
          stompClient.subscribe(`/topic/player/${state.playerId}`, (msg) => {
             const body = JSON.parse(msg.body);
             if (body.message && body.message.includes("失效")) {
                alert(body.message);
                resetGame(); // 回到大廳
             }
          })

          // 訂閱房間頻道
          subscribeToRoom(state.roomId)

          // 發送重連請求
          stompClient.publish({
            destination: '/app/rejoin',
            body: JSON.stringify({
              roomId: state.roomId,
              playerId: state.playerId,
              playerName: state.playerName
            })
          })
        }
        stompClient.activate()
        return true 
      } catch (e) {
        console.error('重連資料解析失敗', e)
        clearState()
        return false
      }
    }
    return false
  }

  // 開始配對 (新遊戲)
  const findMatch = (inputNickname) => {
    const myUUID = generateUUID();
    
    // 重置狀態
    playerInfo.playerId = myUUID
    playerInfo.playerName = inputNickname
    playerInfo.roomId = '' // ⭐ 確保清空舊的 roomId
    
    gameState.value = 'WAITING' 
    isMatching.value = true

    stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8088/ws'),
      reconnectDelay: 5000,
    })

    stompClient.onConnect = () => {
      // 訂閱個人頻道
      stompClient.subscribe(`/topic/player/${myUUID}`, (msg) => {
        const matchData = JSON.parse(msg.body)

        if (matchData.success) {
          // 配對成功！
          console.log('配對成功，房間ID:', matchData.roomId)
          playerInfo.roomId = matchData.roomId
          isMatching.value = false

          // ⭐ 關鍵：拿到 RoomID 後才儲存狀態
          saveState()

          // 訂閱房間頻道
          subscribeToRoom(matchData.roomId)
        } else {
          // 還在找人...
          console.log(matchData.message)
        }
      })

      // 發送配對請求
      stompClient.publish({
        destination: '/app/match',
        body: JSON.stringify({
          playerId: myUUID,
          playerName: inputNickname 
        }) 
      })
    }
    stompClient.activate()
  }

  const handleMessage = (data) => {
    // 1. 收到新題目
    if (data.question) {
      currentQuestion.value = data.question
      questionIndex.value = data.index
      hiddenAnswer = data.question.answer
      correctAnswer.value = null

      if (data.remainingTimeMs !== undefined) {
        // 將毫秒轉為秒，並更新計時器
        // 這裡需要配合 App.vue 的 watch 邏輯
        initialTime.value = data.remainingTimeMs / 1000
      } else {
        initialTime.value = 10 // 預設 10 秒
      }
      // 更新對手資訊
      if (data.p1Id && data.p2Id) {
        if (data.p1Id === playerInfo.playerId) {
          enemyId.value = data.p2Id 
          enemyName.value = data.p2Name
        } else {
          enemyId.value = data.p1Id 
          enemyName.value = data.p1Name
        }
      }

      // 防劇透顯示答案
      if (data.correctAnswer) {
        if (isMyTurnAnswered.value || data.gameOver) {
           correctAnswer.value = data.correctAnswer
        }
      }

      // 檢查是否結束
      if (data.index >= totalQuestions) {
        gameState.value = 'FINISHED'
        return
      }

      gameState.value = 'PLAYING'

      // 重置每題狀態
      isTimeout.value = false
      isMyTurnAnswered.value = false
      mySelectedAnswer.value = null
      correctAnswer.value = null
    }

    // 2. 收到分數與結果
    if (data.p1Score !== undefined) {
      if (data.p1Id === playerInfo.playerId) {
        myScore.value = data.p1Score
        enemyScore.value = data.p2Score
        enemyId.value = data.p2Id 
      } else {
        myScore.value = data.p2Score
        enemyScore.value = data.p1Score
        enemyId.value = data.p1Id 
      }

      // 防劇透顯示答案
      if (data.correctAnswer) {
        if (isMyTurnAnswered.value || data.gameOver) {
           correctAnswer.value = data.correctAnswer
        }
      }

      if (data.gameOver) {
        gameState.value = 'FINISHED'
        clearState() // 正常結束清除狀態

        if (data.message) {
          gameEndMessage.value = data.message
        } else {
          gameEndMessage.value = ''
        }

        // ⭐ 立即停止計時器，防止繼續倒數
        if (typeof window !== 'undefined' && window.timerStop) {
          window.timerStop()
        }

        if (data.winnerId) {
          winnerId.value = data.winnerId
        } else {
          winnerId.value = null // 平手
        }
      }
    }

    // 錯誤處理 (例如房間已滿)
    if (data.message && data.targetPlayerId) {
      if (data.targetPlayerId === playerInfo.playerId) {
        // 這裡通常是 ErrorMessage
        if (data.message.includes("失效") || data.message.includes("滿")) {
             alert(data.message)
             resetGame()
        }
      }
    }
  }

  const submitAnswer = (answerKey) => {
    if (isMyTurnAnswered.value) return
    isMyTurnAnswered.value = true
    mySelectedAnswer.value = answerKey 

    // 本地即時回饋
    if (hiddenAnswer) {
      correctAnswer.value = hiddenAnswer
    }

    stompClient.publish({
      destination: '/app/answer',
      body: JSON.stringify({
        roomId: playerInfo.roomId,
        playerId: playerInfo.playerId,
        answer: answerKey, 
        answerTime: Date.now()
      })
    })
  }

   // 重置遊戲狀態 (回到大廳)
   const resetGame = () => {
    clearState()
    gameEndMessage.value = ''
    
    if (stompClient && stompClient.active) {
      stompClient.deactivate()
    }
    stompClient = null

    gameState.value = 'LOBBY'
    playerInfo.roomId = ''
    // 保留 playerName 方便下次輸入
    
    currentQuestion.value = null
    questionIndex.value = 0
    myScore.value = 0
    enemyScore.value = 0
    enemyId.value = '等待中...'
    enemyName.value = '等待中...'
    isMyTurnAnswered.value = false
    mySelectedAnswer.value = null
    correctAnswer.value = null
    isMatching.value = false
  }

  return {
    gameState,
    playerInfo,
    currentQuestion,
    questionIndex,
    totalQuestions,
    myScore,
    enemyScore,
    enemyName, // UI 用
    isTimeout,
    isMyTurnAnswered,
    mySelectedAnswer, 
    correctAnswer,  
    winnerId,
    initialTime, 
    gameEndMessage, 
    tryReconnect,
    findMatch,
    resetGame,
    submitAnswer
  }
}
