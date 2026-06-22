<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getHeritage } from '@/api/heritage'

const props = defineProps({
  heritageId: { type: [Number, String], required: true },
})
const emit = defineEmits(['back'])

const data = ref(null)
const loading = ref(false)
const error = ref(null) // 'notfound' | 'fail' | null

async function fetchDetail() {
  loading.value = true
  error.value = null
  data.value = null
  try {
    data.value = await getHeritage(props.heritageId)
  } catch (e) {
    const status = e?.response?.status
    error.value = status === 404 ? 'notfound' : 'fail'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
watch(() => props.heritageId, fetchDetail)

const hasImage = computed(() => !!data.value?.image_url)
const locationText = computed(() => {
  const d = data.value
  if (!d) return ''
  return (
    d.location ||
    d.address ||
    [d.region, d.district].filter(Boolean).join(' ')
  )
})

// 카테고리 경로: "국가유산 > 사적 > ..." 형태 우선, 없으면 종목/카테고리로 대체
const breadcrumb = computed(() => {
  const d = data.value
  if (!d) return []
  if (d.category_path)
    return String(d.category_path)
      .split(/[>/›·]/)
      .map((s) => s.trim())
      .filter(Boolean)
  return [d.category_name, d.kind_name].filter(Boolean)
})

// 정보 행 (값 있는 것만 노출)
const infoRows = computed(() => {
  const d = data.value
  if (!d) return []
  return [
    { icon: 'tag', label: '종목', value: d.kind_name || d.category_name },
    { icon: 'pin', label: '소재지', value: d.address || locationText.value },
    { icon: 'clock', label: '시대', value: d.origin_period },
    { icon: 'office', label: '관리기관', value: d.admin_name },
  ].filter((r) => r.value)
})

const mapUrl = computed(() => {
  const d = data.value
  if (!d) return null
  if (d.latitude != null && d.longitude != null)
    return `https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`
  const q = [d.name, d.address || locationText.value].filter(Boolean).join(' ')
  return q
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
    : null
})
</script>

<template>
  <div class="min-h-screen bg-bg pb-20">
    <!-- 뒤로가기 (항상 노출) -->
    <button
      class="fixed left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-primary shadow-md backdrop-blur-md transition-transform hover:-translate-x-0.5 active:scale-95"
      aria-label="목록으로"
      @click="emit('back')"
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
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>

    <!-- 로딩 -->
    <div v-if="loading">
      <div class="h-[55vh] w-full animate-pulse bg-line/70"></div>
      <div class="mx-auto max-w-3xl space-y-4 px-6 pt-8">
        <div class="h-7 w-1/2 animate-pulse rounded bg-line/70"></div>
        <div class="h-4 w-full animate-pulse rounded bg-line/60"></div>
        <div class="h-4 w-5/6 animate-pulse rounded bg-line/60"></div>
        <div class="h-4 w-2/3 animate-pulse rounded bg-line/60"></div>
      </div>
    </div>

    <!-- 에러 / 404 -->
    <div
      v-else-if="error"
      class="flex min-h-screen flex-col items-center justify-center px-6 text-center"
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
        {{ error === 'notfound' ? '찾을 수 없는 유산이에요' : '정보를 불러오지 못했어요' }}
      </h3>
      <p class="mt-2 max-w-sm text-sm leading-relaxed text-subtext">
        {{
          error === 'notfound'
            ? '요청하신 국가유산이 존재하지 않거나 삭제되었어요.'
            : '상세 정보를 가져오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
        }}
      </p>
      <div class="mt-6 flex gap-3">
        <button
          v-if="error !== 'notfound'"
          class="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          @click="fetchDetail"
        >
          다시 시도
        </button>
        <button
          class="rounded-full border border-line bg-surface px-6 py-2.5 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary"
          @click="emit('back')"
        >
          목록으로
        </button>
      </div>
    </div>

    <!-- 상세 -->
    <template v-else-if="data">
      <!-- 히어로 -->
      <header class="relative h-[55vh] min-h-[360px] w-full overflow-hidden">
        <img
          v-if="hasImage"
          :src="data.image_url"
          :alt="data.name"
          class="absolute inset-0 h-full w-full object-cover"
          @error="(e) => (e.target.style.display = 'none')"
        />
        <div
          v-else
          class="absolute inset-0"
          style="
            background: radial-gradient(
              120% 100% at 50% 0%,
              #3b7c82 0%,
              #223a5e 70%
            );
          "
        ></div>
        <div
          class="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
        ></div>

        <div class="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-6 pb-8">
          <span
            v-if="data.category_name"
            class="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur-md"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-coral"></span>
            {{ data.category_name }}
          </span>
          <h1
            class="mt-3 font-serif text-3xl leading-tight text-white drop-shadow sm:text-4xl"
          >
            {{ data.name }}
          </h1>
          <p
            v-if="locationText"
            class="mt-2 flex items-center gap-1.5 text-sm text-white/85"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-coral"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {{ locationText }}
          </p>
        </div>
      </header>

      <!-- 본문 -->
      <main class="mx-auto max-w-3xl px-6">
        <!-- 카테고리 경로 -->
        <nav
          v-if="breadcrumb.length"
          class="flex flex-wrap items-center gap-1.5 pt-6 text-xs text-subtext"
        >
          <template v-for="(c, i) in breadcrumb" :key="i">
            <span>{{ c }}</span>
            <span v-if="i < breadcrumb.length - 1" class="text-line">›</span>
          </template>
        </nav>

        <!-- 이야기 -->
        <section class="pt-8">
          <h2 class="font-serif text-xl text-text">이야기</h2>
          <p
            v-if="data.description"
            class="mt-4 whitespace-pre-line text-[15px] leading-[1.9] text-text/90"
          >
            {{ data.description }}
          </p>
          <p v-else class="mt-4 text-sm leading-relaxed text-subtext">
            아직 소개 글이 준비되지 않았어요. 아래 정보를 참고해 직접 만나보는
            건 어떨까요?
          </p>
        </section>

        <!-- 정보 -->
        <section v-if="infoRows.length" class="pt-10">
          <h2 class="font-serif text-xl text-text">한눈에 보기</h2>
          <dl class="mt-4 divide-y divide-line rounded-2xl bg-surface px-5 ring-1 ring-line">
            <div
              v-for="row in infoRows"
              :key="row.label"
              class="flex items-start gap-4 py-4"
            >
              <dt
                class="flex w-24 shrink-0 items-center gap-2 text-sm text-subtext"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-teal"
                >
                  <template v-if="row.icon === 'tag'">
                    <path
                      d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
                    />
                    <circle cx="7.5" cy="7.5" r="0.5" fill="currentColor" />
                  </template>
                  <template v-else-if="row.icon === 'pin'">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </template>
                  <template v-else-if="row.icon === 'clock'">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </template>
                  <template v-else>
                    <path d="M3 21h18" />
                    <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
                    <path d="M19 21V11a2 2 0 0 0-2-2h-2" />
                  </template>
                </svg>
                {{ row.label }}
              </dt>
              <dd class="text-[15px] text-text">{{ row.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- 지도 -->
        <section v-if="mapUrl" class="pt-8">
          <a
            :href="mapUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3.5 text-sm font-medium text-white transition-all hover:brightness-105 active:scale-95"
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
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            지도에서 길 찾기
          </a>
        </section>

        <!-- 목록으로 -->
        <div class="pt-10 text-center">
          <button
            class="text-sm text-subtext underline-offset-4 transition-colors hover:text-primary hover:underline"
            @click="emit('back')"
          >
            ← 다른 유산 둘러보기
          </button>
        </div>
      </main>
    </template>
  </div>
</template>
