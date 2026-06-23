<script setup>
import { ref } from 'vue'
import HeritageList from '@/views/HeritageList.vue'
import HeritageDetail from '@/views/HeritageDetail.vue'
import LoginView from '@/views/LoginView.vue'
import SignUpView from '@/views/SignUpView.vue'
import LogoutView from '@/views/LogoutView.vue'
import ChatbotView from '@/views/ChatbotView.vue'
import { getStoredUser } from '@/api/auth'

const page = ref('home')
const selectedId = ref(null)
const user = ref(getStoredUser())

function openDetail(id) {
  selectedId.value = id
  window.scrollTo({ top: 0 })
}

function backToList() {
  selectedId.value = null
}

function move(nextPage) {
  page.value = nextPage
  window.scrollTo({ top: 0 })
}

function goHome() {
  page.value = 'home'
}

function handleLogin(loggedInUser) {
  user.value = loggedInUser
  goHome()
}

function handleLogout() {
  user.value = null
  goHome()
}
</script>

<template>
  <LoginView
    v-if="page === 'login'"
    @login-success="handleLogin"
    @go-signup="move('signup')"
    @home="goHome"
  />
  <SignUpView
    v-else-if="page === 'signup'"
    @go-login="move('login')"
    @home="goHome"
  />
  <LogoutView
    v-else-if="page === 'logout'"
    @logout-success="handleLogout"
    @cancel="goHome"
    @home="goHome"
  />
  <ChatbotView v-else-if="page === 'chatbot'" @home="goHome" />

  <div v-else>
    <header class="sticky top-0 z-40 border-b border-line/80 bg-bg/90 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <button class="inline-flex items-center gap-2 text-primary" @click="goHome">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V9l7-5 7 5v12" />
              <path d="M9 21v-7h6v7" />
            </svg>
          </span>
          <span class="font-serif text-xl font-bold">Heritgo</span>
        </button>

        <div class="flex items-center gap-2">
          <button
            class="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-teal transition hover:border-teal hover:bg-teal/5"
            @click="move('chatbot')"
          >
            챗봇 테스트
          </button>
          <template v-if="user">
            <span class="hidden text-sm text-subtext sm:inline">
              <strong class="font-medium text-text">{{ user.nickname || user.username }}</strong>님, 반가워요
            </span>
            <button class="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-subtext transition hover:border-teal hover:text-teal" @click="move('logout')">
              로그아웃
            </button>
          </template>
          <template v-else>
            <button class="rounded-full px-4 py-2 text-sm font-medium text-subtext transition hover:text-teal" @click="move('login')">
              로그인
            </button>
            <button class="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:brightness-110" @click="move('signup')">
              회원가입
            </button>
          </template>
        </div>
      </div>
    </header>

    <KeepAlive>
      <HeritageList v-if="selectedId === null" @open="openDetail" />
      <HeritageDetail v-else :heritage-id="selectedId" @back="backToList" />
    </KeepAlive>
  </div>
</template>
