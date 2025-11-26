import { ref, onUnmounted } from 'vue'

export function useWebPush() {
  const isSupported = ref('Notification' in window)
  const permission = ref(Notification.permission)
  const pushIntervalId = ref(null)

  // 알림 권한 요청
  const requestPermission = async () => {
    if (!isSupported.value) {
      console.warn('이 브라우저는 알림을 지원하지 않습니다.')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      permission.value = result
      return result === 'granted'
    } catch (error) {
      console.error('알림 권한 요청 실패:', error)
      return false
    }
  }

  // 웹푸시 알림 표시
  const showNotification = (title, options = {}) => {
    if (permission.value !== 'granted') {
      console.warn('알림 권한이 없습니다.')
      return null
    }

    try {
      const notification = new Notification(title, {
        icon: '/insurance-icon.png',
        badge: '/badge-icon.png',
        vibrate: [200, 100, 200],
        requireInteraction: true, // 사용자가 클릭할 때까지 유지
        ...options
      })

      return notification
    } catch (error) {
      console.error('알림 표시 실패:', error)
      return null
    }
  }

  // 마케팅 푸시 알림 (15초마다)
  const startMarketingPush = (onClick) => {
    // 이미 실행 중이면 중지
    stopMarketingPush()

    // 권한 체크
    if (permission.value !== 'granted') {
      console.warn('알림 권한이 필요합니다.')
      return
    }

    // 15초마다 푸시 알림 표시
    pushIntervalId.value = setInterval(() => {
      const notification = showNotification(
        '🚴‍♂️ 자전거가 취미인 당신을 위한 특별 혜택!',
        {
          body: '안전하게 자전거 타세요!\n자전거 보험 최대 1억원 보장 | 월 5,900원부터\n\n💡 지금 바로 확인하세요!',
          icon: 'https://www.acedirect.co.kr/images/common/logo.png',
          badge: 'https://www.acedirect.co.kr/favicon.ico',
          tag: 'bicycle-insurance-ad', // 중복 알림 방지
          renotify: true, // 같은 태그의 알림이 다시 표시될 때 알림
          silent: false,
          data: {
            url: 'https://www.acedirect.co.kr/servlets/contract/contractForward.ace?target=pc/contract/step01One&cmd=Step01Command&layout=type2',
            type: 'marketing'
          }
        }
      )

      if (notification && onClick) {
        notification.onclick = (event) => {
          event.preventDefault()
          onClick(notification.data?.url)
          notification.close()
        }
      }
    }, 15000) // 15초 = 15000ms
  }

  // 마케팅 푸시 중지
  const stopMarketingPush = () => {
    if (pushIntervalId.value) {
      clearInterval(pushIntervalId.value)
      pushIntervalId.value = null
    }
  }

  // 컴포넌트 언마운트 시 정리
  onUnmounted(() => {
    stopMarketingPush()
  })

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    startMarketingPush,
    stopMarketingPush
  }
}
