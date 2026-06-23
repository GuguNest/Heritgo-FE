<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/AuthLayout.vue'
import { getErrorMessage, signUp } from '@/api/auth'

const router = useRouter()

const form = reactive({
  username: '',
  email: '',
  nickname: '',
  password: '',
  password_confirm: '',
  is_agree_privacy: false,
  is_agree_ads: false,
})

const loading = ref(false)
const errorMessage = ref('')
const success = ref(false)
const showPassword = ref(false)
const passwordsMatch = computed(() => !form.password_confirm || form.password === form.password_confirm)

async function submitSignUp() {
  errorMessage.value = ''
  if (!passwordsMatch.value) {
    errorMessage.value = '비밀번호가 서로 일치하지 않아요.'
    return
  }

  loading.value = true
  try {
    await signUp(form)
    success.value = true
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '회원가입을 완료하지 못했어요. 입력한 내용을 다시 확인해 주세요.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
    eyebrow="BEGIN YOUR JOURNEY"
    title="여행을 함께 시작해요"
    description="간단한 정보만 입력하면 Heritgo의 문화유산 여행을 만날 수 있어요."
    @home="router.push('/')"
  >
    <div v-if="success" class="py-8 text-center">
      <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m5 12 4 4L19 6" />
        </svg>
      </span>
      <h2 class="mt-5 font-serif text-2xl font-bold text-text">가입이 완료되었어요</h2>
      <p class="mt-2 text-sm leading-6 text-subtext">이제 로그인하고 첫 여행을 시작해 보세요.</p>
      <button type="button" class="mt-7 rounded-2xl bg-primary px-7 py-3.5 text-sm font-medium text-white hover:brightness-110" @click="router.push('/login')">
        로그인하러 가기
      </button>
    </div>

    <form v-else class="space-y-4" @submit.prevent="submitSignUp">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-text">아이디</span>
          <input v-model.trim="form.username" type="text" autocomplete="username" required placeholder="사용할 아이디" class="auth-input" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-text">닉네임</span>
          <input v-model.trim="form.nickname" type="text" maxlength="20" required placeholder="여행자의 이름" class="auth-input" />
        </label>
      </div>

      <label class="block">
        <span class="mb-2 block text-sm font-medium text-text">이메일</span>
        <input v-model.trim="form.email" type="email" autocomplete="email" required placeholder="heritage@example.com" class="auth-input" />
      </label>

      <label class="block">
        <span class="mb-2 block text-sm font-medium text-text">비밀번호</span>
        <span class="relative block">
          <input v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" minlength="8" required placeholder="8자 이상 입력해 주세요" class="auth-input pr-16" />
          <button type="button" class="absolute inset-y-0 right-4 text-xs font-medium text-subtext hover:text-teal" @click="showPassword = !showPassword">
            {{ showPassword ? '숨김' : '보기' }}
          </button>
        </span>
      </label>

      <label class="block">
        <span class="mb-2 block text-sm font-medium text-text">비밀번호 확인</span>
        <input
          v-model="form.password_confirm"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          minlength="8"
          required
          placeholder="비밀번호를 한 번 더 입력해 주세요"
          :class="['auth-input', passwordsMatch ? '' : 'border-coral focus:border-coral focus:ring-coral/10']"
        />
        <span v-if="!passwordsMatch" class="mt-1.5 block text-xs text-coral">비밀번호가 서로 일치하지 않아요.</span>
      </label>

      <div class="space-y-3 rounded-2xl border border-line bg-bg/50 p-4">
        <label class="flex cursor-pointer items-start gap-3 text-sm text-text">
          <input v-model="form.is_agree_privacy" type="checkbox" required class="mt-0.5 h-4 w-4 accent-teal" />
          <span><strong class="font-medium text-teal">[필수]</strong> 개인정보 처리방침에 동의합니다.</span>
        </label>
        <label class="flex cursor-pointer items-start gap-3 text-sm text-subtext">
          <input v-model="form.is_agree_ads" type="checkbox" class="mt-0.5 h-4 w-4 accent-teal" />
          <span><strong class="font-medium">[선택]</strong> 여행 소식과 혜택을 받아봅니다.</span>
        </label>
      </div>

      <p v-if="errorMessage" role="alert" class="rounded-2xl bg-coral/10 px-4 py-3 text-sm leading-6 text-coral">{{ errorMessage }}</p>

      <button type="submit" :disabled="loading" class="flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-sm font-medium text-white transition hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">
        {{ loading ? '가입 중...' : '회원가입' }}
      </button>
    </form>

    <p v-if="!success" class="mt-6 text-center text-sm text-subtext">
      이미 계정이 있나요?
      <button type="button" class="ml-1 font-medium text-teal hover:underline" @click="router.push('/login')">로그인</button>
    </p>
  </AuthLayout>
</template>
