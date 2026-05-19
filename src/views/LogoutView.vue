<template>
  <!-- 退出确认模态框 -->
  <Teleport to="body">
    <transition name="fade">
      <div v-if="showLogoutModal" class="logout-modal">
        <div class="modal-overlay" @click.self="showLogoutModal = false"></div>
        
        <div class="modal-content">
          <div class="modal-header">
            <h3>确认退出登录？</h3>
            <button @click="showLogoutModal = false" class="close-btn">
              &times;
            </button>
          </div>
          
          <div class="modal-body">
            <div class="warning-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM12 16c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-1-4V9h2v3h-2z"/>
              </svg>
            </div>
            <p>您确定要退出当前账号吗？退出后需要重新登录</p>
          </div>
          
          <div class="modal-footer">
            <button @click="showLogoutModal = false" class="cancel-btn">
              取消
            </button>
            <button 
              @click="handleLogout" 
              class="confirm-btn"
              :disabled="isLoggingOut"
            >
              <span v-if="!isLoggingOut">确认退出</span>
              <span v-else class="loading-text">
                <span class="spinner"></span> 退出中...
              </span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <!-- 退出成功提示（可选） -->
  <Teleport to="body">
    <transition name="fade">
      <div v-if="showLogoutSuccess" class="logout-success-notice">
        <div class="notice-content">
          <i class="icon-success"></i>
          <span>已安全退出系统</span>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref ,Teleport,defineProps,watch} from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fa } from 'element-plus/es/locales.mjs';

const props= defineProps<{
  State: boolean
}>()

watch(() => props.State, () => {
    showLogoutModal.value = true
})

const router = useRouter()
const authStore = useAuthStore()

const showLogoutModal = ref(false)
const isLoggingOut = ref(false)
const showLogoutSuccess = ref(false)


const handleLogout = async () => {
  try {
    isLoggingOut.value = true
    
    // 调用退出登录API
    await authStore.logout()
    
    // 显示成功提示
    showLogoutSuccess.value = true
    showLogoutModal.value = false
    
    // 2秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error) {
    console.error('退出登录失败:', error)
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<style scoped lang="scss">
/* 触发按钮样式 */
.logout-trigger {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }
  
  .icon-exit {
    font-size: 16px;
  }
}

/* 模态框容器 */
.logout-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 遮罩层 */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

/* 模态框内容 */
.modal-content {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1;
  animation: modalSlideIn 0.3s ease-out;
}

/* 模态框头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  
  h3 {
    margin: 0;
    font-size: 18px;
    color: #1e293b;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.2s;
    
    &:hover {
      color: #64748b;
    }
  }
}

/* 模态框主体 */
.modal-body {
  padding: 24px;
  text-align: center;
  
  p {
    margin: 16px 0 0;
    color: #64748b;
    line-height: 1.5;
  }
}

.warning-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f97316;
  background: rgba(249, 115, 22, 0.1);
  border-radius: 50%;
  
  svg {
    width: 32px;
    height: 32px;
    fill: currentColor;
  }
}

/* 模态框底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  
  button {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .cancel-btn {
    background: #f1f5f9;
    border: none;
    color: #64748b;
    
    &:hover {
      background: #e2e8f0;
    }
  }
  
  .confirm-btn {
    background: #ef4444;
    border: none;
    color: white;
    
    &:hover:not(:disabled) {
      background: #dc2626;
    }
    
    &:disabled {
      background: #fca5a5;
      cursor: not-allowed;
    }
  }
}

/* 加载动画 */
.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* 退出成功提示 */
.logout-success-notice {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.notice-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #10b981;
  color: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
  
  .icon-success {
    font-size: 18px;
  }
}

/* 动画 */
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>