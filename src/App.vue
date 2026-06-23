<script setup>
// 라우팅은 vue-router가 담당. 목록은 KeepAlive로 캐싱해 검색어·페이지 유지.
</script>

<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive include="HeritageList">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>
