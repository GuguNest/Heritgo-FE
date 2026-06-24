let kakaoMapPromise

export function loadKakaoMap() {
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao)
  }

  if (kakaoMapPromise) {
    return kakaoMapPromise
  }

  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY

  kakaoMapPromise = new Promise((resolve, reject) => {
    if (!appKey) {
      reject(new Error('VITE_KAKAO_MAP_KEY is not configured.'))
      return
    }

    const timeoutId = window.setTimeout(() => {
      kakaoMapPromise = null
      reject(new Error('카카오맵 SDK 응답이 지연되고 있습니다. 앱 키의 Web 도메인 등록 또는 네트워크 상태를 확인해 주세요.'))
    }, 10000)

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
    script.async = true
    script.onload = () => {
      window.clearTimeout(timeoutId)
      window.kakao.maps.load(() => resolve(window.kakao))
    }
    script.onerror = () => {
      window.clearTimeout(timeoutId)
      kakaoMapPromise = null
      reject(new Error('카카오맵 SDK를 불러오지 못했습니다. 앱 키의 Web 도메인 등록 또는 네트워크 상태를 확인해 주세요.'))
    }

    document.head.appendChild(script)
  })

  return kakaoMapPromise
}
