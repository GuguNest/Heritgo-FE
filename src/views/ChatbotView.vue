<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
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

const credentials = reactive({ username: '', password: '' })
const authenticated = ref(hasAccessToken())
const sessions = ref([])
const selectedSession = ref(null)
const messages = ref([])
const relatedHeritages = ref([])
const newSessionTitle = ref('')
const question = ref('')
const loading = ref(false)
const sending = ref(false)
const error = ref('')
const messagePanel = ref(null)

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

async function scrollToBottom() {
  await nextTick()
  if (messagePanel.value) {
    messagePanel.value.scrollTop = messagePanel.value.scrollHeight
  }
}

async function loadSessions() {
  error.value = ''
  loading.value = true
  try {
    sessions.value = await getSessions()
    authenticated.value = true
    if (!selectedSession.value && sessions.value.length) {
      await selectSession(sessions.value[0])
    }
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

async function addSession() {
  const title = newSessionTitle.value.trim()
  if (!title) return

  try {
    const session = await createSession({ title })
    sessions.value.unshift(session)
    newSessionTitle.value = ''
    await selectSession(session)
  } catch (requestError) {
    error.value = errorMessage(requestError)
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
  if (!content || !selectedSession.value || sending.value) return

  error.value = ''
  sending.value = true
  question.value = ''
  try {
    const result = await sendMessage(selectedSession.value.session_id, content)
    messages.value.push(result.user_message, result.assistant_message)
    relatedHeritages.value = result.related_heritages ?? []
    await scrollToBottom()
  } catch (requestError) {
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
          실제 계정의 아이디(username)와 비밀번호로 로그인하세요.
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
            <button
              class="text-xs text-subtext transition hover:text-primary"
              @click="logout"
            >
              로그아웃
            </button>
          </div>
        </div>
        <form class="mt-6 flex gap-2" @submit.prevent="addSession">
          <input
            v-model="newSessionTitle"
            required
            maxlength="100"
            placeholder="새 대화 제목"
            class="min-w-0 flex-1 rounded-xl border border-line bg-bg/60 px-4 py-2.5 text-sm text-text outline-none transition placeholder:text-subtext/55 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
          />
          <button
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xl leading-none text-white transition hover:brightness-110 active:scale-95"
            aria-label="새 대화 만들기"
          >
            +
          </button>
        </form>
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
            새 대화를 만들어 주세요.
          </p>
        </div>
      </aside>

      <section
        class="flex min-h-[calc(100vh-8rem)] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
      >
        <header class="border-b border-line px-6 py-5">
          <h2 class="font-serif text-xl text-text">
            {{ selectedSession?.title ?? '대화를 선택해 주세요' }}
          </h2>
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
          <div v-if="!selectedSession" class="grid h-full place-items-center text-center">
            <div>
              <div
                class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                </svg>
              </div>
              <p class="font-serif text-lg text-text">대화를 선택해 주세요</p>
              <p class="mt-2 text-sm text-subtext">
                왼쪽에서 대화를 선택하거나 새로 만들어 보세요.
              </p>
            </div>
          </div>
          <div v-else class="mx-auto max-w-3xl space-y-4">
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
                    <span class="h-2 w-2 animate-pulse rounded-full bg-teal"></span>
                    <span>답변 생성 중</span>
                  </div>
                  <p class="mt-1 text-xs text-subtext/80">
                    OpenAI 답변을 준비하고 있습니다.
                  </p>
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

        <footer
          v-if="selectedSession"
          class="border-t border-line bg-surface p-4 sm:px-8"
        >
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
