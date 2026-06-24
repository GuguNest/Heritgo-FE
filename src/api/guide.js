import axios from 'axios'
import { getAccessToken } from '@/api/profile'
import { attachAuthRefresh, refreshAccessToken } from '@/api/auth'

// 가이드 API 베이스
export const API_ORIGIN = 'http://127.0.0.1:8000'
const BASE = `${API_ORIGIN}/api/guides`

// 비스트리밍 호출용 axios (TTS·조회)
const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401/403 → refresh → 원요청 재시도
attachAuthRefresh(api)

// 조회 응답은 상대경로(/media/...), TTS 응답은 절대경로로 내려옴 → 상대경로면 origin 결합
export function resolveAudioUrl(url) {
  if (!url) return null
  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url
}

function authHeaders() {
  const token = getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * 가이드 생성 (SSE 스트리밍)
 * POST /api/guides/  body { profile_id }
 * EventSource 대신 fetch + ReadableStream으로 수신.
 * @param {number} profileId
 * @param {{ onDelta?: (delta: string, full: string) => void, signal?: AbortSignal }} handlers
 * @returns {Promise<{ guideId: number|null, content: string }>}
 */
export async function streamGuide(
  profileId,
  { onDelta, signal } = {},
  _retried = false,
) {
  const res = await fetch(`${BASE}/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ profile_id: profileId }),
    signal,
  })

  // 만료(401/403) → refresh 후 한 번 재시도 (스트림은 axios 인터셉터를 안 타므로 직접 처리)
  if ((res.status === 401 || res.status === 403) && !_retried) {
    try {
      await refreshAccessToken()
    } catch {
      const e = new Error('로그인이 만료되었어요. 다시 로그인해 주세요.')
      e.status = res.status
      throw e
    }
    return streamGuide(profileId, { onDelta, signal }, true)
  }

  if (!res.ok || !res.body) {
    const messages = {
      400: '프로필 정보가 올바르지 않아요.',
      401: '로그인이 필요해요.',
      403: '권한이 없어요.',
      404: '프로필을 찾을 수 없어요.',
      502: '유산 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
    }
    const err = new Error(messages[res.status] || '가이드를 생성하지 못했어요.')
    err.status = res.status
    throw err
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let guideId = null
  let full = ''

  // SSE 라인 파싱 (data: {...})
  const handleLine = (line) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return
    const payload = trimmed.slice(5).trim()
    if (!payload) return
    let data
    try {
      data = JSON.parse(payload)
    } catch {
      return
    }
    if (data.error) {
      const e = new Error(data.error || '가이드 생성 중 오류가 발생했어요.')
      e.stream = true
      throw e
    }
    if (typeof data.delta === 'string') {
      full += data.delta
      onDelta?.(data.delta, full)
    }
    if (data.done) guideId = data.guide_id ?? guideId
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // 마지막 미완성 라인 보존
    for (const line of lines) handleLine(line)
  }
  if (buffer) handleLine(buffer)

  return { guideId, content: full }
}

/** 오디오(TTS) 생성  POST /api/guides/{id}/tts/ → audio_url 채워진 가이드 반환 */
export async function generateTts(guideId) {
  const { data } = await api.post(`/${guideId}/tts/`)
  return { ...data, audio_url: resolveAudioUrl(data.audio_url) }
}

/** 단건 조회  GET /api/guides/{id}/ */
export async function getGuide(guideId) {
  const { data } = await api.get(`/${guideId}/`)
  return { ...data, audio_url: resolveAudioUrl(data.audio_url) }
}

/** 내 가이드 목록  GET /api/guides/?page&size */
export async function getGuides(params = {}) {
  const { data } = await api.get('/', { params })
  const items = (data.items ?? []).map((g) => ({
    ...g,
    audio_url: resolveAudioUrl(g.audio_url),
  }))
  return { ...data, items }
}

export default api
