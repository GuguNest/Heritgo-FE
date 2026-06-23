import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 40000,
})

function authHeaders() {
  const token = localStorage.getItem('heritgo_access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function login(payload) {
  const { data } = await api.post('/users/login/', payload)
  localStorage.setItem('heritgo_access_token', data.access)
  localStorage.setItem('heritgo_user', JSON.stringify(data.user))
  return data
}

export async function getSessions() {
  const { data } = await api.get('/chatbots/sessions/', {
    headers: authHeaders(),
  })
  return data
}

export async function createSession(payload) {
  const { data } = await api.post('/chatbots/sessions/', payload, {
    headers: authHeaders(),
  })
  return data
}

export async function updateSession(sessionId, payload) {
  const { data } = await api.patch(
    `/chatbots/sessions/${sessionId}/`,
    payload,
    { headers: authHeaders() },
  )
  return data
}

export async function deleteSession(sessionId) {
  await api.delete(`/chatbots/sessions/${sessionId}/`, {
    headers: authHeaders(),
  })
}

export async function getMessages(sessionId) {
  const { data } = await api.get(`/chatbots/sessions/${sessionId}/messages/`, {
    headers: authHeaders(),
  })
  return data
}

export async function sendMessage(sessionId, content) {
  const { data } = await api.post(
    `/chatbots/sessions/${sessionId}/messages/`,
    { content },
    { headers: authHeaders() },
  )
  return data
}

export function clearSession() {
  localStorage.removeItem('heritgo_access_token')
  localStorage.removeItem('heritgo_user')
}

export function hasAccessToken() {
  return Boolean(localStorage.getItem('heritgo_access_token'))
}

export function errorMessage(error) {
  const data = error?.response?.data
  if (!data) {
    return '백엔드 서버에 연결할 수 없거나 응답 시간이 초과되었습니다.'
  }
  if (data.detail) return data.detail
  if (data.non_field_errors?.length) return data.non_field_errors[0]

  const first = Object.values(data)[0]
  return Array.isArray(first) ? first[0] : String(first)
}
