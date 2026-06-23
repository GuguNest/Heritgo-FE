import { createApp, h, ref } from 'vue'
import './style.css'
import LoginView from '@/views/LoginView.vue'
import SignUpView from '@/views/SignUpView.vue'
import LogoutView from '@/views/LogoutView.vue'

const pageFromUrl = new URLSearchParams(window.location.search).get('page')
const initialPage = ['login', 'signup', 'logout'].includes(pageFromUrl)
  ? pageFromUrl
  : 'login'

createApp({
  setup() {
    const page = ref(initialPage)

    function move(nextPage) {
      page.value = nextPage
      const url = new URL(window.location.href)
      url.searchParams.set('page', nextPage)
      window.history.replaceState({}, '', url)
    }

    return () => {
      if (page.value === 'signup') {
        return h(SignUpView, {
          onGoLogin: () => move('login'),
          onHome: () => move('login'),
        })
      }

      if (page.value === 'logout') {
        return h(LogoutView, {
          onCancel: () => move('login'),
          onHome: () => move('login'),
          onLogoutSuccess: () => move('login'),
        })
      }

      return h(LoginView, {
        onGoSignup: () => move('signup'),
        onHome: () => move('login'),
      })
    }
  },
}).mount('#auth-preview')
