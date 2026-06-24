<script setup>
import { computed } from 'vue'

const props = defineProps({
  heritage: {
    type: Object,
    required: true,
  },
})
const emit = defineEmits(['select'])

// 종목별 포인트 색 — 칩의 작은 점으로만 은은하게 표현 (요란한 색 박스 X)
const CATEGORY_DOT = {
  국보: '#b3801f', // deep gold
  보물: '#c99a3f', // gold
  사적: '#e2682e', // 주황
  명승: '#2f7d74', // teal
  천연기념물: '#5a8c5e',
  국가무형유산: '#9a6a8c',
  국가민속문화유산: '#a06a3a',
  등록문화유산: '#4f6b66',
}
const PALETTE = ['#e2682e', '#2f7d74', '#c99a3f', '#5a8c5e', '#9a6a8c']

const dotColor = computed(() => {
  const name = props.heritage.category_name || ''
  if (CATEGORY_DOT[name]) return CATEGORY_DOT[name]
  if (!name) return '#2f7d74'
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
})

const hasImage = computed(() => !!props.heritage.image_url)
const locationText = computed(
  () =>
    props.heritage.location ||
    [props.heritage.region, props.heritage.district].filter(Boolean).join(' '),
)
</script>

<template>
  <article
    class="group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-3xl bg-text/80 shadow-sm ring-1 ring-line transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl"
    role="button"
    tabindex="0"
    @click="emit('select', heritage.heritage_id)"
    @keydown.enter="emit('select', heritage.heritage_id)"
  >
    <!-- 대표 이미지 -->
    <img
      v-if="hasImage"
      :src="heritage.image_url"
      :alt="heritage.name"
      loading="lazy"
      class="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
      @error="(e) => (e.target.style.display = 'none')"
    />
    <!-- 이미지 없을 때: 은은한 한국적 그라데이션 -->
    <div
      v-else
      class="absolute inset-0"
      style="
        background: radial-gradient(
          120% 100% at 50% 0%,
          #2f7d74 0%,
          #2a2622 70%
        );
      "
    >
      <svg
        class="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 text-white/15"
        width="120"
        height="120"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="0.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 21h18" />
        <path d="M5 21V9l7-5 7 5v12" />
        <path d="M9 21v-7h6v7" />
      </svg>
    </div>

    <!-- 하단 가독성 그라데이션 -->
    <div
      class="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
    ></div>

    <!-- 카테고리 칩 (프로스티드 글래스) -->
    <span
      v-if="heritage.category_name"
      class="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-text shadow-sm backdrop-blur-md"
    >
      <span
        class="h-1.5 w-1.5 rounded-full"
        :style="{ backgroundColor: dotColor }"
      ></span>
      {{ heritage.category_name }}
    </span>

    <!-- 텍스트 오버레이 -->
    <div class="absolute inset-x-0 bottom-0 p-5">
      <h3 class="font-serif text-xl leading-snug text-white drop-shadow-sm">
        {{ heritage.name }}
      </h3>
      <p class="mt-1.5 flex items-center gap-1.5 text-sm text-white/85">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="shrink-0 text-coral"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span class="truncate">{{ locationText || '위치 정보 없음' }}</span>
      </p>
      <p
        v-if="heritage.admin_name"
        class="mt-2 max-h-0 overflow-hidden text-xs text-white/60 opacity-0 transition-all duration-500 group-hover:max-h-8 group-hover:opacity-100"
      >
        {{ heritage.admin_name }}
      </p>
    </div>
  </article>
</template>
