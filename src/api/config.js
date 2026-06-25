// API 베이스 URL (전 모듈 공용)
// 기본값은 배포된 백엔드(Railway). 로컬 백엔드로 개발하려면
// 프로젝트 루트에 .env.local 을 만들고 아래처럼 지정:
//   VITE_API_BASE_URL=http://127.0.0.1:8000
const RAW =
  import.meta.env.VITE_API_BASE_URL ||
  'https://heritgo-be-production.up.railway.app'

// 끝 슬래시 제거
export const API_ORIGIN = RAW.replace(/\/+$/, '')
export const API_BASE = `${API_ORIGIN}/api`
