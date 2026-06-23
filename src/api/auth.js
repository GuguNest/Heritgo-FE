import axios from 'axios'
import { ref } from 'vue'

const authApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/users',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
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
