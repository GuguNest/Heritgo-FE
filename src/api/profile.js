import axios from 'axios'
import { attachAuthRefresh } from '@/api/auth'

// ── 인증 토큰 읽기 ──────────────────────────────────────────────
// 앱이 access 토큰을 보관하는 기존 위치에서 읽어 씁니다.
// 프로젝트의 실제 저장 키에 맞게 KEY 목록만 조정하면 됩니다.
const TOKEN_KEYS = [
  'heritgo_access_token', // auth.js(saveSession)가 저장하는 키
  'access',
  'accessToken',
  'access_token',
  'token',
]

export function getAccessToken() {
  if (typeof window === 'undefined') return null
  for (const store of [window.localStorage, window.sessionStorage]) {
    for (const key of TOKEN_KEYS) {
      const v = store?.getItem(key)
      if (v) return v
    }
  }
  return null
}

export function isLoggedIn() {
  return !!getAccessToken()
}

// 개발용 임시 인증 우회 플래그. 로그인 기능이 붙었으므로 비활성화.
export const DEV_BYPASS_AUTH = false

// 게이트 통과 여부: 우회 플래그가 켜져 있거나 실제 토큰이 있으면 통과
export function canUseAuthFeature() {
  return DEV_BYPASS_AUTH || isLoggedIn()
}

// 로그인 페이지 경로 (라우터/페이지 구조에 맞게 조정)
export const LOGIN_URL = '/login'

// 개발 중 실제 백엔드로 테스트할 때 콘솔에서 토큰을 넣을 수 있는 헬퍼
// 예) import 후 setAccessToken('eyJ...') 또는 localStorage.setItem('access','eyJ...')
export function setAccessToken(token) {
  if (typeof window !== 'undefined') window.localStorage.setItem('access', token)
}

// ── axios 인스턴스 + 인터셉터 ─────────────────────────────────
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // 끝 슬래시 필수 (요청은 /users/profiles/ 처럼 작성)
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

// 요청마다 Authorization: Bearer <access> 자동 첨부
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401/403 → refresh → 원요청 재시도
attachAuthRefresh(api)

// 서버 응답이 아예 없으면(백엔드 off) network 에러로 표시
function isNetworkError(err) {
  return !err?.response
}

// ── 선택 옵션 상수 (폼/목록 라벨 공용) ────────────────────────
export const AGE_GROUPS = [
  { value: 'child', label: '어린이' },
  { value: 'teen', label: '청소년' },
  { value: 'adult', label: '성인' },
  { value: 'senior', label: '시니어' },
]
export const LANGUAGES = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
]
export const TRAVEL_PURPOSES = [
  { value: 'family', label: '가족' },
  { value: 'friends', label: '친구' },
  { value: 'solo', label: '혼자' },
  { value: 'education', label: '교육' },
]
export const DURATIONS = [
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 90, label: '1시간 30분' },
  { value: 120, label: '2시간' },
  { value: 180, label: '3시간' },
]

// 코드 → 라벨 헬퍼
export function labelOf(list, value) {
  return list.find((o) => o.value === value)?.label ?? value
}

// ── 목(mock) fallback: 백엔드가 꺼져 있을 때 화면 확인용 ───────
let mockSeq = 9000
const MOCK_PROFILES = [
  {
    id: 9001,
    heritage_id: 1,
    heritage_name: '경복궁',
    party_size: 3,
    age_group: 'adult',
    language_code: 'ko',
    travel_purpose: 'family',
    preferred_duration_minutes: 120,
    _mock: true,
  },
]

// ── API ───────────────────────────────────────────────────────

/** 프로필 생성  POST /users/profiles/ */
export async function createProfile(payload) {
  try {
    const { data } = await api.post('/users/profiles/', payload)
    return data
  } catch (err) {
    // 백엔드 off → 목 객체로 성공 피드백만 시연
    if (isNetworkError(err)) {
      return { id: ++mockSeq, ...payload, _mock: true }
    }
    throw err
  }
}

/** 내 프로필 목록  GET /users/profiles/ */
export async function getProfiles() {
  try {
    const { data } = await api.get('/users/profiles/')
    return Array.isArray(data) ? data : (data?.results ?? data?.items ?? [])
  } catch (err) {
    if (isNetworkError(err)) return [...MOCK_PROFILES]
    throw err
  }
}

/** 단건 조회  GET /users/profiles/{id}/ */
export async function getProfile(id) {
  try {
    const { data } = await api.get(`/users/profiles/${id}/`)
    return data
  } catch (err) {
    if (isNetworkError(err)) {
      return MOCK_PROFILES.find((p) => p.id === Number(id)) ?? MOCK_PROFILES[0]
    }
    throw err
  }
}

/** 부분 수정  PATCH /users/profiles/{id}/ */
export async function updateProfile(id, payload) {
  try {
    const { data } = await api.patch(`/users/profiles/${id}/`, payload)
    return data
  } catch (err) {
    if (isNetworkError(err)) return { id: Number(id), ...payload, _mock: true }
    throw err
  }
}

export default api
