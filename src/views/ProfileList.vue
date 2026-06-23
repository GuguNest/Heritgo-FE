<script setup>
import { ref, onMounted } from 'vue'
import {
  getProfiles,
  getProfile,
  AGE_GROUPS,
  LANGUAGES,
  TRAVEL_PURPOSES,
  DURATIONS,
  labelOf,
} from '@/api/profile'
import ProfileFormModal from '@/components/ProfileFormModal.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
function goHome() {
  router.push({ name: 'heritage-list' })
}
function openHeritage(id) {
  router.push({ name: 'heritage-detail', params: { id } })
}

const profiles = ref([])
const loading = ref(false)
const error = ref(false)

const editing = ref(null) // 수정 중인 프로필
const editLoadingId = ref(null)

async function fetchProfiles() {
  loading.value = true
  error.value = false
  try {
    profiles.value = await getProfiles()
  } catch (e) {
    error.value = true
    profiles.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfiles)

function heritageNameOf(p) {
  return p.heritage_name || p.heritage?.name || `국가유산 #${p.heritage_id}`
}

async function openEdit(p) {
  editLoadingId.value = p.id
  try {
    // 단건 조회로 최신 값 확보 후 수정
    editing.value = await getProfile(p.id)
  } catch (e) {
    editing.value = p // 실패 시 목록 데이터로 폴백
  } finally {
    editLoadingId.value = null
  }
}

function onSaved() {
  editing.value = null
  fetchProfiles()
}
</script>

<template>
  <div class="min-h-screen bg-bg pb-20">
    <!-- 헤더 -->
    <header class="mx-auto max-w-4xl px-6 pt-12 sm:pt-16">
      <button
        class="mb-6 inline-flex items-center gap-1.5 text-sm text-subtext transition-colors hover:text-primary"
        @click="goHome"
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
        둘러보기로
      </button>
      <p
        class="text-sm font-medium uppercase tracking-[0.3em] text-teal"
      >
        My Guides
      </p>
      <h1 class="mt-3 font-serif text-3xl text-text sm:text-4xl">내 가이드</h1>
      <p class="mt-2 text-sm text-subtext">
        저장해 둔 여행 조건으로 언제든 맞춤 가이드를 받아보세요.
      </p>
    </header>

    <main class="mx-auto max-w-4xl px-6 pt-8">
      <!-- 로딩 -->
      <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          v-for="i in 4"
          :key="i"
          class="h-36 animate-pulse rounded-3xl bg-line/70"
        ></div>
      </div>

      <!-- 에러 -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center px-6 py-20 text-center"
      >
        <h3 class="font-serif text-xl text-text">목록을 불러오지 못했어요</h3>
        <p class="mt-2 text-sm text-subtext">
          로그인 상태와 서버 연결을 확인해 주세요.
        </p>
        <button
          class="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          @click="fetchProfiles"
        >
          다시 시도
        </button>
      </div>

      <!-- 비어 있음 -->
      <div
        v-else-if="profiles.length === 0"
        class="flex flex-col items-center justify-center px-6 py-20 text-center"
      >
        <div
          class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal"
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
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <h3 class="font-serif text-xl text-text">아직 만든 가이드가 없어요</h3>
        <p class="mt-2 text-sm text-subtext">
          유산 상세 페이지에서 ‘가이드 만들기’로 첫 가이드를 만들어 보세요.
        </p>
        <button
          class="mt-6 rounded-full bg-coral px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-105 active:scale-95"
          @click="goHome"
        >
          유산 둘러보기
        </button>
      </div>

      <!-- 카드 목록 -->
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article
          v-for="p in profiles"
          :key="p.id"
          class="flex flex-col rounded-3xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-3">
            <button
              class="text-left font-serif text-lg text-text transition-colors hover:text-teal"
              @click="openHeritage(p.heritage_id)"
            >
              {{ heritageNameOf(p) }}
            </button>
            <span
              class="shrink-0 rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal"
            >
              {{ p.party_size }}명
            </span>
          </div>

          <dl class="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt class="text-subtext">연령대</dt>
            <dd class="text-right text-text">
              {{ labelOf(AGE_GROUPS, p.age_group) }}
            </dd>
            <dt class="text-subtext">언어</dt>
            <dd class="text-right text-text">
              {{ labelOf(LANGUAGES, p.language_code) }}
            </dd>
            <dt class="text-subtext">목적</dt>
            <dd class="text-right text-text">
              {{ labelOf(TRAVEL_PURPOSES, p.travel_purpose) }}
            </dd>
            <dt class="text-subtext">관람 시간</dt>
            <dd class="text-right text-text">
              {{ labelOf(DURATIONS, p.preferred_duration_minutes) }}
            </dd>
          </dl>

          <button
            class="mt-5 self-end rounded-full border border-line px-4 py-2 text-sm font-medium text-text transition-colors hover:border-teal hover:text-teal disabled:opacity-50"
            :disabled="editLoadingId === p.id"
            @click="openEdit(p)"
          >
            {{ editLoadingId === p.id ? '여는 중…' : '조건 수정' }}
          </button>
        </article>
      </div>
    </main>

    <!-- 수정 모달 -->
    <ProfileFormModal
      v-if="editing"
      :profile="editing"
      @close="editing = null"
      @saved="onSaved"
    />
  </div>
</template>
