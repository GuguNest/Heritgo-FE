<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { generateTts } from '@/api/guide'

const props = defineProps({
  guideId: { type: [Number, String], required: true },
  audioUrl: { type: String, default: null },
})
const emit = defineEmits(['update:audioUrl'])

const audioEl = ref(null)
const src = ref(props.audioUrl)
watch(
  () => props.audioUrl,
  (v) => {
    src.value = v
  },
)

const generating = ref(false)
const error = ref('')

const playing = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const rate = ref(1)
const RATES = [0.75, 1, 1.25, 1.5]

const progress = computed(() =>
  duration.value ? (currentTime.value / duration.value) * 100 : 0,
)

function fmt(sec) {
  if (!Number.isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

async function createAudio() {
  generating.value = true
  error.value = ''
  try {
    const guide = await generateTts(props.guideId)
    src.value = guide.audio_url
    emit('update:audioUrl', guide.audio_url)
    // 메타데이터 로드 후 자동 재생
    await nextTickPlay()
  } catch (e) {
    const status = e?.response?.status
    error.value =
      status === 400
        ? '본문이 비어 있어 음성을 만들 수 없어요.'
        : '음성을 만들지 못했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    generating.value = false
  }
}

async function nextTickPlay() {
  await nextTick()
  try {
    await audioEl.value?.play()
  } catch {
    // 자동재생 차단 시 사용자가 직접 재생
  }
}

function toggle() {
  const el = audioEl.value
  if (!el) return
  if (el.paused) el.play()
  else el.pause()
}

function onLoaded() {
  duration.value = audioEl.value?.duration || 0
}
function onTime() {
  currentTime.value = audioEl.value?.currentTime || 0
}
function seek(e) {
  const el = audioEl.value
  if (!el || !duration.value) return
  el.currentTime = (Number(e.target.value) / 100) * duration.value
}
function setRate(r) {
  rate.value = r
  if (audioEl.value) audioEl.value.playbackRate = r
}

onBeforeUnmount(() => {
  audioEl.value?.pause()
})
</script>

<template>
  <div>
    <!-- 아직 음성 없음: 생성 CTA -->
    <div v-if="!src">
      <button
        class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-medium text-white transition hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
        :disabled="generating"
        @click="createAudio"
      >
        <svg
          v-if="!generating"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 10v4M7 7v10M12 4v16M17 8v8M21 11v2" />
        </svg>
        <svg
          v-else
          class="animate-spin"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M21 12a9 9 0 1 1-6.2-8.5" />
        </svg>
        {{ generating ? '음성을 만드는 중…' : '음성 생성하기' }}
      </button>
      <p v-if="error" class="mt-2 text-center text-sm text-coral">{{ error }}</p>
    </div>

    <!-- 플레이어 -->
    <div
      v-else
      class="rounded-2xl border border-line bg-surface p-4"
    >
      <audio
        ref="audioEl"
        :src="src"
        preload="metadata"
        @loadedmetadata="onLoaded"
        @timeupdate="onTime"
        @play="playing = true"
        @pause="playing = false"
        @ended="playing = false"
      ></audio>

      <div class="flex items-center gap-3">
        <button
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral text-white transition hover:brightness-105 active:scale-95"
          :aria-label="playing ? '일시정지' : '재생'"
          @click="toggle"
        >
          <svg
            v-if="!playing"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        </button>

        <div class="min-w-0 flex-1">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            :value="progress"
            class="h-1.5 w-full cursor-pointer accent-coral"
            aria-label="재생 위치"
            @input="seek"
          />
          <div class="mt-1 flex justify-between text-xs text-subtext">
            <span>{{ fmt(currentTime) }}</span>
            <span>{{ fmt(duration) }}</span>
          </div>
        </div>
      </div>

      <!-- 배속 -->
      <div class="mt-3 flex items-center gap-1.5">
        <span class="mr-1 text-xs text-subtext">배속</span>
        <button
          v-for="r in RATES"
          :key="r"
          class="rounded-full px-2.5 py-1 text-xs transition"
          :class="
            rate === r
              ? 'bg-teal/10 font-medium text-teal'
              : 'text-subtext hover:bg-line/50'
          "
          @click="setRate(r)"
        >
          {{ r }}x
        </button>
      </div>
    </div>
  </div>
</template>
