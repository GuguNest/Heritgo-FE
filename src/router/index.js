import { createRouter, createWebHistory } from 'vue-router'
import HeritageList from '@/views/HeritageList.vue'

const routes = [
  {
    path: '/',
    name: 'heritage-list',
    component: HeritageList,
  },
  {
    path: '/heritages/:id',
    name: 'heritage-detail',
    // 지연 로딩
    component: () => import('@/views/HeritageDetail.vue'),
    // route param(id)을 컴포넌트의 heritageId prop으로 전달
    props: (route) => ({ heritageId: route.params.id }),
  },
  {
    path: '/profiles',
    name: 'profile-list',
    component: () => import('@/views/ProfileList.vue'),
  },
  // 가이드(생성물)
  {
    path: '/guides',
    name: 'guide-list',
    component: () => import('@/views/GuideList.vue'),
  },
  {
    path: '/guides/:id',
    name: 'guide-detail',
    component: () => import('@/views/GuideDetailView.vue'),
    props: (route) => ({ guideId: route.params.id }),
  },
  // 인증
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { auth: true },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/SignUpView.vue'),
    meta: { auth: true },
  },
  {
    path: '/logout',
    name: 'logout',
    component: () => import('@/views/LogoutView.vue'),
    meta: { auth: true },
  },
  // 알 수 없는 경로 → 홈
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
