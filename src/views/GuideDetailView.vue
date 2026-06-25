<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getGuide } from '@/api/guide'
import { getHeritage } from '@/api/heritage'
import { LANGUAGES, labelOf } from '@/api/profile'
import GuideAudioPlayer from '@/components/GuideAudioPlayer.vue'
import { setChatbotPageContext } from '@/utils/chatbotContext'

const props = defineProps({
  guideId: { type: [Number, String], required: true },
})
const route = useRoute()
const router = useRouter()

const guide = ref(null)
const heritage = ref(null)
const loading = ref(false)
const error = ref(false)

async function load() {
  loading.value = true
  error.value = false
  guide.value = null
  heritage.value = null
  try {
    const g = await getGuide(props.guideId)
    guide.value = g
    if (g.heritage) {
      try {
        heritage.value = await getHeritage(g.heritage)
      } catch {
        heritage.value = null
      }
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.guideId, load)

watch(
  [guide, heritage],
  ([guideValue, heritageValue]) => {
    if (!guideValue) return

    setChatbotPageContext(route.fullPath, {
      page_type: 'guide_detail',
      source_title: heritageValue?.name || `Guide #${guideValue.id}`,
      guide_id: guideValue.id ?? props.guideId,
      heritage_id: guideValue.heritage,
      guide: {
        id: guideValue.id ?? props.guideId,
        heritage_id: guideValue.heritage,
        language_code: guideValue.language_code,
        language_label: labelOf(LANGUAGES, guideValue.language_code),
        content: guideValue.content,
        audio_url: guideValue.audio_url,
        created: guideValue.created,
      },
      heritage: heritageValue
        ? {
            id: heritageValue.heritage_id ?? guideValue.heritage,
            name: heritageValue.name,
            category_name: heritageValue.category_name,
            location: heritageValue.location || heritageValue.address,
            address: heritageValue.address,
            description: heritageValue.description,
            image_url: heritageValue.image_url,
          }
        : null,
    })
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen bg-bg pb-20">
    <div class="mx-auto max-w-3xl px-6 pt-10">
      <button
        class="mb-6 inline-flex items-center gap-1.5 text-sm text-subtext transition hover:text-primary"
        @click="router.push('/guides')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        내 가이드
      </button>

      <!-- 로딩 -->
      <div v-if="loading" class="space-y-4">
        <div class="h-8 w-1/2 animate-pulse rounded bg-line/70"></div>
        <div class="h-14 w-full animate-pulse rounded-2xl bg-line/60"></div>
        <div class="h-4 w-full animate-pulse rounded bg-line/50"></div>
        <div class="h-4 w-5/6 animate-pulse rounded bg-line/50"></div>
      </div>

      <!-- 에러 -->
      <div v-else-if="error" class="py-20 text-center">
        <h2 class="font-serif text-xl text-text">가이드를 불러오지 못했어요</h2>
        <p class="mt-2 text-sm text-subtext">잠시 후 다시 시도해 주세요.</p>
        <button
          class="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:brightness-110 active:scale-95"
          @click="load"
        >
          다시 시도
        </button>
      </div>

      <!-- 본문 -->
      <template v-else-if="guide">
        <p class="text-xs font-medium uppercase tracking-[0.25em] text-teal">
          AI Audio Guide
        </p>
        <h1 class="mt-2 font-serif text-3xl text-text">
          {{ heritage?.name || `국가유산 #${guide.heritage}` }}
        </h1>
        <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-subtext">
          <span
            v-if="heritage?.location"
            class="inline-flex items-center gap-1"
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
              class="text-coral"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {{ heritage.location }}
          </span>
          <span v-if="heritage?.location" class="text-line">·</span>
          <span>{{ labelOf(LANGUAGES, guide.language_code) }} 해설</span>
        </p>

        <!-- 유산 미리보기 + 바로가기 -->
        <button
          v-if="heritage"
          class="group mt-5 flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-3 text-left transition hover:border-teal hover:shadow-sm"
          @click="router.push(`/heritages/${guide.heritage}`)"
        >
          <span
            class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-line/50"
          >
            <img
              v-if="heritage.image_url"
              :src="heritage.image_url"
              :alt="heritage.name"
              class="h-full w-full object-cover"
              @error="(e) => (e.target.style.display = 'none')"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium text-text">유산 상세 보기</span>
            <span class="block truncate text-xs text-subtext">
              {{ heritage.name }} 정보와 위치를 확인해요
            </span>
          </span>
          <svg
            class="shrink-0 text-line transition group-hover:text-teal"
            width="20"
            height="20"
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

        <div class="mt-6">
          <GuideAudioPlayer
            :guide-id="guide.id"
            :audio-url="guide.audio_url"
            :title="heritage?.name || `오디오 가이드 #${guide.id}`"
          />
        </div>

        <article
          class="mt-7 whitespace-pre-line text-[16px] leading-[1.95] text-text/90"
        >
          {{ guide.content }}
        </article>
      </template>
    </div>
  </div>
</template>
