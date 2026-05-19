<template>
 <div class="header-info">
 <!-- 左侧占位元素 -->
 <div class="left-placeholder"></div>
 
 <!-- 右侧用户信息 -->
 <div class="user-info">
 <el-icon class="search-icon"><Search /></el-icon>
 <el-avatar class="user-avatar">U</el-avatar>
 <span class="user-name">{{ useAuthStore().user }}</span>
 </div>
 </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
</script>

<style scoped>
.header-info { 
 display: flex;
 width: 100%;
 height: 100%;
 justify-content: space-between; /* 关键修改：两端分布 */
 align-items: center;
 background-color: #f5f7fa;
}

.left-placeholder {
 flex: 1; /* 占据左侧空间 */
}

.user-info {
 display: flex;
 align-items: center;
}

.search-icon {
    margin-right: 10px;
    font-size: 18px; /* 调整图标大小 */
    color: #666; /* 图标颜色 */
}

.user-avatar {
 margin: 0 10px;
 width: 30px;
 height: 30px;
 background-color: #c0c4cc;
 color: #fff;
 font-size: 14px;
}

.user-name {
 font-size: 14px;
 color: #666;
}
</style>