import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 动态组件模块
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  const currentView = ref('MainView')

  function increment() {
    count.value++
  }

  return { 
    count, 
    doubleCount, 
    increment,
    currentView
  }
})