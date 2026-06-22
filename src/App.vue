<script setup>
import { ref } from 'vue'
import HeritageList from '@/views/HeritageList.vue'
import HeritageDetail from '@/views/HeritageDetail.vue'

// 라우터 없이 단일 상태로 목록 ↔ 상세 전환
const selectedId = ref(null)

function openDetail(id) {
  selectedId.value = id
  window.scrollTo({ top: 0 })
}

function backToList() {
  selectedId.value = null
}
</script>

<template>
  <!-- 목록 상태(검색어·페이지)는 KeepAlive로 유지 -->
  <KeepAlive>
    <HeritageList v-if="selectedId === null" @open="openDetail" />
    <HeritageDetail
      v-else
      :heritage-id="selectedId"
      @back="backToList"
    />
  </KeepAlive>
</template>
