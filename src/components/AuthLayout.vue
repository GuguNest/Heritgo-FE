<script setup>
defineProps({
  eyebrow: { type: String, default: 'HERITGO' },
  title: { type: String, required: true },
  description: { type: String, required: true },
})

defineEmits(['home'])
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-bg px-5 py-8 sm:px-8 sm:py-12">
    <div class="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-teal/10 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-coral/10 blur-3xl"></div>

    <div class="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center">
      <section class="grid w-full overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[0_24px_70px_rgba(34,58,94,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <div class="relative hidden min-h-[680px] flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex">
          <div
            class="absolute inset-0 opacity-40"
            style="background: radial-gradient(circle at 20% 15%, #2f7d74 0, transparent 34%), radial-gradient(circle at 90% 85%, #f0a06f 0, transparent 28%)"
          ></div>

          <button class="relative inline-flex items-center gap-3 self-start" @click="$emit('home')">
            <span class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V9l7-5 7 5v12" />
                <path d="M9 21v-7h6v7" />
              </svg>
            </span>
            <span class="font-serif text-2xl font-bold tracking-wide">Heritgo</span>
          </button>

          <div class="relative">
            <p class="text-xs font-medium uppercase tracking-[0.35em] text-white/60">Our heritage, your journey</p>
            <h2 class="mt-5 max-w-sm font-serif text-4xl leading-[1.45]">
              오래된 이야기가<br />
              오늘의 여행이 되는 곳
            </h2>
            <p class="mt-5 max-w-sm text-sm leading-7 text-white/65">
              천년의 시간과 사람의 이야기를 따라, 나만의 문화유산 여행을 시작해 보세요.
            </p>
          </div>

          <p class="relative text-xs text-white/40">한국의 문화유산을 여행하다 · HERITGO</p>
        </div>

        <div class="flex min-h-[620px] items-center px-6 py-10 sm:px-12 lg:px-16">
          <div class="mx-auto w-full max-w-md">
            <button class="mb-10 inline-flex items-center gap-2 text-primary lg:hidden" @click="$emit('home')">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21h18" />
                  <path d="M5 21V9l7-5 7 5v12" />
                  <path d="M9 21v-7h6v7" />
                </svg>
              </span>
              <span class="font-serif text-xl font-bold">Heritgo</span>
            </button>

            <p class="text-xs font-medium uppercase tracking-[0.3em] text-teal">{{ eyebrow }}</p>
            <h1 class="mt-3 font-serif text-3xl font-bold leading-tight text-text sm:text-4xl">{{ title }}</h1>
            <p class="mt-3 text-sm leading-6 text-subtext">{{ description }}</p>
            <div class="mt-9"><slot /></div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
