<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadKakaoMap } from '@/utils/loadKakaoMap'

const props = defineProps({
  lat: { type: [Number, String], required: true },
  lng: { type: [Number, String], required: true },
  title: { type: String, default: '' },
  address: { type: String, default: '' },
})

const mapRef = ref(null)
const error = ref('')

let map = null
let marker = null
let infoWindow = null

const latitude = computed(() => Number(props.lat))
const longitude = computed(() => Number(props.lng))
const isValidCoordinate = computed(
  () =>
    Number.isFinite(latitude.value) &&
    Number.isFinite(longitude.value) &&
    Math.abs(latitude.value) <= 90 &&
    Math.abs(longitude.value) <= 180,
)

async function renderMap() {
  error.value = ''

  if (!mapRef.value || !isValidCoordinate.value) {
    error.value = '지도에 표시할 좌표 정보가 올바르지 않습니다.'
    return
  }

  try {
    const kakao = await loadKakaoMap()
    await nextTick()

    const position = new kakao.maps.LatLng(latitude.value, longitude.value)

    if (!map) {
      map = new kakao.maps.Map(mapRef.value, {
        center: position,
        level: 4,
      })
    } else {
      map.setCenter(position)
    }

    if (!marker) {
      marker = new kakao.maps.Marker({ map, position })
    } else {
      marker.setPosition(position)
      marker.setMap(map)
    }

    if (props.title) {
      const content = `
        <div class="kakao-map-info">
          <strong>${props.title}</strong>
          ${props.address ? `<span>${props.address}</span>` : ''}
        </div>
      `

      if (!infoWindow) {
        infoWindow = new kakao.maps.InfoWindow({ content })
      } else {
        infoWindow.setContent(content)
      }

      infoWindow.open(map, marker)
    }
  } catch (e) {
    error.value =
      e?.message || '카카오맵을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }
}

onMounted(renderMap)

watch(() => [props.lat, props.lng, props.title, props.address], renderMap)

onBeforeUnmount(() => {
  if (marker) marker.setMap(null)
  if (infoWindow) infoWindow.close()
})
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-line bg-surface ring-1 ring-line">
    <div ref="mapRef" class="h-80 w-full bg-line/50 sm:h-96"></div>
    <div
      v-if="error"
      class="flex min-h-40 items-center justify-center px-5 py-8 text-center text-sm text-subtext"
    >
      {{ error }}
    </div>
  </div>
</template>

<style>
.kakao-map-info {
  display: flex;
  min-width: 150px;
  max-width: 230px;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  color: #2a2622;
  font-family: 'Noto Sans KR', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.4;
}

.kakao-map-info strong {
  font-size: 14px;
  font-weight: 700;
}

.kakao-map-info span {
  color: #6f675b;
}
</style>
