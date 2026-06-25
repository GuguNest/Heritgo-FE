<script setup>
import { ref, onMounted } from 'vue'
import { getHeritages } from '@/api/heritage'

const emit = defineEmits(['close', 'select'])

const keyword = ref('')
const items = ref([])
const loading = ref(false)
const searched = ref(false)

async function search() {
  loading.value = true
  searched.value = true
  try {
    const data = await getHeritages({ keyword: keyword.value.trim(), page: 1, size: 10 })
    items.value = data.items ?? []
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(search) // 처음엔 전체 일부를 보여줌
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
    @click.self="emit('close')"
  >
    <div
      class="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface shadow-xl sm:rounded-3xl"
    >
      <div class="flex items-start justify-between gap-4 px-6 pb-3 pt-6">
        <div>
          <h2 class="font-serif text-xl text-text">유산 선택</h2>
          <p class="mt-1 text-sm text-subtext">
            여행 조건을 만들 국가유산을 골라주세요.
          </p>
        </div>
        <button
          class="-mr-1 shrink-0 rounded-full p-1.5 text-subtext transition hover:bg-line/50 hover:text-text"
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

      <!-- 검색 -->
      <div class="px-6 pb-3">
        <form
          class="flex items-center gap-2 rounded-full border border-line bg-bg/60 p-1.5 pl-4"
          @submit.prevent="search"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="shrink-0 text-subtext"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            v-model="keyword"
            type="text"
            placeholder="유산 이름 검색"
            class="min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-subtext focus:outline-none"
          />
          <button
            type="submit"
            class="shrink-0 rounded-full bg-teal px-4 py-1.5 text-sm font-medium text-white transition hover:brightness-105 active:scale-95"
          >
            검색
          </button>
        </form>
      </div>

      <!-- 결과 -->
      <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div v-if="loading" class="space-y-2">
          <div
            v-for="i in 5"
            :key="i"
            class="h-14 animate-pulse rounded-xl bg-line/50"
          ></div>
        </div>

        <p
          v-else-if="items.length === 0"
          class="py-12 text-center text-sm text-subtext"
        >
          검색 결과가 없어요. 다른 이름으로 찾아보세요.
        </p>

        <ul v-else class="space-y-1.5">
          <li v-for="h in items" :key="h.heritage_id">
            <button
              class="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-teal/5"
              @click="emit('select', h)"
            >
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium text-text">
                  {{ h.name }}
                </span>
                <span class="block truncate text-xs text-subtext">
                  {{ h.location || h.category_name }}
                </span>
              </span>
              <svg
                class="shrink-0 text-line transition group-hover:text-teal"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
