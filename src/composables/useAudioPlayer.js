import { reactive, readonly } from 'vue'

// 앱 전역에서 하나만 존재하는 오디오 플레이어.
// 모듈 스코프의 new Audio() 라서 라우트가 바뀌어도 언마운트되지 않고 재생이 유지된다.

const state = reactive({
  guideId: null,
  title: '',
  src: null,
  playing: false,
  currentTime: 0,
  duration: 0,
  rate: 1,
})

let audio = null

function ensureAudio() {
  if (audio) return audio

  audio = new Audio()
  audio.preload = 'metadata'
  audio.addEventListener('loadedmetadata', () => {
    state.duration = audio.duration || 0
  })
  audio.addEventListener('timeupdate', () => {
    state.currentTime = audio.currentTime || 0
  })
  audio.addEventListener('play', () => {
    state.playing = true
  })
  audio.addEventListener('pause', () => {
    state.playing = false
  })
  audio.addEventListener('ended', () => {
    state.playing = false
    state.currentTime = 0
  })
  return audio
}

function play({ guideId = null, src = null, title = null } = {}) {
  const el = ensureAudio()

  if (src && src !== state.src) {
    state.src = src
    state.currentTime = 0
    state.duration = 0
    el.src = src
  }
  if (guideId != null) state.guideId = guideId
  if (title != null) state.title = title

  el.playbackRate = state.rate
  el.play().catch(() => {
    /* 자동재생 차단 시 사용자가 직접 재생 */
  })
}

function toggle() {
  const el = ensureAudio()
  if (!state.src) return
  if (el.paused) el.play().catch(() => {})
  else el.pause()
}

function seekToPercent(percent) {
  const el = ensureAudio()
  if (!state.duration) return
  el.currentTime = (percent / 100) * state.duration
}

function setRate(rate) {
  state.rate = rate
  if (audio) audio.playbackRate = rate
}

function stop() {
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }
  state.src = null
  state.guideId = null
  state.title = ''
  state.playing = false
  state.currentTime = 0
  state.duration = 0
}

export function useAudioPlayer() {
  return {
    state: readonly(state),
    play,
    toggle,
    seekToPercent,
    setRate,
    stop,
  }
}
