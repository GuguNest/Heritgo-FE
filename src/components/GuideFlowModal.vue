<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  getProfiles,
  AGE_GROUPS,
  LANGUAGES,
  TRAVEL_PURPOSES,
  DURATIONS,
  labelOf,
} from '@/api/profile'
import { streamGuide } from '@/api/guide'
import ProfileFormModal from '@/components/ProfileFormModal.vue'
import GuideAudioPlayer from '@/components/GuideAudioPlayer.vue'

const props = defineProps({
  heritageId: { type: [Number, String], required: true },
  heritageName: { type: String, default: '' },
})
const emit = defineEmits(['close', 'open-guide'])

// step: 'profile' | 'generating' | 'result' | 'error'
const step = ref('profile')
const loadingProfiles = ref(false)
const profiles = ref([])
const showProfileForm = ref(false)

const content = ref('')
const guideId = ref(null)
const errorMsg = ref('')
let controller = null

const myProfiles = computed(() =>
  profiles.value.filter((p) => Number(p.heritage_id) === Number(props.heritageId)),
)

function summary(p) {
  return [
    `${p.party_size}명`,
    labelOf(AGE_GROUPS, p.age_group),
    labelOf(LANGUAGES, p.language_code),
    labelOf(TRAVEL_PURPOSES, p.travel_purpose),
    labelOf(DURATIONS, p.preferred_duration_minutes),
  ].join(' · ')
}

async function loadProfiles() {
  loadingProfiles.value = true
  try {
    profiles.value = await getProfiles()
  } catch {
    profiles.value = []
  } finally {
    loadingProfiles.value = false
  }
}
onMounted(loadProfiles)

async function startGenerate(profileId) {
  step.value = 'generating'
  content.value = ''
  guideId.value = null
  errorMsg.value = ''
  controller = new AbortController()
  try {
    const { guideId: id } = await streamGuide(profileId, {
      onDelta: (_d, full) => {
        content.value = full
      },
      signal: controller.signal,
    })
    guideId.value = id
    step.value = 'result'
  } catch (e) {
    if (e?.name === 'AbortError') return
    errorMsg.value = e?.message || '가이드를 생성하지 못했어요.'
    step.value = 'error'
  } finally {
    controller = null
  }
}

function cancelGenerate() {
  controller?.abort()
  step.value = 'profile'
}

function onProfileCreated(profile) {
  showProfileForm.value = false
  if (profile?.id) startGenerate(profile.id)
}

function close() {
  controller?.abort()
  emit('close')
}

onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    @click.self="close"
  >
    <div
      class="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-xl sm:rounded-3xl"
    >
      <!-- 헤더 -->
      <div class="flex items-start justify-between gap-4 px-6 pb-3 pt-6">
        <div>
          <h2 class="font-serif text-xl text-text">AI 음성 가이드</h2>
          <p class="mt-1 text-sm text-subtext">
            <span class="text-teal">{{ heritageName }}</span> 맞춤 해설
          </p>
        </div>
        <button
          class="-mr-1 shrink-0 rounded-full p-1.5 text-subtext transition hover:bg-line/50 hover:text-text"
          aria-label="닫기"
          @click="close"
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
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <!-- STEP 1. 프로필 선택 -->
        <div v-if="step === 'profile'">
          <p class="mb-3 text-sm text-subtext">
            여행 조건을 고르면 그에 맞춘 해설을 만들어 드려요.
          </p>

          <div v-if="loadingProfiles" class="space-y-2.5">
            <div
              v-for="i in 2"
              :key="i"
              class="h-16 animate-pulse rounded-2xl bg-line/60"
            ></div>
          </div>

          <template v-else>
            <ul v-if="myProfiles.length" class="space-y-2.5">
              <li v-for="p in myProfiles" :key="p.id">
                <button
                  class="group flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left transition hover:border-teal hover:bg-teal/5"
                  @click="startGenerate(p.id)"
                >
                  <span>
                    <span class="block text-sm font-medium text-text">
                      {{ p.party_size }}명 · {{ labelOf(TRAVEL_PURPOSES, p.travel_purpose) }}
                    </span>
                    <span class="mt-0.5 block text-xs text-subtext">{{ summary(p) }}</span>
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
              </li>
            </ul>

            <p v-else class="rounded-2xl bg-bg px-4 py-6 text-center text-sm text-subtext">
              이 유산에 저장된 여행 조건이 아직 없어요.<br />
              새 조건을 만들어 가이드를 시작해 보세요.
            </p>

            <button
              class="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-4 py-3.5 text-sm font-medium text-teal transition hover:border-teal hover:bg-teal/5"
              @click="showProfileForm = true"
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
                <path d="M12 5v14M5 12h14" />
              </svg>
              새 여행 조건 만들기
            </button>
          </template>
        </div>

        <!-- STEP 2. 생성 중 (스트리밍) -->
        <div v-else-if="step === 'generating'">
          <div class="mb-3 flex items-center gap-2 text-sm text-teal">
            <svg
              class="animate-spin"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M21 12a9 9 0 1 1-6.2-8.5" />
            </svg>
            해설을 쓰는 중이에요…
          </div>
          <div
            class="min-h-[160px] rounded-2xl border border-line bg-bg/60 p-4 text-[15px] leading-[1.9] text-text"
          >
            <span class="whitespace-pre-line">{{ content }}</span><span
              class="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-teal align-middle"
            ></span>
          </div>
          <button
            class="mt-4 w-full rounded-2xl border border-line px-4 py-3 text-sm font-medium text-subtext transition hover:border-coral hover:text-coral"
            @click="cancelGenerate"
          >
            취소
          </button>
        </div>

        <!-- STEP 3. 결과 -->
        <div v-else-if="step === 'result'">
          <div
            class="max-h-[40vh] overflow-y-auto whitespace-pre-line rounded-2xl border border-line bg-bg/40 p-4 text-[15px] leading-[1.9] text-text"
          >
            {{ content }}
          </div>

          <div class="mt-4">
            <GuideAudioPlayer v-if="guideId" :guide-id="guideId" />
          </div>

          <div class="mt-4 flex gap-3">
            <button
              class="flex-1 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-text transition hover:border-primary"
              @click="emit('open-guide', guideId)"
            >
              전체 화면으로 보기
            </button>
            <button
              class="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 active:scale-95"
              @click="close"
            >
              완료
            </button>
          </div>
        </div>

        <!-- 에러 -->
        <div v-else-if="step === 'error'" class="py-8 text-center">
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-coral/12 text-coral"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 9v4M12 17h.01" />
              <path
                d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              />
            </svg>
          </div>
          <h3 class="font-serif text-lg text-text">가이드를 만들지 못했어요</h3>
          <p class="mt-2 text-sm text-subtext">{{ errorMsg }}</p>
          <button
            class="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:brightness-110 active:scale-95"
            @click="step = 'profile'"
          >
            다시 선택하기
          </button>
        </div>
      </div>
    </div>

    <!-- 새 여행 조건 만들기 -->
    <ProfileFormModal
      v-if="showProfileForm"
      :heritage-id="heritageId"
      :heritage-name="heritageName"
      @close="showProfileForm = false"
      @saved="onProfileCreated"
    />
  </div>
</template>
