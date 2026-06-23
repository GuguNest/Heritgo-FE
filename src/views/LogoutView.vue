<script setup>
import { computed, ref } from 'vue'
import AuthLayout from '@/components/AuthLayout.vue'
import { clearSession, getErrorMessage, getStoredUser, logout } from '@/api/auth'

const emit = defineEmits(['logout-success', 'cancel', 'home'])
const user = ref(getStoredUser())
const loading = ref(false)
const errorMessage = ref('')
const displayName = computed(() => user.value?.nickname || user.value?.username || '여행자')

async function submitLogout() {
  loading.value = true
  errorMessage.value = ''
  try {
    await logout()
    clearSession()
    emit('logout-success')
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
    eyebrow="SEE YOU AGAIN"
    :title="`${displayName}님, 잠시 떠나시나요?`"
    description="현재 기기에서 로그아웃합니다. 저장한 여행 정보는 그대로 보관돼요."
    @home="emit('home')"
  >
    <div class="rounded-3xl border border-line bg-bg/60 p-6 sm:p-8">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        </svg>
      </div>
      <h2 class="mt-5 font-serif text-xl font-bold text-text">로그아웃할까요?</h2>
      <p class="mt-2 text-sm leading-6 text-subtext">다시 이용하려면 아이디와 비밀번호를 입력해야 합니다.</p>

      <p v-if="errorMessage" role="alert" class="mt-5 rounded-2xl bg-coral/10 px-4 py-3 text-sm leading-6 text-coral">{{ errorMessage }}</p>

      <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
        <button type="button" class="flex-1 rounded-2xl border border-line bg-white px-5 py-3.5 text-sm font-medium text-subtext transition hover:border-teal hover:text-teal" @click="emit('cancel')">
          계속 둘러보기
        </button>
        <button type="button" :disabled="loading" class="flex-1 rounded-2xl bg-primary px-5 py-3.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" @click="submitLogout">
          {{ loading ? '로그아웃 중...' : '로그아웃' }}
        </button>
      </div>
    </div>
  </AuthLayout>
</template>
