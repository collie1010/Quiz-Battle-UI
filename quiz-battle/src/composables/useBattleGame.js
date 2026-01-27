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
    playerName: '' })

  const currentQuestion = ref(null)
  const questionIndex = ref(0) // 目前題號 (0-based)
  const totalQuestions = 10     // 總題數

  const myScore = ref(0)
  const enemyScore = ref(0)
  const enemyId = ref('等待中...') // ⭐ 新增：對手 ID
  const enemyName = ref('等待中...') 

  const isMyTurnAnswered = ref(false)
  const isTimeout = ref(false) 
  const mySelectedAnswer = ref(null) // ⭐ 新增：我選了什麼
  const correctAnswer = ref(null)    // ⭐ 新增：這題正確答案是什麼

  const isMatching = ref(false) // 新增：是否正在配對中

  let stompClient = null
  let hiddenAnswer = null 

  // 改名：joinGame -> findMatch (不需要 roomId 參數了)
  const findMatch = (inputNickname) => {
    const myUUID = generateUUID();
    playerInfo.playerId = myUUID
    playerInfo.playerName = inputNickname
    gameState.value = 'WAITING' // 顯示等待畫面
    isMatching.value = true

    stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8088/ws'),
      reconnectDelay: 5000,
    })

    stompClient.onConnect = () => {
      // 1. ⭐ 訂閱「個人頻道」接收配對結果
      stompClient.subscribe(`/topic/player/${myUUID}`, (msg) => {
        const matchData = JSON.parse(msg.body)
        
        if (matchData.success) {
          // 配對成功！
          console.log('配對成功，房間ID:', matchData.roomId)
          playerInfo.roomId = matchData.roomId
          isMatching.value = false
          
          // 2. ⭐ 訂閱「房間頻道」準備開始遊戲
          subscribeToRoom(matchData.roomId)
        } else {
          // 還在找人...
          console.log(matchData.message)
        }
      })

      // 3. 發送配對請求
      stompClient.publish({
        destination: '/app/match',
        body: JSON.stringify({ 
          playerId: myUUID,
          playerName: inputNickname }) // 不需要 roomId
      })
    }
    stompClient.activate()
  }

  // 抽離出來的訂閱房間邏輯
  const subscribeToRoom = (roomId) => {
    stompClient.subscribe(`/topic/room/${roomId}`, (msg) => {
      handleMessage(JSON.parse(msg.body))
    })
  }

  const handleMessage = (data) => {
    // 1. 收到新題目 (重置狀態)
    if (data.question) {
      currentQuestion.value = data.question
      questionIndex.value = data.index
      hiddenAnswer = data.question.answer 
      correctAnswer.value = null 

      if (data.p1Id && data.p2Id) {
        if (data.p1Id === playerInfo.playerId) {
          enemyId.value = data.p2Id // 我是 P1，對手是 P2
          enemyName.value = data.p2Name
        } else {
          enemyId.value = data.p1Id // 我是 P2，對手是 P1
          enemyName.value = data.p1Name
        }
      }

      if (data.correctAnswer) {
        // 只有當「我已經作答」或是「遊戲結束」時，才允許更新正確答案
        // 這樣對手答對時，我的畫面只會更新分數，不會顯示綠色選項
        if (isMyTurnAnswered.value || data.gameOver) {
           correctAnswer.value = data.correctAnswer
        }
      }

      // ⭐ 檢查是否已完成所有題目
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

    // 2. 收到分數與結果 (包含正確答案)
    if (data.p1Score !== undefined) {
      // ⭐ 關鍵邏輯：判斷我是 P1 還是 P2
      if (data.p1Id === playerInfo.playerId) {
        // 我是 P1
        myScore.value = data.p1Score
        enemyScore.value = data.p2Score
        enemyId.value = data.p2Id // 設定對手 ID
      } else {
        // 我是 P2
        myScore.value = data.p2Score
        enemyScore.value = data.p1Score
        enemyId.value = data.p1Id // 設定對手 ID
      }

      // ⭐ 設定正確答案，觸發 UI 變色
     // ⭐⭐⭐ 關鍵修正區塊開始 ⭐⭐⭐
     if (data.correctAnswer) {
      // 邏輯：後端雖然傳來了答案，但我不能馬上顯示給你看
      // 條件 1: 我自己已經作答了 (isMyTurnAnswered.value === true) -> 可以顯示，確認對錯
      // 條件 2: 遊戲已經結束了 (data.gameOver === true) -> 可以顯示，因為不用猜了
      // 條件 3: 如果我都還沒答 -> 絕對不能更新 correctAnswer，否則會被劇透！
      
      if (isMyTurnAnswered.value || data.gameOver) {
         correctAnswer.value = data.correctAnswer
      }
    }
    // ⭐⭐⭐ 關鍵修正區塊結束 ⭐⭐⭐

      // ⭐ 新增：接收遊戲結束訊號
      if (data.gameOver) {
        gameState.value = 'FINISHED' // 直接切換狀態
      }
    }

    if (data.message && data.targetPlayerId) {
      if (data.targetPlayerId === playerInfo.playerId) {
        alert(data.message) // 顯示 "房間已滿"
        gameState.value = 'LOBBY' // 踢回大廳
        if (stompClient) stompClient.deactivate() // 斷開連線
      }
    }
    
  }

  const submitAnswer = (answerKey) => {
    if (isMyTurnAnswered.value) return
    isMyTurnAnswered.value = true
    mySelectedAnswer.value = answerKey // 記錄我選的

    if (hiddenAnswer) {
      correctAnswer.value = hiddenAnswer
    }

    stompClient.publish({
      destination: '/app/answer',
      body: JSON.stringify({
        roomId: playerInfo.roomId,
        playerId: playerInfo.playerId,
        answer: answerKey, // 確保這裡是 "A", "B", "C", "D"
        answerTime: Date.now()
      })
    })
  }

   // ⭐ 新增：重置遊戲狀態的方法
   const resetGame = () => {
    // 1. 斷開 WebSocket 連線
    if (stompClient && stompClient.active) {
      stompClient.deactivate()
    }
    stompClient = null

    // 2. 重置所有狀態變數
    gameState.value = 'LOBBY'
    playerInfo.roomId = ''
    // 注意：playerInfo.playerId 不用清空，讓玩家不用重新輸入名字
    
    currentQuestion.value = null
    questionIndex.value = 0
    myScore.value = 0
    enemyScore.value = 0
    enemyId.value = '等待中...'
    isMyTurnAnswered.value = false
    mySelectedAnswer.value = null
    correctAnswer.value = null
  }

  return {
    gameState,
    playerInfo,
    currentQuestion,
    questionIndex,
    totalQuestions,
    myScore,
    enemyScore,
    enemyId, // 回傳對手 ID
    enemyName,
    isTimeout,
    isMyTurnAnswered,
    mySelectedAnswer, // 回傳我選的
    correctAnswer,    // 回傳正確答案
    findMatch,
    resetGame,
    submitAnswer
  }
}
