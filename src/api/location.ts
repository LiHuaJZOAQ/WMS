// src/api/location.ts - 原料仓位管理API
import request from '@/utils/request'

// 原料仓位管理接口
export interface RawMaterialLocation {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  specification: string
  locationCode: string
  locationName: string
  quantity: number
  unit: string
  status: string
  remark: string
}

export interface LocationQueryParams {
  page?: number
  pageSize?: number
  materialName?: string
  locationCode?: string
}

export interface LocationListResponse {
  list: RawMaterialLocation[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface MaterialOption {
  id: number
  code: string
  name: string
  unit: string
}

// 获取原料仓位列表
export const getRawMaterialLocationList = (params: LocationQueryParams) => {
  return request<LocationListResponse>({
    url: '/locations/raw-materials',
    method: 'get',
    params
  })
}

// 新增原料仓位
export const addRawMaterialLocation = (data: {
  materialId: number
  locationCode: string
  locationName: string
  quantity: number
  status?: number
  remark?: string
}) => {
  return request({
    url: '/locations/raw-materials',
    method: 'post',
    data
  })
}

// 更新原料仓位
export const updateRawMaterialLocation = (id: number, data: {
  materialId: number
  locationCode: string
  locationName: string
  quantity: number
  status?: number
  remark?: string
}) => {
  return request({
    url: `/locations/raw-materials/${id}`,
    method: 'put',
    data
  })
}

// 删除单个原料仓位
export const deleteRawMaterialLocation = (id: number) => {
  return request({
    url: `/locations/raw-materials/${id}`,
    method: 'delete'
  })
}

// 批量删除原料仓位
export const batchDeleteRawMaterialLocation = (ids: number[]) => {
  return request({
    url: '/locations/raw-materials',
    method: 'delete',
    data: { ids }
  })
}

// 获取原料选项列表
export const getMaterialOptions = () => {
  return request<MaterialOption[]>({
    url: '/locations/raw-materials/options',
    method: 'get'
  })
}