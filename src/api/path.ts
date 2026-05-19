// const base={
//     baseURL: 'http://localhost:3000',
// }

// export default base;

// src/api/path.ts - API路径配置
export const API_PATHS = {
    // 基础配置
    BASE_URL: (typeof window !== 'undefined' && window.location)
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : 'http://127.0.0.1:3000',
    
    // 用户认证
    AUTH: {
      LOGIN: '/api/users/login',
      LOGOUT: '/api/users/logout',
      USER_INFO: '/api/users/info'
    },
    
    // 原料库存管理
    INVENTORY: {
      RAW_MATERIALS: '/api/inventory/raw-materials',
      RAW_MATERIAL_DETAIL: (id: number) => `/api/inventory/raw-materials/${id}`,
      RAW_MATERIAL_DELETE: (id: number) => `/api/inventory/raw-materials/${id}`,
      RAW_MATERIAL_UPDATE: (id: number) => `/api/inventory/raw-materials/${id}`
    },
    
    // 原料仓位管理
    LOCATION: {
      RAW_MATERIALS: '/api/locations/raw-materials',
      RAW_MATERIAL_DETAIL: (id: number) => `/api/locations/raw-materials/${id}`,
      RAW_MATERIAL_DELETE: (id: number) => `/api/locations/raw-materials/${id}`,
      RAW_MATERIAL_UPDATE: (id: number) => `/api/locations/raw-materials/${id}`,
      RAW_MATERIAL_BATCH_DELETE: '/api/locations/raw-materials',
      MATERIAL_OPTIONS: '/api/locations/raw-materials/options'
    },
    
    // 入库管理
    INBOUND: {
      ORDERS: '/api/inbound-orders',
      ORDER_DETAIL: (id: number) => `/api/inbound-orders/${id}`,
      ORDER_DELETE: (id: number) => `/api/inbound-orders/${id}`,
      ORDER_UPDATE: (id: number) => `/api/inbound-orders/${id}`,
      ORDER_AUDIT: '/api/inbound-orders/audit',
      ORDER_REVOKE: '/api/inbound-orders/revoke',
      ORDER_PRINT: (id: number) => `/api/inbound-orders/${id}/print`,
      ORDER_EXPORT: '/api/inbound-orders/export',
      ORDER_OPTIONS: '/api/inbound-orders/options',
      CREATE_OPTIONS: '/api/inbound-orders/create-options'
    },
    
    // 系统功能
    SYSTEM: {
      TEST: '/api/test',
      HEALTH: '/health'
    }
  }
  
  // 导出常用的API基础路径
  export const {
    AUTH,
    INVENTORY,
    LOCATION,
    INBOUND,
    SYSTEM
  } = API_PATHS

  export default API_PATHS
