import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
    css: {
    preprocessorOptions: {
      scss: {
        // 可选：全局注入 SCSS 变量（避免在每个文件手动导入）
        additionalData: `@use "@/styles/variables.scss" as *;`,
      },
    },
  },
    server: {
    proxy: {
      // 代理所有以 /api 开头的请求
      '/api': {
        target: 'http://localhost:3000', // 你的后端地址
        changeOrigin: true,              // 允许跨域
        //rewrite: (path) => path.replace(/^\/api/, '') // 移除路径中的 /api
      }
    }
  }
})
