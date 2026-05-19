import axios from '../utils/request';
import path from './path';


const api={
    // 仪表盘数据
    getDashboardSummary: () => axios.get("/dashboard/summary"),
    // 登录
    login: (data: any) => {
        return axios.post("/users/login", data);
    },
    // 获取用户信息
    getUserInfo: () => {
        return axios.get("/users/info");
    },
    // 获取入库单创建选项
    getInboundCreateOptions: () => {
        return axios.get("/inbound-orders/create-options");
    },
    // 创建入库单
    createInboundOrder: (data: any) => {
        return axios.post("/inbound-orders", data);
    },
    // 获取入库单列表
    getInboundOrders: (params: any) => {
        return axios.get("/inbound-orders", { params });
    },
    // 获取入库单筛选选项
    getInboundOptions: () => {
        return axios.get("/inbound-orders/options");
    },
    // 审核入库单
    auditInboundOrders: (data: any) => {
        return axios.put("/inbound-orders/audit", data);
    },
    // 撤销入库单
    revokeInboundOrders: (data: any) => {
        return axios.put("/inbound-orders/revoke", data);
    },
    // 获取入库单详情
    getInboundOrderDetail: (id: number | string) => {
        return axios.get(`/inbound-orders/${id}`);
    },
    // 获取入库单打印数据
    getInboundOrderPrint: (id: number | string) => {
        return axios.get(`/inbound-orders/${id}/print`);
    },
    // 导出入库单
    exportInboundOrders: (params: any) => {
        return axios.get("/inbound-orders/export", { params });
    },
    // 获取出库单筛选选项
    getOutboundOptions: () => {
        return axios.get("/outbound-orders/options");
    },
    // 获取出库单列表
    getOutboundOrders: (params: any) => {
        return axios.get("/outbound-orders", { params });
    },
    // 获取出库单详情
    getOutboundOrderDetail: (id: number | string) => {
        return axios.get(`/outbound-orders/${id}`);
    },
    // 审核出库单
    auditOutboundOrder: (id: number | string, data: any) => {
        return axios.put(`/outbound-orders/${id}/audit`, data);
    },
    // 撤销出库单
    revokeOutboundOrder: (id: number | string) => {
        return axios.put(`/outbound-orders/${id}/revoke`);
    },
    // 删除出库单
    deleteOutboundOrder: (id: number | string) => {
        return axios.delete(`/outbound-orders/${id}`);
    },
    // 往来单位 (Partner)
    getPartners: (params: any) => axios.get("/partners", { params }),
    createPartner: (data: any) => axios.post("/partners", data),
    updatePartner: (id: number | string, data: any) => axios.put(`/partners/${id}`, data),
    deletePartner: (id: number | string) => axios.delete(`/partners/${id}`),

    // 商品档案 (Item/SKU)
    getItems: (params: any) => axios.get("/items", { params }),
    createItem: (data: any) => axios.post("/items", data),
    updateItem: (id: number | string, data: any) => axios.put(`/items/${id}`, data),
    deleteItem: (id: number | string) => axios.delete(`/items/${id}`),

    // 全局库存查询
    getInventory: (params: any) => axios.get("/inventory", { params }),

    // 盘点管理
    getStocktakings: (params: any) => axios.get("/stocktaking", { params }),
    getStocktakingDetail: (id: number | string) => axios.get(`/stocktaking/${id}`),
    auditStocktaking: (id: number | string, data: any) => axios.put(`/stocktaking/${id}/audit`, data),
    deleteStocktaking: (id: number | string) => axios.delete(`/stocktaking/${id}`),

    // 系统设置 - 用户管理
    getUsers: (params: any) => axios.get("/users", { params }),
    createUser: (data: any) => axios.post("/users", data),
    updateUser: (id: number | string, data: any) => axios.put(`/users/${id}`, data),
    deleteUser: (id: number | string) => axios.delete(`/users/${id}`),

    // 系统设置 - 角色与权限管理
    getRoles: () => axios.get("/roles"),
    createRole: (data: any) => axios.post("/roles", data),
    updateRole: (id: number | string, data: any) => axios.put(`/roles/${id}`, data),
    deleteRole: (id: number | string) => axios.delete(`/roles/${id}`),
    getPermissions: () => axios.get("/permissions"),

    // 系统设置 - 操作日志
    getOperationLogs: (params: any) => axios.get("/operation-logs", { params }),
}

export default api;