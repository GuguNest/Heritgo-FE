import axios from 'axios'
import { ref } from 'vue'

const authApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/users',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  // 로그인 시 httpOnly refresh 쿠키 수신, refresh 시 쿠키 전송에 필요
  withCredentials: true,
})

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('heritgo_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function signUp(payload) {
  const { data } = await authApi.post('/signup/', payload)
  return data
}

export async function login(payload) {
  const { data } = await authApi.post('/login/', payload)
  return data
}

export async function logout() {
  await authApi.post('/logout/')
}

export function saveSession(data) {
  const accessToken = data?.access ?? data?.access_token ?? data?.token
  if (accessToken) localStorage.setItem('heritgo_access_token', accessToken)
  if (data?.refresh) localStorage.setItem('heritgo_refresh_token', data.refresh)
  if (data?.user) localStorage.setItem('heritgo_user', JSON.stringify(data.user))
  currentUser.value = getStoredUser()
}

export function clearSession() {
  localStorage.removeItem('heritgo_access_token')
  localStorage.removeItem('heritgo_refresh_token')
  localStorage.removeItem('heritgo_user')
  currentUser.value = null
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('heritgo_user')) ?? null
  } catch {
    return null
  }
}

// 앱 전역에서 공유하는 로그인 사용자 상태 (헤더 등에서 구독)
export const currentUser = ref(getStoredUser())

// ── access 토큰 자동 재발급 (refresh) ─────────────────────────
// POST /api/users/token/refresh/ — body 없음, httpOnly 쿠키(heritgo_refresh) 사용
// 동시 다발 요청이 동시에 만료돼도 refresh는 한 번만 (single-flight)
let refreshPromise = null
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = authApi
      .post('/token/refresh/')
      .then(({ data }) => {
        saveSession(data) // 새 access + user 저장, currentUser 갱신
        return data.access
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// refresh도 실패 → 세션 정리 후 로그인으로
export function handleAuthExpired() {
  clearSession()
  if (
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/login')
  ) {
    window.location.href = '/login'
  }
}

/**
 * 인증이 필요한 axios 인스턴스에 401/403 → refresh → 원요청 재시도 인터셉터를 부착.
 * (이 백엔드는 토큰 만료 시 401이 아니라 403으로 응답하므로 둘 다 처리)
 */
export function attachAuthRefresh(instance) {
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const { response, config } = error
      if (!response || !config) throw error
      const status = response.status
      if ((status === 401 || status === 403) && !config._retried) {
        config._retried = true
        try {
          const token = await refreshAccessToken()
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
          return instance(config)
        } catch {
          handleAuthExpired()
          throw error
        }
      }
      throw error
    },
  )
}

export function getErrorMessage(error, fallback) {
  const data = error?.response?.data
  if (!data) {
    return error?.code === 'ECONNABORTED'
      ? '요청 시간이 초과되었어요. 잠시 후 다시 시도해 주세요.'
      : fallback
  }

  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  if (data.non_field_errors?.length) return data.non_field_errors[0]

  const firstValue = Object.values(data)[0]
  if (Array.isArray(firstValue)) return firstValue[0]
  if (typeof firstValue === 'string') return firstValue
  return fallback
}

export default authApi
