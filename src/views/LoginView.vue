<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/AuthLayout.vue'
import { getErrorMessage, login, saveSession } from '@/api/auth'

const router = useRouter()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

async function submitLogin() {
  errorMessage.value = ''
  loading.value = true
  try {
    const data = await login(form)
    saveSession(data)
    router.push('/')
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '로그인하지 못했어요. 아이디와 비밀번호를 다시 확인해 주세요.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
    eyebrow="WELCOME BACK"
    title="다시 만나 반가워요"
    description="로그인하고 저장해 둔 문화유산 여행을 이어가세요."
    @home="router.push('/')"
  >
    <form class="space-y-5" @submit.prevent="submitLogin">
      <label class="block">
        <span class="mb-2 block text-sm font-medium text-text">아이디</span>
        <input
          v-model.trim="form.username"
          type="text"
          autocomplete="username"
          required
          autofocus
          placeholder="아이디를 입력해 주세요"
          class="w-full rounded-2xl border border-line bg-bg/60 px-4 py-3.5 text-sm text-text outline-none transition placeholder:text-subtext/55 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
        />
      </label>

      <label class="block">
        <span class="mb-2 block text-sm font-medium text-text">비밀번호</span>
        <span class="relative block">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            placeholder="비밀번호를 입력해 주세요"
            class="w-full rounded-2xl border border-line bg-bg/60 px-4 py-3.5 pr-16 text-sm text-text outline-none transition placeholder:text-subtext/55 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10"
          />
          <button type="button" class="absolute inset-y-0 right-4 text-xs font-medium text-subtext hover:text-teal" @click="showPassword = !showPassword">
            {{ showPassword ? '숨김' : '보기' }}
          </button>
        </span>
      </label>

      <p v-if="errorMessage" role="alert" class="rounded-2xl bg-coral/10 px-4 py-3 text-sm leading-6 text-coral">
        {{ errorMessage }}
      </p>

      <button type="submit" :disabled="loading" class="flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-sm font-medium text-white transition hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">
        {{ loading ? '로그인 중...' : '로그인' }}
      </button>
    </form>

    <p class="mt-7 text-center text-sm text-subtext">
      아직 Heritgo 회원이 아닌가요?
      <button type="button" class="ml-1 font-medium text-teal hover:underline" @click="router.push('/signup')">회원가입</button>
    </p>
  </AuthLayout>
</template>
