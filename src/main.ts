import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)


// 添加全局路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查页面是否需要登录
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  // 检查页面是否仅允许未登录用户访问
  const guestOnly = to.matched.some(record => record.meta.guestOnly)
  
  if (requiresAuth && !authStore.isAuthenticated) {
    // 重定向到登录页，并记录原访问地址
    next({
      name: 'Login',
      //query: { redirect: to.fullPath }
    })
  } else if (guestOnly && authStore.isAuthenticated) {
    // 已登录用户试图访问登录页，重定向到首页
    next({ name: 'Home' })
  } else {
    next() // 正常访问
  }
})


app.mount('#app')

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
