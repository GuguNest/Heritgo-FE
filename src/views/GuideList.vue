<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getGuides } from '@/api/guide'
import { getHeritage } from '@/api/heritage'
import { LANGUAGES, labelOf } from '@/api/profile'

const router = useRouter()
const PAGE_SIZE = 20

const guides = ref([])
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)
const loading = ref(false)
const error = ref(false)
const heritageNames = ref({}) // { [heritage_id]: name }

async function fetchGuides() {
  loading.value = true
  error.value = false
  try {
    const data = await getGuides({ page: page.value, size: PAGE_SIZE })
    guides.value = data.items ?? []
    total.value = data.total ?? 0
    totalPages.value = data.total_pages ?? 1
    page.value = data.page ?? page.value
    resolveHeritageNames()
  } catch {
    error.value = true
    guides.value = []
  } finally {
    loading.value = false
  }
}
onMounted(fetchGuides)

// 가이드가 어떤 유산인지 이름을 채워 넣음 (응답엔 id만 있음)
async function resolveHeritageNames() {
  const ids = [...new Set(guides.value.map((g) => g.heritage).filter(Boolean))]
  await Promise.all(
    ids.map(async (id) => {
      if (heritageNames.value[id]) return
      try {
        const h = await getHeritage(id)
        heritageNames.value = { ...heritageNames.value, [id]: h?.name || '' }
      } catch {
        /* 무시 */
      }
    }),
  )
}
function heritageNameOf(g) {
  return heritageNames.value[g.heritage] || '국가유산 가이드'
}

function goPage(p) {
  if (p < 1 || p > totalPages.value || p === page.value || loading.value) return
  page.value = p
  fetchGuides()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function fmtDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}
function preview(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}
</script>

<template>
  <div class="min-h-screen bg-bg pb-20">
    <header class="mx-auto max-w-4xl px-6 pt-12 sm:pt-16">
      <p class="text-sm font-medium uppercase tracking-[0.3em] text-teal">
        My Audio Guides
      </p>
      <h1 class="mt-3 font-serif text-3xl text-text sm:text-4xl">내 가이드</h1>
      <p class="mt-2 text-sm text-subtext">
        만들어 둔 AI 음성 가이드를 언제든 다시 들어보세요.
      </p>
    </header>

    <main class="mx-auto max-w-4xl px-6 pt-8">
      <!-- 로딩 -->
      <div v-if="loading" class="space-y-4">
        <div
          v-for="i in 4"
          :key="i"
          class="h-28 animate-pulse rounded-3xl bg-line/60"
        ></div>
      </div>

      <!-- 에러 -->
      <div v-else-if="error" class="py-20 text-center">
        <h3 class="font-serif text-xl text-text">목록을 불러오지 못했어요</h3>
        <p class="mt-2 text-sm text-subtext">로그인 상태와 서버 연결을 확인해 주세요.</p>
        <button
          class="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:brightness-110 active:scale-95"
          @click="fetchGuides"
        >
          다시 시도
        </button>
      </div>

      <!-- 비어 있음 -->
      <div v-else-if="guides.length === 0" class="py-20 text-center">
        <div
          class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 10v4M7 7v10M12 4v16M17 8v8M21 11v2" />
          </svg>
        </div>
        <h3 class="font-serif text-xl text-text">아직 만든 가이드가 없어요</h3>
        <p class="mt-2 text-sm text-subtext">
          유산을 골라 첫 음성 가이드를 만들어 보세요.
        </p>
        <button
          class="mt-6 rounded-full bg-coral px-6 py-2.5 text-sm font-medium text-white transition hover:brightness-105 active:scale-95"
          @click="router.push('/')"
        >
          유산 둘러보기
        </button>
      </div>

      <!-- 목록 -->
      <template v-else>
        <ul class="space-y-4">
          <li v-for="g in guides" :key="g.id">
            <button
              class="group w-full rounded-3xl border border-line bg-surface p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              @click="router.push(`/guides/${g.id}`)"
            >
              <div class="mb-1 flex items-start justify-between gap-3">
                <h3 class="font-serif text-lg leading-snug text-text">
                  {{ heritageNameOf(g) }}
                </h3>
                <span class="shrink-0 pt-1 text-xs text-subtext">
                  {{ fmtDate(g.created) }}
                </span>
              </div>
              <div class="mb-2.5 flex items-center gap-2">
                <span
                  class="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal"
                >
                  {{ labelOf(LANGUAGES, g.language_code) }}
                </span>
                <span
                  class="inline-flex items-center gap-1 text-xs"
                  :class="g.audio_url ? 'text-coral' : 'text-subtext'"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 10v4M7 7v10M12 4v16M17 8v8M21 11v2" />
                  </svg>
                  {{ g.audio_url ? '음성 준비됨' : '음성 생성 가능' }}
                </span>
              </div>
              <p class="line-clamp-2 text-[15px] leading-relaxed text-subtext">
                {{ preview(g.content) }}
              </p>
              <span
                class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal"
              >
                들어보기
                <svg
                  class="transition group-hover:translate-x-0.5"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </button>
          </li>
        </ul>

        <!-- 페이지네이션 -->
        <nav
          v-if="totalPages > 1"
          class="mt-10 flex items-center justify-center gap-5"
        >
          <button
            class="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-text transition hover:border-primary hover:text-primary disabled:opacity-40"
            :disabled="page <= 1"
            aria-label="이전"
            @click="goPage(page - 1)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span class="text-sm text-subtext">
            <span class="font-medium text-text">{{ page }}</span>
            <span class="mx-1 text-line">/</span>{{ totalPages }}
          </span>
          <button
            class="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-text transition hover:border-primary hover:text-primary disabled:opacity-40"
            :disabled="page >= totalPages"
            aria-label="다음"
            @click="goPage(page + 1)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </nav>
      </template>
    </main>
  </div>
</template>
