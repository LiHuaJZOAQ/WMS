<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="200px">
        <NavigationView @onChangeView="changeView" />
      </el-aside>
      <el-container>
        <el-header>
          <TopView />
        </el-header>
        <el-main>
          <!-- 修复：移除全局 KeepAlive，使用 include 指定只缓存特定组件 -->
          <!-- 全局 KeepAlive 会导致组件被永久缓存，造成内存泄漏 -->
          <router-view v-slot="{ Component }">
            <keep-alive :include="cachedComponents">
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import { useCounterStore } from '@/stores/counter'
import { ref } from 'vue';
import { defineOptions, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavigationView from './components/NavigationView.vue';
import TopView from './components/TopView.vue';
// import MainView from './components/MainView.vue';
// import RawMaterial from './components/InStorage/RawMaterial.vue';
// import Review from './components/InStorage/Review.vue';

// 在 setup 语法糖中无法直接使用 components 选项
// 需要通过以下方式注册：
// defineOptions({
//   components: {
//     MainView,
//     RawMaterial,
//     Review,
// }
// })

const counter = useCounterStore();
const router = useRouter();

// 修复：只缓存首页和主要数据展示页面，避免内存泄漏
// 复杂的表单和详情页面不应该被缓存
const cachedComponents = ref(['MainView', 'Inventory']);


// const currentView = ref("MainView");
const changeView = (view: string) => {
  counter.currentView = view;
  console.log(view)
  router.push({ name: view });

};

</script>
<style scoped lang="scss">
.common-layout {
  height: 100vh;
  width: 100vw;

  .el-container {
    height: 100vh;

    .el-aside {
      background-color: #f5f5f5;
    }

    .el-header {
      background-color: #f5f7fa;
      color: #fff;
    }

    .el-main {
      background-color: #fff;
    }
  }
}
</style>
