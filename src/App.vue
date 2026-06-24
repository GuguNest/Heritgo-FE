<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentUser } from '@/api/auth'

const route = useRoute()
const router = useRouter()

// 로그인/회원가입/로그아웃 화면에서는 헤더를 숨김
const isAuthRoute = computed(() => route.meta?.auth === true)

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
        @click="router.push('/')"
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
        <button
          class="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-teal transition hover:border-teal hover:bg-teal/5"
          @click="router.push('/chatbot')"
        >
          챗봇 테스트
        </button>

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
      <component :is="Component" @home="router.push('/')" />
    </KeepAlive>
  </RouterView>
</template>
