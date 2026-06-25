<script setup>
import { ref, onMounted } from 'vue'
import {
  getProfiles,
  getProfile,
  deleteProfile,
  AGE_GROUPS,
  LANGUAGES,
  TRAVEL_PURPOSES,
  DURATIONS,
  labelOf,
} from '@/api/profile'
import { getHeritage } from '@/api/heritage'
import ProfileFormModal from '@/components/ProfileFormModal.vue'
import HeritagePickerModal from '@/components/HeritagePickerModal.vue'
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
const heritageNames = ref({}) // { [heritage_id]: name }

const editing = ref(null) // 수정 중인 프로필
const editLoadingId = ref(null)
const confirmingId = ref(null) // 삭제 확인 중인 프로필
const deletingId = ref(null) // 삭제 진행 중

async function doDelete(p) {
  deletingId.value = p.id
  try {
    await deleteProfile(p.id)
    profiles.value = profiles.value.filter((x) => x.id !== p.id)
  } catch {
    /* 실패 시 그대로 둠 */
  } finally {
    deletingId.value = null
    confirmingId.value = null
  }
}

// 새 프로필 만들기: 유산 선택 → 조건 입력
const showPicker = ref(false)
const creatingFor = ref(null) // { heritageId, heritageName }

function onHeritagePicked(h) {
  showPicker.value = false
  creatingFor.value = { heritageId: h.heritage_id, heritageName: h.name }
}
function onCreated() {
  creatingFor.value = null
  fetchProfiles()
}

async function fetchProfiles() {
  loading.value = true
  error.value = false
  try {
    profiles.value = await getProfiles()
    resolveHeritageNames()
  } catch (e) {
    error.value = true
    profiles.value = []
  } finally {
    loading.value = false
  }
}

// 프로필에 연결된 유산명을 채워 넣음 (응답엔 id만 있어서 별도 조회)
async function resolveHeritageNames() {
  const ids = [
    ...new Set(profiles.value.map((p) => p.heritage_id).filter(Boolean)),
  ]
  await Promise.all(
    ids.map(async (id) => {
      if (heritageNames.value[id]) return
      try {
        const h = await getHeritage(id)
        heritageNames.value = { ...heritageNames.value, [id]: h?.name || '' }
      } catch {
        /* 이름 조회 실패는 무시 */
      }
    }),
  )
}

onMounted(fetchProfiles)

function heritageNameOf(p) {
  return (
    p.heritage_name || p.heritage?.name || heritageNames.value[p.heritage_id] || '연결된 유산'
  )
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
        Guide Profiles
      </p>
      <h1 class="mt-3 font-serif text-3xl text-text sm:text-4xl">
        가이드 프로필
      </h1>
      <p class="mt-2 text-sm text-subtext">
        유산별로 저장해 둔 여행 조건이에요. 이 조건으로 맞춤 가이드를 만들 수
        있어요.
      </p>
      <button
        class="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 active:scale-95"
        @click="showPicker = true"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        새 프로필 만들기
      </button>
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
        <h3 class="font-serif text-xl text-text">아직 만든 프로필이 없어요</h3>
        <p class="mt-2 text-sm text-subtext">
          유산을 골라 첫 여행 조건을 만들어 보세요.
        </p>
        <button
          class="mt-6 rounded-full bg-coral px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-105 active:scale-95"
          @click="showPicker = true"
        >
          새 프로필 만들기
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
            <div class="min-w-0">
              <button
                v-if="p.title"
                class="block max-w-full truncate text-left text-xs font-medium text-teal transition-colors hover:underline"
                @click="openHeritage(p.heritage_id)"
              >
                {{ heritageNameOf(p) }}
              </button>
              <h3
                v-if="p.title"
                class="font-serif text-lg text-text"
              >
                {{ p.title }}
              </h3>
              <button
                v-else
                class="text-left font-serif text-lg text-text transition-colors hover:text-teal"
                @click="openHeritage(p.heritage_id)"
              >
                {{ heritageNameOf(p) }}
              </button>
            </div>
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
              {{ p.travel_purpose ? labelOf(TRAVEL_PURPOSES, p.travel_purpose) : '선택 안 함' }}
            </dd>
            <dt class="text-subtext">관람 시간</dt>
            <dd class="text-right text-text">
              {{ labelOf(DURATIONS, p.preferred_duration_minutes) }}
            </dd>
          </dl>

          <!-- 삭제 확인 -->
          <div
            v-if="confirmingId === p.id"
            class="mt-5 flex items-center justify-end gap-2"
          >
            <span class="mr-auto text-sm text-subtext">삭제할까요?</span>
            <button
              class="rounded-full border border-line px-4 py-2 text-sm font-medium text-subtext transition hover:border-text hover:text-text"
              :disabled="deletingId === p.id"
              @click="confirmingId = null"
            >
              취소
            </button>
            <button
              class="rounded-full bg-coral px-4 py-2 text-sm font-medium text-white transition hover:brightness-105 active:scale-95 disabled:opacity-60"
              :disabled="deletingId === p.id"
              @click="doDelete(p)"
            >
              {{ deletingId === p.id ? '삭제 중…' : '삭제' }}
            </button>
          </div>

          <!-- 기본 액션 -->
          <div v-else class="mt-5 flex items-center justify-end gap-2">
            <button
              class="rounded-full border border-line p-2 text-subtext transition-colors hover:border-coral hover:text-coral"
              aria-label="삭제"
              @click="confirmingId = p.id"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </button>
            <button
              class="rounded-full border border-line px-4 py-2 text-sm font-medium text-text transition-colors hover:border-teal hover:text-teal disabled:opacity-50"
              :disabled="editLoadingId === p.id"
              @click="openEdit(p)"
            >
              {{ editLoadingId === p.id ? '여는 중…' : '조건 수정' }}
            </button>
          </div>
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

    <!-- 새 프로필: 유산 선택 -->
    <HeritagePickerModal
      v-if="showPicker"
      @close="showPicker = false"
      @select="onHeritagePicked"
    />

    <!-- 새 프로필: 조건 입력 -->
    <ProfileFormModal
      v-if="creatingFor"
      :heritage-id="creatingFor.heritageId"
      :heritage-name="creatingFor.heritageName"
      @close="creatingFor = null"
      @saved="onCreated"
    />
  </div>
</template>
