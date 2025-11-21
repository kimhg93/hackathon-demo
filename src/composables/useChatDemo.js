import { MessageType } from '../types/message.js'

/**
 * 채팅 데모용 composable
 * 사용자 입력에 따라 하드코딩된 응답을 반환
 */
export function useChatDemo() {
  // 데모용 샘플 데이터
  const sampleData = {
    // 샘플 이미지 URL (무료 이미지 제공 서비스)
    image: 'https://picsum.photos/400/300',

    // 샘플 오디오 URL
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',

    // 샘플 비디오 URL
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',

    // 샘플 지도 위치 (서울 시청)
    location: {
      lat: 37.5665,
      lng: 126.9780,
      address: '서울특별시 중구 세종대로 110 (서울시청)',
      zoom: 15
    }
  }

  /**
   * 사용자 입력에 따라 적절한 응답 생성
   * @param {string} userInput - 사용자 입력 텍스트
   * @returns {Object} 메시지 객체 (type, content 포함)
   */
  const getDemoResponse = (userInput) => {
    const input = userInput.trim().toLowerCase()

    // "텍스트" 입력 → 텍스트 응답
    if (input === '텍스트' || input === 'text') {
      return {
        type: MessageType.TEXT,
        content: '안녕하세요! 이것은 텍스트 메시지 응답입니다. 😊'
      }
    }

    // "이미지" 입력 → 이미지 응답
    if (input === '이미지' || input === 'image') {
      return {
        type: MessageType.IMAGE,
        content: {
          url: sampleData.image,
          caption: '랜덤 샘플 이미지입니다',
          alt: '샘플 이미지'
        }
      }
    }

    // "음성" 입력 → 오디오 응답
    if (input === '음성' || input === 'audio' || input === '오디오') {
      return {
        type: MessageType.AUDIO,
        content: {
          url: sampleData.audio
        }
      }
    }

    // "동영상" 입력 → 비디오 응답
    if (input === '동영상' || input === 'video' || input === '비디오') {
      return {
        type: MessageType.VIDEO,
        content: {
          url: sampleData.video,
          thumbnail: '',
          caption: '샘플 동영상입니다'
        }
      }
    }

    // "지도" 입력 → 지도 응답
    if (input === '지도' || input === 'map' || input === '맵') {
      return {
        type: MessageType.MAP,
        content: sampleData.location
      }
    }

    // 그 외 입력 → 안내 메시지
    return {
      type: MessageType.TEXT,
      content: `"${userInput}"는 인식할 수 없는 명령입니다.\n\n다음 명령어를 입력해보세요:\n• 텍스트\n• 이미지\n• 음성\n• 동영상\n• 지도`
    }
  }

  return {
    getDemoResponse
  }
}
