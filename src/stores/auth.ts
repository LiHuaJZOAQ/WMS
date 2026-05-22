import { defineStore } from 'pinia'
import { ref } from 'vue'


// 认证模块
export const useAuthStore = defineStore('auth', () => {
  // 从 localStorage 初始化，恢复刷新前的登录状态
  const token = ref(localStorage.getItem('token'))
  const user = ref(null)
  const isAuthenticated = ref(!!token.value)

  function login(userData:any) {
    return new Promise<void>((resolve) => {
      // 存储token
      localStorage.setItem('token', userData.token)
      
      user.value = userData.username || userData.name
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

  // 初始化用户信息（如果 token 存在）
  async function initUser() {
    if (token.value && !user.value) {
      try {
        const res = await fetch('/api/users/info', {
          headers: { 'Authorization': `Bearer ${token.value}` }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.code === 200) {
            user.value = data.data.name
          }
        } else {
          // Token 失效，清除登录状态
          logout()
        }
      } catch (e) {
        console.error('初始化用户信息失败', e)
      }
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    initUser
  }
})