<script setup>
import { ref, computed, provide, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentUser } from '@/api/auth'

const route = useRoute()
const router = useRouter()

// 로고(홈) 클릭 시 홈 화면을 초기 상태로 리셋하기 위한 신호
const homeReset = ref(0)
provide('homeReset', homeReset)
function goHome() {
  homeReset.value++ // KeepAlive로 유지된 홈에 리셋 신호 전달
  if (route.path !== '/') router.push('/')
}

// 로그인/회원가입/로그아웃 화면에서는 헤더를 숨김
const isAuthRoute = computed(() => route.meta?.auth === true)
const isChatbotRoute = computed(() => route.name === 'chatbot')
const lastServicePath = ref('/')

const displayName = computed(
  () => currentUser.value?.nickname || currentUser.value?.username || '',
)
const initial = computed(() => displayName.value.charAt(0).toUpperCase() || '?')

// 유저 메뉴 드롭다운
const menuOpen = ref(false)
function go(path) {
  menuOpen.value = false
  router.push(path)
}

function toggleChatbot() {
  menuOpen.value = false
  if (isChatbotRoute.value) {
    router.push(lastServicePath.value)
    return
  }
  router.push({ name: 'chatbot', query: { from: lastServicePath.value } })
}

watch(
  () => route.fullPath,
  (path) => {
    if (!isChatbotRoute.value) {
      lastServicePath.value = path
    }
  },
  { immediate: true },
)
</script>

<template>
  <!-- 전역 헤더 -->
  <header
    v-if="!isAuthRoute"
    class="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-xl"
  >
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
      <!-- 로고 -->
      <button
        class="inline-flex items-center gap-2 rounded-xl py-1 pr-2 text-primary transition hover:opacity-70"
        @click="goHome"
      >
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 21h18" />
            <path d="M5 21V9l7-5 7 5v12" />
            <path d="M9 21v-7h6v7" />
          </svg>
        </span>
        <span class="font-serif text-xl font-bold">Heritgo</span>
      </button>

      <div class="flex items-center gap-2">
        <!-- 유저 메뉴 -->
        <div class="relative">
        <button
          class="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 transition hover:border-teal"
          :aria-label="currentUser ? '내 메뉴' : '로그인 메뉴'"
          @click="menuOpen = !menuOpen"
        >
          <span
            v-if="currentUser"
            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white"
          >
            {{ initial }}
          </span>
          <span
            v-else
            class="flex h-8 w-8 items-center justify-center rounded-full bg-line/60 text-subtext"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <svg
            class="text-subtext transition"
            :class="{ 'rotate-180': menuOpen }"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <!-- 드롭다운 -->
        <template v-if="menuOpen">
          <div class="fixed inset-0 z-40" @click="menuOpen = false"></div>
          <div
            class="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-lg"
          >
            <template v-if="currentUser">
              <div class="px-4 py-2.5">
                <p class="text-sm font-medium text-text">{{ displayName }}님</p>
                <p class="text-xs text-subtext">반가워요</p>
              </div>
              <div class="my-1 border-t border-line/70"></div>
              <button
                class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text transition hover:bg-line/50"
                @click="go('/guides')"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-teal"
                >
                  <path d="M3 10v4M7 7v10M12 4v16M17 8v8M21 11v2" />
                </svg>
                내 가이드
              </button>
              <button
                class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text transition hover:bg-line/50"
                @click="go('/profiles')"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-subtext"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                가이드 프로필
              </button>
              <button
                class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text transition hover:bg-line/50"
                @click="go('/logout')"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-subtext"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="m16 17 5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                로그아웃
              </button>
            </template>
            <template v-else>
              <button
                class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-text transition hover:bg-line/50"
                @click="go('/login')"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-teal"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="m10 17 5-5-5-5" />
                  <path d="M15 12H3" />
                </svg>
                로그인
              </button>
              <button
                class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text transition hover:bg-line/50"
                @click="go('/signup')"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-subtext"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6M22 11h-6" />
                </svg>
                회원가입
              </button>
            </template>
          </div>
        </template>
        </div>
      </div>
    </div>
  </header>

  <!-- 라우트 화면. 목록은 KeepAlive로 검색어·페이지 상태 유지 -->
  <RouterView v-slot="{ Component }">
    <KeepAlive include="HeritageList">
      <component :is="Component" @home="goHome" />
    </KeepAlive>
  </RouterView>

  <!-- 챗봇 플로팅 버튼 (우측 하단 고정) -->
  <button
    v-if="!isAuthRoute && !isChatbotRoute"
    class="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:w-auto hover:px-5 hover:brightness-110 active:scale-95"
    aria-label="챗봇 열기"
    @click="toggleChatbot"
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
    <span
      class="ml-0 max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-[8rem] group-hover:opacity-100"
      >챗봇 문의</span
    >
  </button>
</template>
