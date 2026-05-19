// src/api/inventory.ts - 原料库存管理API
import request from '@/utils/request'

// 原料库存管理接口
export interface RawMaterialInventory {
  id: number
  code: string
  name: string
  category: string
  specification: string
  unit: string
  stock: number
  status: string
  minStock?: number
  maxStock?: number
}

export interface InventoryQueryParams {
  page?: number
  pageSize?: number
  materialName?: string
  materialCode?: string
  category?: string
  status?: string
  warehouse?: string
  minStock?: string
}

export interface InventoryListResponse {
  list: RawMaterialInventory[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 获取原料库存列表
export const getRawMaterialInventoryList = (params: InventoryQueryParams) => {
  return request<InventoryListResponse>({
    url: '/inventory/raw-materials',
    method: 'get',
    params
  })
}

// 获取原料库存详情
export const getRawMaterialInventoryDetail = (id: number) => {
  return request({
    url: `/inventory/raw-materials/${id}`,
    method: 'get'
  })
}

// 新增原料
export const addRawMaterial = (data: {
  code: string
  name: string
  category: string
  specification?: string
  unit: string
  stock?: number
}) => {
  return request({
    url: '/inventory/raw-materials',
    method: 'post',
    data
  })
}

// 更新原料信息
export const updateRawMaterial = (id: number, data: {
  code: string
  name: string
  category: string
  specification?: string
  unit: string
  stock?: number
  status?: string
}) => {
  return request({
    url: `/inventory/raw-materials/${id}`,
    method: 'put',
    data
  })
}

// 删除原料
export const deleteRawMaterial = (id: number) => {
  return request({
    url: `/inventory/raw-materials/${id}`,
    method: 'delete'
  })
}