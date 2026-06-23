<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentUser } from '@/api/auth'

const route = useRoute()
const router = useRouter()

const isAuthRoute = computed(() => route.meta?.auth === true)
</script>

<template>
  <!-- 전역 헤더 (네비게이션) -->
  <header
    v-if="!isAuthRoute"
    class="sticky top-0 z-40 border-b border-line/80 bg-bg/90 backdrop-blur-xl"
  >
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
      <button
        class="inline-flex items-center gap-2 text-primary"
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
        <template v-if="currentUser">
          <span class="hidden text-sm text-subtext sm:inline">
            <strong class="font-medium text-text">{{
              currentUser.nickname || currentUser.username
            }}</strong
            >님, 반가워요
          </span>
          <button
            class="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-subtext transition hover:border-teal hover:text-teal"
            @click="router.push('/logout')"
          >
            로그아웃
          </button>
        </template>
        <template v-else>
          <button
            class="rounded-full px-4 py-2 text-sm font-medium text-subtext transition hover:text-teal"
            @click="router.push('/login')"
          >
            로그인
          </button>
          <button
            class="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
            @click="router.push('/signup')"
          >
            회원가입
          </button>
        </template>
      </div>
    </div>
  </header>

  <!-- 라우트 화면. 목록은 KeepAlive로 검색어·페이지 상태 유지 -->
  <RouterView v-slot="{ Component }">
    <KeepAlive include="HeritageList">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>
