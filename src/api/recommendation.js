import axios from 'axios'
import { getAccessToken } from '@/api/profile'
import { attachAuthRefresh } from '@/api/auth'

// 추천 API (베이스는 기존 모듈과 동일)
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 20000,
})

// 로그인 상태면 토큰 첨부 (for_me / for-me 채우기용). 공개 엔드포인트는 없어도 동작.
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
attachAuthRefresh(api)

// 응답이 배열이거나 {items:[]} 형태 모두 대응
function toArray(data) {
  return Array.isArray(data) ? data : (data?.items ?? [])
}

/** 인기 유산 (공개) */
export async function getPopular(limit = 10) {
  const { data } = await api.get('/heritages/recommendations/popular/', {
    params: { limit },
  })
  return toArray(data)
}

/** 내 주변 유산 (공개, lat/lng 필수) */
export async function getNearby({ lat, lng, radius_km, limit = 10 }) {
  const { data } = await api.get('/heritages/recommendations/nearby/', {
    params: { lat, lng, radius_km, limit },
  })
  return toArray(data)
}

/** 맞춤 추천 (인증 필수) */
export async function getForMe(limit = 10) {
  const { data } = await api.get('/heritages/recommendations/for-me/', {
    params: { limit },
  })
  return toArray(data)
}

/**
 * 홈 집계 (공개). lat/lng 주면 nearby, 토큰 있으면 for_me까지 채워짐.
 * @returns {Promise<{popular: Array, nearby: Array, for_me: Array}>}
 */
export async function getHomeRecommendations({ lat, lng } = {}) {
  const params = {}
  if (lat != null && lng != null) {
    params.lat = lat
    params.lng = lng
  }
  const { data } = await api.get('/heritages/recommendations/home/', { params })
  return {
    popular: data?.popular ?? [],
    nearby: data?.nearby ?? [],
    for_me: data?.for_me ?? [],
  }
}

export default api
