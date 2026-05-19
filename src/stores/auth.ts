import { defineStore } from 'pinia'
import { ref } from 'vue'


// 认证模块
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const isAuthenticated = ref(false)

  function login(userData:any) {
    return new Promise<void>((resolve) => {
      // 存储token
      localStorage.setItem('token', userData.token)
      
      user.value = userData.username
      token.value = userData.token
      // 设置认证状态
      isAuthenticated.value = true
      
      resolve()
    })
  }

  function logout() {
    return new Promise<void>((resolve) => {
       localStorage.removeItem('token')
      user.value = null
      token.value = null
      isAuthenticated.value = false
      resolve()
    })
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout
  }
})