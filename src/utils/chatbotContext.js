const STORAGE_KEY = 'heritgo_chatbot_page_contexts'
const MAX_CONTEXTS = 20

function readContextMap() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeContextMap(map) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* Ignore storage quota or privacy-mode failures. */
  }
}

function compact(value) {
  if (Array.isArray(value)) return value.map(compact).filter((item) => item != null)
  if (!value || typeof value !== 'object') return value ?? null

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, entry]) => [key, compact(entry)])
      .filter(([, entry]) => entry !== null && entry !== undefined && entry !== ''),
  )
}

export function setChatbotPageContext(path, context) {
  if (!path || !context) return

  const map = readContextMap()
  map[path] = {
    ...compact(context),
    captured_at: new Date().toISOString(),
  }

  const entries = Object.entries(map).sort(([, a], [, b]) =>
    String(b.captured_at || '').localeCompare(String(a.captured_at || '')),
  )
  writeContextMap(Object.fromEntries(entries.slice(0, MAX_CONTEXTS)))
}

export function getChatbotPageContext(path) {
  if (!path) return null
  return readContextMap()[path] || null
}
