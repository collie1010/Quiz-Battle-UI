import SockJS from 'sockjs-client'
import Stomp from 'stompjs'
import { ref } from 'vue'

export function useSocket(roomId, playerId) {
  const stompClient = ref(null)
  const connected = ref(false)

  const connect = (onMessage) => {
    const socket = new SockJS('http://localhost:8088/ws')
    stompClient.value = Stomp.over(socket)
    stompClient.value.debug = () => {}

    stompClient.value.connect({}, () => {
      connected.value = true

      stompClient.value.subscribe(
        `/topic/room/${roomId}`,
        (msg) => {
          onMessage(JSON.parse(msg.body))
        }
      )

      stompClient.value.send('/app/join', {}, JSON.stringify({
        roomId,
        playerId
      }))
    })
  }

  const sendAnswer = (answer) => {
    stompClient.value.send('/app/answer', {}, JSON.stringify({
      roomId,
      playerId,
      answer,
      answerTime: Date.now()
    }))
  }

  return {
    connect,
    sendAnswer,
    connected
  }
}
