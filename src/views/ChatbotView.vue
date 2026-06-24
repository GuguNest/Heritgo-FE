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
  <main class="min-h-screen bg-[#f4f0e8] text-[#20252c]">
    <div v-if="!authenticated" class="mx-auto flex min-h-screen max-w-md items-center px-5">
      <form class="w-full rounded-[2rem] border border-[#e2dbcf] bg-white p-8 shadow-sm" @submit.prevent="submitLogin">
        <p class="text-xs font-semibold tracking-[0.28em] text-[#3b7c82]">HERITGO CHATBOT</p>
        <h1 class="mt-3 font-serif text-3xl">문화유산 대화</h1>
        <p class="mt-2 text-sm leading-6 text-[#6e6a64]">실제 계정의 아이디(username)와 비밀번호로 로그인하세요.</p>
        <div v-if="error" class="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>
        <div class="mt-7 grid gap-4">
          <input v-model.trim="credentials.username" required autocomplete="username" placeholder="아이디" class="rounded-2xl border border-[#d8d0c3] px-4 py-3 outline-none focus:border-[#3b7c82]" />
          <input v-model="credentials.password" required type="password" autocomplete="current-password" placeholder="비밀번호" class="rounded-2xl border border-[#d8d0c3] px-4 py-3 outline-none focus:border-[#3b7c82]" />
          <button :disabled="loading" class="rounded-2xl bg-[#223a5e] px-5 py-3 font-medium text-white disabled:opacity-50">{{ loading ? '로그인 중…' : '로그인' }}</button>
        </div>
      </form>
    </div>

    <div v-else class="grid min-h-screen lg:grid-cols-[300px_1fr]">
      <aside class="border-r border-[#ddd5c8] bg-[#223a5e] p-5 text-white">
        <div class="flex items-center justify-between">
          <div><p class="text-[11px] tracking-[0.25em] text-white/60">HERITGO</p><h1 class="mt-1 font-serif text-2xl">여행 대화</h1></div>
          <div class="flex flex-col items-end gap-1">
            <button class="text-xs text-white/60 hover:text-white" @click="emit('home')">문화유산 목록</button>
            <button class="text-xs text-white/60 hover:text-white" @click="logout">로그아웃</button>
          </div>
        </div>
        <form class="mt-7 flex gap-2" @submit.prevent="addSession">
          <input v-model="newSessionTitle" required maxlength="100" placeholder="새 대화 제목" class="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2.5 text-sm outline-none placeholder:text-white/40 focus:bg-white/15" />
          <button class="rounded-xl bg-[#e58f6a] px-3 text-xl">+</button>
        </form>
        <div class="mt-5 space-y-2">
          <button v-for="session in sessions" :key="session.session_id" class="w-full rounded-2xl px-4 py-3 text-left transition" :class="selectedSession?.session_id === session.session_id ? 'bg-white text-[#223a5e]' : 'bg-white/5 text-white/80 hover:bg-white/10'" @click="selectSession(session)">
            <span class="block truncate text-sm font-medium">{{ session.title }}</span>
            <span class="mt-1 block text-[11px] opacity-50">세션 #{{ session.session_id }}</span>
          </button>
          <p v-if="!sessions.length" class="px-2 py-8 text-center text-sm text-white/50">새 대화를 만들어 주세요.</p>
        </div>
      </aside>

      <section class="flex min-h-screen min-w-0 flex-col">
        <header class="border-b border-[#ddd5c8] bg-white/80 px-6 py-5 backdrop-blur">
          <h2 class="font-serif text-2xl">{{ selectedSession?.title ?? '대화를 선택해 주세요' }}</h2>
          <p class="mt-1 text-xs text-[#7a746d]">OpenAI 기반 답변과 관련 문화유산 정보를 확인합니다.</p>
        </header>
        <div v-if="error" class="mx-6 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>

        <div ref="messagePanel" class="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div v-if="!selectedSession" class="grid h-full place-items-center"><p class="text-[#817a72]">왼쪽에서 대화를 선택하거나 만들어 주세요.</p></div>
          <div v-else class="mx-auto max-w-4xl space-y-5">
            <div v-if="!messages.length" class="rounded-3xl border border-dashed border-[#cec5b7] p-7">
              <h3 class="font-serif text-xl">이런 질문으로 시작해 보세요</h3>
              <div class="mt-4 flex flex-wrap gap-2">
                <button v-for="item in quickQuestions" :key="item" class="rounded-full border border-[#d8d0c3] bg-white px-4 py-2 text-sm hover:border-[#3b7c82] hover:text-[#3b7c82]" @click="question = item">{{ item }}</button>
              </div>
            </div>

            <div v-for="message in messages" :key="message.id" class="flex" :class="message.sender_type === 'user' ? 'justify-end' : 'justify-start'">
              <div class="max-w-[82%] rounded-3xl px-5 py-4 text-sm leading-7 shadow-sm" :class="message.sender_type === 'user' ? 'rounded-br-lg bg-[#223a5e] text-white' : 'rounded-bl-lg border border-[#e1d9cd] bg-white'">
                <template v-if="message.status === 'pending'">
                  <div class="flex items-center gap-2 text-[#6e6a64]"><span class="h-2 w-2 animate-pulse rounded-full bg-[#e58f6a]"></span><span>답변 생성 중</span></div>
                  <p class="mt-1 text-xs text-[#9a938a]">OpenAI 답변을 준비하고 있습니다.</p>
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
              <p class="mb-3 text-xs font-semibold tracking-[0.16em] text-[#3b7c82]">SEARCH RESULTS</p>
              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <article v-for="heritage in relatedHeritages" :key="heritage.heritage_id" class="overflow-hidden rounded-3xl border border-[#e1d9cd] bg-white shadow-sm">
                  <img v-if="heritage.image_url" :src="heritage.image_url" :alt="heritage.name" class="h-32 w-full object-cover" />
                  <div class="p-4">
                    <h3 class="font-serif text-lg">{{ heritage.name }}</h3>
                    <p class="mt-1 text-xs text-[#817a72]">{{ heritage.location || '위치 정보 없음' }}<span v-if="heritage.category_name"> · {{ heritage.category_name }}</span></p>
                    <p class="mt-3 line-clamp-3 text-xs leading-5 text-[#6e6a64]">{{ heritage.description || '상세 설명이 없습니다.' }}</p>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </div>

        <footer v-if="selectedSession" class="border-t border-[#ddd5c8] bg-white p-4 sm:px-8">
          <form class="mx-auto flex max-w-4xl gap-3" @submit.prevent="submitQuestion">
            <textarea v-model="question" rows="1" maxlength="2000" placeholder="궁금한 문화유산이나 여행 조건을 입력하세요" class="min-h-12 flex-1 resize-none rounded-2xl bg-[#f4f0e8] px-4 py-3 outline-none focus:ring-2 focus:ring-[#3b7c82]/30" @keydown.enter.exact.prevent="submitQuestion"></textarea>
            <button :disabled="sending || !question.trim()" class="rounded-2xl bg-[#e58f6a] px-6 font-medium text-white disabled:opacity-40">{{ sending ? '전송 중…' : '전송' }}</button>
          </form>
          <p v-if="hasPendingAnswer" class="mx-auto mt-2 max-w-4xl text-xs text-[#918a82]">답변 생성 중인 메시지는 잠시 후 완료 상태로 갱신됩니다.</p>
        </footer>
      </section>
    </div>
  </main>
</template>
