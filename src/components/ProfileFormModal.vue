<script setup>
import { ref, reactive, computed } from 'vue'
import {
  AGE_GROUPS,
  LANGUAGES,
  TRAVEL_PURPOSES,
  DURATIONS,
  createProfile,
  updateProfile,
  canUseAuthFeature,
  LOGIN_URL,
} from '@/api/profile'

const props = defineProps({
  // 생성 모드: heritageId(+heritageName) 전달
  heritageId: { type: [Number, String], default: null },
  heritageName: { type: String, default: '' },
  // 수정 모드: 기존 profile 전달
  profile: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => !!props.profile?.id)
const needsLogin = ref(!canUseAuthFeature())

// 폼 상태 (수정 모드면 기존 값으로 초기화)
const form = reactive({
  party_size: props.profile?.party_size ?? 2,
  age_group: props.profile?.age_group ?? 'adult',
  language_code: props.profile?.language_code ?? 'ko',
  travel_purpose: props.profile?.travel_purpose ?? 'family',
  preferred_duration_minutes: props.profile?.preferred_duration_minutes ?? 120,
})

const submitting = ref(false)
const error = ref('')
const saved = ref(null) // 성공한 프로필

const partyError = computed(() => {
  const n = Number(form.party_size)
  if (!Number.isInteger(n) || n < 1) return '인원 수는 1명 이상이어야 해요.'
  return ''
})
const canSubmit = computed(() => !partyError.value && !submitting.value)

async function onSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = ''
  try {
    const payload = {
      party_size: Number(form.party_size),
      age_group: form.age_group,
      language_code: form.language_code,
      travel_purpose: form.travel_purpose,
      preferred_duration_minutes: Number(form.preferred_duration_minutes),
    }
    let result
    if (isEdit.value) {
      result = await updateProfile(props.profile.id, payload)
    } else {
      result = await createProfile({
        heritage_id: Number(props.heritageId),
        ...payload,
      })
    }
    saved.value = result
  } catch (e) {
    const status = e?.response?.status
    if (status === 401 || status === 403) {
      needsLogin.value = true
    } else {
      error.value = '저장에 실패했어요. 잠시 후 다시 시도해 주세요.'
    }
  } finally {
    submitting.value = false
  }
}

function goLogin() {
  window.location.href = LOGIN_URL
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    @click.self="emit('close')"
  >
    <div
      class="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface shadow-xl sm:rounded-3xl"
    >
      <!-- 헤더 -->
      <div
        class="sticky top-0 flex items-start justify-between gap-4 rounded-t-3xl bg-surface px-6 pb-2 pt-6"
      >
        <div>
          <h2 class="font-serif text-xl text-text">
            {{ isEdit ? '가이드 조건 수정' : 'AI 가이드 만들기' }}
          </h2>
          <p class="mt-1 text-sm text-subtext">
            <template v-if="isEdit">조건을 바꾸면 가이드도 달라져요.</template>
            <template v-else-if="heritageName">
              <span class="text-teal">{{ heritageName }}</span> 맞춤 가이드를
              위한 조건이에요.
            </template>
            <template v-else>여행 조건을 알려주세요.</template>
          </p>
        </div>
        <button
          class="-mr-1 shrink-0 rounded-full p-1.5 text-subtext transition-colors hover:bg-line/50 hover:text-text"
          aria-label="닫기"
          @click="emit('close')"
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

      <!-- 로그인 필요 -->
      <div v-if="needsLogin" class="px-6 py-10 text-center">
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal"
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
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 class="font-serif text-lg text-text">로그인이 필요해요</h3>
        <p class="mx-auto mt-2 max-w-xs text-sm text-subtext">
          가이드 조건을 저장하려면 먼저 로그인해 주세요.
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            class="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
            @click="goLogin"
          >
            로그인하러 가기
          </button>
          <button
            class="rounded-full border border-line bg-surface px-6 py-2.5 text-sm font-medium text-text transition-colors hover:border-primary"
            @click="emit('close')"
          >
            닫기
          </button>
        </div>
      </div>

      <!-- 성공 -->
      <div v-else-if="saved" class="px-6 py-10 text-center">
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/12 text-teal"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 class="font-serif text-lg text-text">
          {{ isEdit ? '수정했어요' : '가이드 조건을 저장했어요' }}
        </h3>
        <p class="mt-2 text-sm text-subtext">
          입력하신 조건으로 맞춤 가이드를 준비할 수 있어요.
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            class="rounded-full bg-coral px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-105 active:scale-95"
            @click="emit('saved', saved)"
          >
            {{ isEdit ? '확인' : '내 가이드 보기' }}
          </button>
          <button
            v-if="!isEdit"
            class="rounded-full border border-line bg-surface px-6 py-2.5 text-sm font-medium text-text transition-colors hover:border-primary"
            @click="emit('close')"
          >
            닫기
          </button>
        </div>
      </div>

      <!-- 폼 -->
      <form v-else class="space-y-5 px-6 py-6" @submit.prevent="onSubmit">
        <!-- 인원 수 -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-text">
            인원 수
          </label>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-text transition-colors hover:border-teal hover:text-teal disabled:opacity-40"
              :disabled="Number(form.party_size) <= 1"
              aria-label="감소"
              @click="form.party_size = Math.max(1, Number(form.party_size) - 1)"
            >
              −
            </button>
            <input
              v-model.number="form.party_size"
              type="number"
              min="1"
              class="w-20 rounded-xl border border-line bg-surface py-2.5 text-center text-text focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
            <button
              type="button"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-text transition-colors hover:border-teal hover:text-teal"
              aria-label="증가"
              @click="form.party_size = Number(form.party_size) + 1"
            >
              +
            </button>
            <span class="text-sm text-subtext">명</span>
          </div>
          <p v-if="partyError" class="mt-1.5 text-xs text-coral">
            {{ partyError }}
          </p>
        </div>

        <!-- 연령대 -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-text">연령대</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="o in AGE_GROUPS"
              :key="o.value"
              type="button"
              class="rounded-full border px-4 py-2 text-sm transition-colors"
              :class="
                form.age_group === o.value
                  ? 'border-teal bg-teal/10 font-medium text-teal'
                  : 'border-line bg-surface text-subtext hover:border-teal/60'
              "
              @click="form.age_group = o.value"
            >
              {{ o.label }}
            </button>
          </div>
        </div>

        <!-- 언어 -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-text">언어</label>
          <select
            v-model="form.language_code"
            class="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-text focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option v-for="o in LANGUAGES" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </div>

        <!-- 여행 목적 -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-text">
            여행 목적
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="o in TRAVEL_PURPOSES"
              :key="o.value"
              type="button"
              class="rounded-xl border px-4 py-2.5 text-sm transition-colors"
              :class="
                form.travel_purpose === o.value
                  ? 'border-teal bg-teal/10 font-medium text-teal'
                  : 'border-line bg-surface text-subtext hover:border-teal/60'
              "
              @click="form.travel_purpose = o.value"
            >
              {{ o.label }}
            </button>
          </div>
        </div>

        <!-- 관람 시간 -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-text">
            관람 시간
          </label>
          <select
            v-model.number="form.preferred_duration_minutes"
            class="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-text focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option v-for="o in DURATIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </div>

        <!-- 에러 -->
        <p v-if="error" class="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">
          {{ error }}
        </p>

        <!-- 제출 -->
        <div class="flex gap-3 pt-1">
          <button
            type="submit"
            class="flex-1 rounded-full bg-coral px-6 py-3 text-sm font-medium text-white transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canSubmit"
          >
            {{ submitting ? '저장 중…' : isEdit ? '수정하기' : '가이드 만들기' }}
          </button>
          <button
            type="button"
            class="rounded-full border border-line bg-surface px-6 py-3 text-sm font-medium text-text transition-colors hover:border-primary"
            @click="emit('close')"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
