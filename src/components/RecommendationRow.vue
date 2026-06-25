<script setup>
import { ref } from 'vue'
import HeritageCard from '@/components/HeritageCard.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' }, // 'fire' | 'pin' | 'spark'
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

// 마우스로 잡아끌어 가로 스크롤 (drag-to-scroll)
const scroller = ref(null)
const dragging = ref(false)
let isDown = false
let startX = 0
let startLeft = 0
let moved = false

function onPointerDown(e) {
  const el = scroller.value
  if (!el || (e.button !== undefined && e.button !== 0)) return
  isDown = true
  moved = false
  startX = e.clientX
  startLeft = el.scrollLeft
  dragging.value = true
}
function onPointerMove(e) {
  if (!isDown) return
  const dx = e.clientX - startX
  if (Math.abs(dx) > 4 && !moved) {
    moved = true
    // 실제 드래그가 시작될 때만 포인터 캡처.
    // (단순 클릭은 캡처하지 않아야 카드의 click 이벤트가 살아있음)
    scroller.value.setPointerCapture?.(e.pointerId)
  }
  scroller.value.scrollLeft = startLeft - dx
}
function endDrag(e) {
  if (!isDown) return
  isDown = false
  dragging.value = false
  try {
    scroller.value?.releasePointerCapture?.(e.pointerId)
  } catch {
    /* 캡처되지 않은 포인터면 무시 */
  }
}
// 드래그한 직후의 클릭은 카드 진입으로 처리하지 않음
function onClickCapture(e) {
  if (moved) {
    e.stopPropagation()
    e.preventDefault()
    moved = false
  }
}
</script>

<template>
  <section v-if="loading || items.length" class="mt-2">
    <div class="mb-3 flex items-end justify-between gap-3">
      <div class="flex items-center gap-2">
        <span
          v-if="icon"
          class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <template v-if="icon === 'fire'">
              <path
                d="M12 3c.5 3-2 4-2 7a2 2 0 0 0 4 0c0-1 .8-1.5 1.3-.8C16.7 11 18 13 18 15a6 6 0 1 1-12 0c0-3.5 3-6 6-12Z"
              />
            </template>
            <template v-else-if="icon === 'pin'">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </template>
            <template v-else>
              <path
                d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"
              />
            </template>
          </svg>
        </span>
        <div>
          <h2 class="font-serif text-xl text-text sm:text-2xl">{{ title }}</h2>
          <p v-if="subtitle" class="text-xs text-subtext">{{ subtitle }}</p>
        </div>
      </div>
    </div>

    <!-- 가로 스크롤 (마우스로 잡아끌기) -->
    <div
      ref="scroller"
      class="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endDrag"
      @pointerleave="endDrag"
      @click.capture="onClickCapture"
      @dragstart.prevent
    >
      <template v-if="loading">
        <div
          v-for="i in 5"
          :key="i"
          class="aspect-[4/5] w-44 shrink-0 animate-pulse rounded-3xl bg-line/60"
        ></div>
      </template>
      <template v-else>
        <div
          v-for="item in items"
          :key="item.heritage_id"
          class="w-44 shrink-0 sm:w-48"
        >
          <HeritageCard :heritage="item" @select="emit('select', $event)" />
        </div>
      </template>
    </div>
  </section>
</template>
