import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/home/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home/main',
      meta: { requiresAuth: true } // 需要登录
    },
    {
      path: '/home',
      name: 'Home',
      component: HomeView,
      meta: { requiresAuth: true }, // 需要登录
      children: [
        {
          path: 'main',
          name: 'MainView',
          component: () => import('../views/home/components/MainView.vue'),
        },
        {
          path: '/inStorage/rawMaterial',
          name: 'InStorageRawMaterial',
          component: () => import('../views/home/components/InStorage/InboundOrder.vue'),
        },
        {
          path: '/inStorage/rawMaterial/review',
          name: 'InStorageRawMaterialReview',
          component: () => import('../views/home/components/InStorage/Review.vue'),
        },
        
        {
          path: '/outStorage/rawMaterial',
          name: 'OutStorageRawMaterial',
          component: () => import('../views/home/components/OutStorage/OutboundOrder.vue'),
        },
        
        {
          path: '/checkStorage/rawMaterial',
          name: 'CheckStorageRawMaterial',
          component: () => import('../views/home/components/CheckStorage/Stocktaking.vue'),
        },
        
        {
          path: '/inventory/rawMaterial',
          name: 'InventoryRawMaterial',
          component: () => import('../views/home/components/InventoryManage/Inventory.vue'),
        },
        {
          path: '/location/rawMaterial',
          name: 'LocationRawMaterial',
          component: () => import('../views/home/components/LocationManage/Location.vue'),
        },
        {
          path: '/basicData/supplier',
          name: 'SupplierManage',
          component: () => import('../views/home/components/BasicData/Partner.vue'),
        },
        
        {
          path: '/basicData/department',
          name: 'DepartmentManage',
          component: () => import('../views/home/components/BasicData/Department.vue'),
        },
        
        {
          path: '/basicData/finishedProduct',
          name: 'FinishedProductManage',
          component: () => import('../views/home/components/BasicData/Item.vue'),
        },
        {
          path: '/system/user',
          name: 'UserManage',
          component: () => import('../views/home/components/System/UserManage.vue'),
        },
        {
          path: '/system/role',
          name: 'RoleManage',
          component: () => import('../views/home/components/System/RoleManage.vue'),
        },
        {
          path: '/system/operationLog',
          name: 'OperationLog',
          component: () => import('../views/home/components/System/OperationLog.vue'),
        },
        {
          path: '/mobile/scanner',
          name: 'MobileScanner',
          component: () => import('../views/home/components/MobileScanner.vue'),
        },
        {
          path: '/outStorage/wavePicking',
          name: 'WavePicking',
          component: () => import('../views/home/components/OutStorage/WavePicking.vue'),
        }
      ],
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true } // 仅允许未登录用户访问
    },
  ],
})

// 全局前置路由守卫：登录状态拦截
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const guestOnly = to.matched.some(record => record.meta.guestOnly);

  if (requiresAuth && !token) {
    // 需要登录但未登录，重定向到登录页
    next('/login');
  } else if (guestOnly && token) {
    // 已登录状态不允许访问登录页，重定向到首页
    next('/home/main');
  } else {
    // 其他情况正常放行
    next();
  }
});

export default router

