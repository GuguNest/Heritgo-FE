<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getChatbotPageContext } from '@/utils/chatbotContext'
import {
  clearSession,
  createSession,
  errorMessage,
  getMessages,
  getSessions,
  hasAccessToken,
  login,
  sendMessage,
} from '@/api/chatbot'

const emit = defineEmits(['home'])
const route = useRoute()

const credentials = reactive({ username: '', password: '' })
const authenticated = ref(hasAccessToken())
const sessions = ref([])
const selectedSession = ref(null)
const messages = ref([])
const relatedHeritages = ref([])
const question = ref('')
const loading = ref(false)
const sending = ref(false)
const error = ref('')
const messagePanel = ref(null)
const currentLocation = ref(null)
let currentLocationPromise = null

const quickQuestions = [
  '서울에서 조선시대 궁궐을 추천해주세요',
  '경주에 있는 신라시대 사찰을 알려주세요',
  '수원에 있는 성곽 문화유산을 추천해주세요',
]

const hasPendingAnswer = computed(() =>
  messages.value.some(
    (message) =>
      message.sender_type === 'assistant' && message.status === 'pending',
  ),
)

const activeSessionTitle = computed(
  () => selectedSession.value?.title ?? '새 대화를 시작해 보세요',
)

async function scrollToBottom() {
  await nextTick()
  if (messagePanel.value) {
    messagePanel.value.scrollTop = messagePanel.value.scrollHeight
  }
}

function getCurrentLocation() {
  if (currentLocation.value) return Promise.resolve(currentLocation.value)
  if (currentLocationPromise) return currentLocationPromise
  if (!navigator.geolocation) return Promise.resolve(null)

  currentLocationPromise = new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        if (position.coords.accuracy != null) {
          location.accuracy = position.coords.accuracy
        }
        currentLocation.value = location
        resolve(location)
      },
      () => resolve(null),
      { timeout: 5000, maximumAge: 600000 },
    )
  }).finally(() => {
    currentLocationPromise = null
  })

  return currentLocationPromise
}

async function loadSessions() {
  error.value = ''
  loading.value = true
  try {
    sessions.value = await getSessions()
    authenticated.value = true
  } catch (requestError) {
    if (requestError?.response?.status === 401) logout()
    error.value = errorMessage(requestError)
  } finally {
    loading.value = false
  }
}

async function submitLogin() {
  error.value = ''
  loading.value = true
  try {
    await login(credentials)
    authenticated.value = true
    await loadSessions()
  } catch (requestError) {
    error.value = errorMessage(requestError)
  } finally {
    loading.value = false
  }
}

function startNewSession() {
  selectedSession.value = null
  messages.value = []
  relatedHeritages.value = []
  error.value = ''
}

function createTitleFromMessage(content) {
  return content.length > 30 ? `${content.slice(0, 30)}...` : content
}

function parseSourceContextPath(path) {
  if (!path) return {}
  const heritageMatch = path.match(/^\/heritages\/([^/?#]+)/)
  if (heritageMatch) {
    return { page_type: 'heritage_detail', heritage_id: heritageMatch[1] }
  }

  const guideMatch = path.match(/^\/guides\/([^/?#]+)/)
  if (guideMatch) {
    return { page_type: 'guide_detail', guide_id: guideMatch[1] }
  }

  if (path.startsWith('/guides')) return { page_type: 'guide_list' }
  if (path.startsWith('/profiles')) return { page_type: 'profile_list' }
  if (path === '/' || path.startsWith('/?')) return { page_type: 'heritage_list' }
  return { page_type: 'unknown' }
}

function getSourceContext() {
  const sourcePath = String(route.query.from || '')
  if (!sourcePath) return null
  const storedContext = getChatbotPageContext(sourcePath) || {}

  return {
    source_path: sourcePath,
    source_title: storedContext.source_title || document.title,
    activated_at: new Date().toISOString(),
    ...parseSourceContextPath(sourcePath),
    ...storedContext,
  }
}

async function selectSession(session) {
  selectedSession.value = session
  relatedHeritages.value = []
  error.value = ''
  try {
    messages.value = await getMessages(session.session_id)
    await scrollToBottom()
  } catch (requestError) {
    error.value = errorMessage(requestError)
  }
}

async function submitQuestion() {
  const content = question.value.trim()
  if (!content || sending.value) return

  error.value = ''
  sending.value = true
  question.value = ''

  // 낙관적 UI: 답변 생성이 동기로 수십 초 걸릴 수 있어
  // 내 말풍선과 '답변 작성 중' 말풍선을 즉시 띄운다.
  const stamp = Date.now()
  const tempUserId = `temp-user-${stamp}`
  const tempAssistantId = `temp-assistant-${stamp}`
  messages.value.push(
    { id: tempUserId, sender_type: 'user', content, status: 'completed' },
    { id: tempAssistantId, sender_type: 'assistant', content: '', status: 'pending' },
  )
  await scrollToBottom()

  try {
    const location = await getCurrentLocation()
    const sourceContext = getSourceContext()
    let session = selectedSession.value

    // 선택된 세션이 없으면 첫 질문과 함께 새 세션 자동 생성
    if (!session) {
      const payload = { title: createTitleFromMessage(content) }
      if (location) payload.current_location = location
      if (sourceContext) {
        payload.page_context = sourceContext
        if (sourceContext.heritage_id) {
          payload.heritage_id = sourceContext.heritage_id
        }
      }

      session = await createSession(payload)
      sessions.value.unshift(session)
      selectedSession.value = session
    }

    const result = await sendMessage(
      session.session_id,
      content,
      location,
      sourceContext,
    )
    // 임시 말풍선 2개를 실제 응답으로 교체
    const index = messages.value.findIndex((message) => message.id === tempUserId)
    if (index !== -1) {
      messages.value.splice(index, 2, result.user_message, result.assistant_message)
    } else {
      messages.value.push(result.user_message, result.assistant_message)
    }
    relatedHeritages.value = result.related_heritages ?? []
    await scrollToBottom()
  } catch (requestError) {
    // 실패 시 임시 말풍선 제거하고 입력 내용 복원
    messages.value = messages.value.filter(
      (message) => message.id !== tempUserId && message.id !== tempAssistantId,
    )
    question.value = content
    error.value = errorMessage(requestError)
  } finally {
    sending.value = false
  }
}

function logout() {
  clearSession()
  authenticated.value = false
  sessions.value = []
  selectedSession.value = null
  messages.value = []
  relatedHeritages.value = []
}

onMounted(() => {
  if (authenticated.value) loadSessions()
})
</script>

<template>
  <main class="min-h-screen bg-bg text-text">
    <!-- 로그인 -->
    <div
      v-if="!authenticated"
      class="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-6 py-12"
    >
      <form
        class="w-full rounded-2xl border border-line bg-surface p-8 shadow-sm"
        @submit.prevent="submitLogin"
      >
        <p class="text-xs font-medium uppercase tracking-[0.25em] text-teal">
          Heritgo Chatbot
        </p>
        <h1 class="mt-3 font-serif text-2xl text-text">문화유산 대화</h1>
        <p class="mt-2 text-sm leading-6 text-subtext">
          로그인하고 문화유산 대화를 시작해 보세요.
        </p>
        <div
          v-if="error"
          class="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ error }}
        </div>
        <div class="mt-7 grid gap-3">
          <input
            v-model.trim="credentials.username"
            required
            autocomplete="username"
            placeholder="아이디"
            class="w-full rounded-xl border border-line bg-bg/60 px-4 py-3 text-sm text-text outline-none transition placeholder:text-subtext/55 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
          />
          <input
            v-model="credentials.password"
            required
            type="password"
            autocomplete="current-password"
            placeholder="비밀번호"
            class="w-full rounded-xl border border-line bg-bg/60 px-4 py-3 text-sm text-text outline-none transition placeholder:text-subtext/55 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
          />
          <button
            :disabled="loading"
            class="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            {{ loading ? '로그인 중…' : '로그인' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 메인 -->
    <div
      v-else
      class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-5 px-6 py-8 lg:grid-cols-[300px_1fr]"
    >
      <aside class="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-medium uppercase tracking-[0.22em] text-teal">
              Heritgo
            </p>
            <h1 class="mt-1 font-serif text-xl text-text">여행 대화</h1>
          </div>
          <div class="flex flex-col items-end gap-1">
            <button
              class="text-xs text-subtext transition hover:text-primary"
              @click="emit('home')"
            >
              문화유산 목록
            </button>
          </div>
        </div>
        <button
          class="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 active:scale-95"
          @click="startNewSession"
        >
          새 대화 시작
        </button>
        <div class="mt-5 space-y-1.5">
          <button
            v-for="session in sessions"
            :key="session.session_id"
            class="w-full rounded-xl border px-4 py-3 text-left transition"
            :class="
              selectedSession?.session_id === session.session_id
                ? 'border-teal bg-teal/10 text-primary'
                : 'border-transparent bg-bg/60 text-text hover:border-line hover:bg-surface'
            "
            @click="selectSession(session)"
          >
            <span class="block truncate text-sm font-medium">{{ session.title }}</span>
            <span class="mt-0.5 block text-[11px] text-subtext">세션 #{{ session.session_id }}</span>
          </button>
          <p v-if="!sessions.length" class="px-2 py-8 text-center text-sm text-subtext">
            첫 질문을 보내면 새 대화가 만들어집니다.
          </p>
        </div>
      </aside>

      <section
        class="flex min-h-[calc(100vh-8rem)] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
      >
        <header class="border-b border-line px-6 py-5">
          <h2 class="font-serif text-xl text-text">{{ activeSessionTitle }}</h2>
          <p class="mt-1 text-xs text-subtext">
            OpenAI 기반 답변과 관련 문화유산 정보를 확인합니다.
          </p>
        </header>
        <div
          v-if="error"
          class="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ error }}
        </div>

        <div
          ref="messagePanel"
          class="flex-1 overflow-y-auto bg-bg/45 px-5 py-6 sm:px-8"
        >
          <div class="mx-auto max-w-3xl space-y-4">
            <div
              v-if="!messages.length"
              class="rounded-2xl border border-dashed border-line bg-surface p-7"
            >
              <h3 class="font-serif text-lg text-text">이런 질문으로 시작해 보세요</h3>
              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  v-for="item in quickQuestions"
                  :key="item"
                  class="rounded-full border border-line bg-surface px-4 py-2 text-sm text-subtext transition hover:border-teal hover:text-teal"
                  @click="question = item"
                >
                  {{ item }}
                </button>
              </div>
            </div>

            <div
              v-for="message in messages"
              :key="message.id"
              class="flex"
              :class="message.sender_type === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm"
                :class="
                  message.sender_type === 'user'
                    ? 'rounded-br-md bg-primary text-white'
                    : 'rounded-bl-md border border-line bg-surface text-text'
                "
              >
                <template v-if="message.status === 'pending'">
                  <div class="flex items-center gap-2 text-subtext">
                    <span class="flex items-center gap-1">
                      <span
                        class="h-1.5 w-1.5 animate-bounce rounded-full bg-teal [animation-delay:-0.3s]"
                      ></span>
                      <span
                        class="h-1.5 w-1.5 animate-bounce rounded-full bg-teal [animation-delay:-0.15s]"
                      ></span>
                      <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-teal"></span>
                    </span>
                    <span class="text-xs">답변을 작성하고 있어요</span>
                  </div>
                </template>
                <template v-else-if="message.status === 'failed'">
                  <p class="font-medium text-red-700">답변 생성에 실패했습니다.</p>
                  <p class="mt-1 text-xs text-red-600">
                    {{ message.error_message || '잠시 후 다시 질문해 주세요.' }}
                  </p>
                </template>
                <template v-else>{{ message.content }}</template>
              </div>
            </div>

            <section v-if="relatedHeritages.length" class="pt-2">
              <p
                class="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal"
              >
                Search Results
              </p>
              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <article
                  v-for="heritage in relatedHeritages"
                  :key="heritage.heritage_id"
                  class="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:border-teal/40"
                >
                  <img
                    v-if="heritage.image_url"
                    :src="heritage.image_url"
                    :alt="heritage.name"
                    class="h-32 w-full object-cover"
                  />
                  <div class="p-4">
                    <h3 class="font-serif text-lg text-text">{{ heritage.name }}</h3>
                    <p class="mt-1 text-xs text-subtext">
                      {{ heritage.location || '위치 정보 없음'
                      }}<span v-if="heritage.category_name">
                        · {{ heritage.category_name }}</span
                      >
                    </p>
                    <p class="mt-3 line-clamp-3 text-xs leading-5 text-subtext">
                      {{ heritage.description || '상세 설명이 없습니다.' }}
                    </p>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </div>

        <footer class="border-t border-line bg-surface p-4 sm:px-8">
          <form class="mx-auto flex max-w-3xl gap-3" @submit.prevent="submitQuestion">
            <textarea
              v-model="question"
              rows="1"
              maxlength="2000"
              placeholder="궁금한 문화유산이나 여행 조건을 입력하세요"
              class="min-h-12 flex-1 resize-none rounded-xl border border-line bg-bg/60 px-4 py-3 text-sm text-text outline-none transition placeholder:text-subtext/55 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
              @keydown.enter.exact.prevent="submitQuestion"
            ></textarea>
            <button
              :disabled="sending || !question.trim()"
              class="rounded-xl bg-primary px-6 text-sm font-medium text-white transition hover:brightness-110 active:scale-95 disabled:opacity-40"
            >
              {{ sending ? '전송 중…' : '전송' }}
            </button>
          </form>
          <p
            v-if="hasPendingAnswer"
            class="mx-auto mt-2 max-w-3xl text-xs text-subtext"
          >
            답변 생성 중인 메시지는 잠시 후 완료 상태로 갱신됩니다.
          </p>
        </footer>
      </section>
    </div>
  </main>
</template>
