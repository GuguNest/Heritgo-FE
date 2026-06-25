import axios from 'axios'
import { API_BASE } from '@/api/config'

// 백엔드 API 클라이언트
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  // 첫 호출은 공공 API 캐싱 때문에 느릴 수 있어 넉넉히 설정
  timeout: 30000,
})

/**
 * 국가유산 목록 조회
 * GET /api/heritages/
 * @param {Object} params
 * @param {string} [params.keyword]   검색어
 * @param {string} [params.sido_code] 시도 코드
 * @param {number} [params.kind_code] 종목 코드
 * @param {number} [params.page]      페이지 (기본 1)
 * @param {number} [params.size]      페이지 크기 (기본 20)
 * @returns {Promise<{items: Array, page: number, size: number, total: number, total_pages: number}>}
 */
export async function getHeritages(params = {}) {
  // 값이 비어있는 파라미터는 제외하고 전송
  const query = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== '' && v !== null && v !== undefined,
    ),
  )
  const { data } = await api.get('/heritages/', { params: query })
  return data
}

/**
 * 국가유산 상세 조회
 * GET /api/heritages/{heritage_id}/
 * 상세 필드(description·category_path 등)가 비어 있으면 서버가 공공 상세 API로 보강해 반환.
 * @param {number|string} id heritage_id
 * @returns {Promise<Object>} 상세 객체
 */
export async function getHeritage(id) {
  const { data } = await api.get(`/heritages/${id}/`)
  return data
}

export default api
