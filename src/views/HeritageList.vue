<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHeritages } from '@/api/heritage'
import HeritageCard from '@/components/HeritageCard.vue'

// KeepAlive include 매칭용 컴포넌트 이름
defineOptions({ name: 'HeritageList' })

const router = useRouter()
function openDetail(id) {
  router.push({ name: 'heritage-detail', params: { id } })
}

const PAGE_SIZE = 20

const keyword = ref('')
const submittedKeyword = ref('')

const items = ref([])
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)

const loading = ref(false)
const error = ref(false)
const errorKind = ref('') // 'upstream'(502, 공공 API) | 'down'(서버/네트워크)

// 탐험을 유도하는 추천 검색어
const suggestions = ['경복궁', '창덕궁', '종묘', '불국사', '수원화성', '석굴암']

async function fetchList() {
  loading.value = true
  error.value = false
  try {
    const data = await getHeritages({
      keyword: submittedKeyword.value,
      page: page.value,
      size: PAGE_SIZE,
    })
    items.value = data.items ?? []
    total.value = data.total ?? 0
    totalPages.value = data.total_pages ?? 1
    page.value = data.page ?? page.value
  } catch (e) {
    error.value = true
    // 502 = 공공 API 호출 실패(일시적인 경우 많음), 그 외/무응답 = 서버 다운
    errorKind.value = e?.response?.status === 502 ? 'upstream' : 'down'
    items.value = []
  } finally {
    loading.value = false
  }
}

function onSearch() {
  submittedKeyword.value = keyword.value.trim()
  page.value = 1
  fetchList()
}

function pickSuggestion(s) {
  keyword.value = s
  onSearch()
}

function goPage(p) {
  if (p < 1 || p > totalPages.value || p === page.value || loading.value) return
  page.value = p
  fetchList()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(fetchList)

const skeletons = reactive(Array.from({ length: 8 }))
</script>

<template>
  <div class="min-h-screen bg-bg">
    <!-- ── 히어로 ────────────────────────────────────────────── -->
    <section class="mx-auto max-w-6xl px-6 pb-4 pt-14 text-center sm:pt-20">
      <p
        class="text-sm font-medium uppercase tracking-[0.35em] text-teal sm:text-base"
      >
        HERITGO
        <span class="text-subtext/70">· Korean Heritage</span>
      </p>
      <h1
        class="mx-auto mt-4 max-w-2xl font-serif text-3xl leading-tight text-text sm:text-5xl sm:leading-[1.2]"
      >
        오늘, 어떤 유산을<br class="sm:hidden" />
        여행해볼까요?
      </h1>
      <p class="mx-auto mt-4 max-w-md text-sm text-subtext sm:text-base">
        도시의 골목부터 천년의 절터까지, 한국 곳곳에 숨은 이야기를 만나보세요.
      </p>

      <!-- 검색 바 -->
      <form
        class="mx-auto mt-9 flex max-w-xl items-center gap-2 rounded-full border border-line bg-surface p-2 shadow-sm transition-shadow focus-within:shadow-md"
        @submit.prevent="onSearch"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="ml-3 shrink-0 text-subtext"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="keyword"
          type="text"
          placeholder="가고 싶은 곳, 보고 싶은 유산을 검색하세요"
          class="min-w-0 flex-1 bg-transparent py-2 text-sm text-text placeholder:text-subtext focus:outline-none sm:text-base"
        />
        <button
          type="submit"
          class="shrink-0 rounded-full bg-coral px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-105 active:scale-95"
        >
          둘러보기
        </button>
      </form>

      <!-- 추천 검색어 -->
      <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          v-for="s in suggestions"
          :key="s"
          class="rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-subtext transition-colors hover:border-teal hover:text-teal"
          @click="pickSuggestion(s)"
        >
          {{ s }}
        </button>
      </div>
    </section>

    <!-- ── 목록 ──────────────────────────────────────────────── -->
    <main class="mx-auto max-w-6xl px-6 pb-20 pt-10">
      <!-- 섹션 헤더 -->
      <div
        v-if="!loading && !error && items.length"
        class="mb-6 flex items-end justify-between"
      >
        <h2 class="font-serif text-xl text-text sm:text-2xl">
          <template v-if="submittedKeyword">‘{{ submittedKeyword }}’ 여행</template>
          <template v-else>지금 떠나기 좋은 곳</template>
        </h2>
        <span class="text-sm text-subtext">{{ total }}곳</span>
      </div>

      <!-- 로딩 -->
      <div
        v-if="loading"
        class="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="(_, i) in skeletons"
          :key="i"
          class="aspect-[4/5] animate-pulse rounded-3xl bg-line/70"
        ></div>
      </div>

      <!-- 에러 -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center px-6 py-24 text-center"
      >
        <div
          class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-coral/12 text-coral"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path
              d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            />
          </svg>
        </div>
        <h3 class="font-serif text-xl text-text">
          {{ errorKind === 'upstream' ? '잠시 후 다시 시도해 주세요' : '잠시 길을 잃었어요' }}
        </h3>
        <p class="mt-2 max-w-sm text-sm leading-relaxed text-subtext">
          <template v-if="errorKind === 'upstream'">
            국가유산 공공 API가 잠시 응답하지 않았어요. 일시적인 경우가 많으니
            다시 시도해 보세요.
          </template>
          <template v-else>
            유산 정보를 불러오지 못했어요. 백엔드 서버(127.0.0.1:8000)가 켜져 있는지
            확인해 주세요. 첫 검색은 조금 느릴 수 있습니다.
          </template>
        </p>
        <button
          class="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          @click="fetchList"
        >
          다시 시도
        </button>
      </div>

      <!-- 결과 없음 -->
      <div
        v-else-if="items.length === 0"
        class="flex flex-col items-center justify-center px-6 py-24 text-center"
      >
        <div
          class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h3 class="font-serif text-xl text-text">아직 발견하지 못했어요</h3>
        <p class="mt-2 text-sm text-subtext">
          다른 키워드로 새로운 여행지를 찾아보세요.
        </p>
      </div>

      <!-- 카드 그리드 -->
      <template v-else>
        <div
          class="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
        >
          <HeritageCard
            v-for="item in items"
            :key="item.heritage_id"
            :heritage="item"
            @select="openDetail"
          />
        </div>

        <!-- 페이지네이션 -->
        <nav
          v-if="totalPages > 1"
          class="mt-14 flex items-center justify-center gap-5"
        >
          <button
            class="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-text transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-text"
            :disabled="page <= 1"
            aria-label="이전 페이지"
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
            <span class="mx-1 text-line">/</span>
            {{ totalPages }}
          </span>

          <button
            class="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-text transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-text"
            :disabled="page >= totalPages"
            aria-label="다음 페이지"
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

    <!-- ── 푸터 ──────────────────────────────────────────────── -->
    <footer class="pb-10 text-center text-xs text-subtext/70">
      국가유산청 공공데이터 기반 · 한국의 유산을 여행하다
    </footer>
  </div>
</template>
