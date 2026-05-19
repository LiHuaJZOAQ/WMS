<template>
  <div class="erp-container">
    <!-- 筛选卡片 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="searchForm" class="filter-row">
        <div class="filter-col">
          <label>库位编号</label>
          <el-input
            v-model="searchForm.locationCode"
            placeholder="请输入库位编号"
            clearable
            @clear="clearSearch"
          />
        </div>
        <div class="filter-col">
          <label>库位名称</label>
          <el-input
            v-model="searchForm.locationName"
            placeholder="请输入库位名称"
            clearable
          />
        </div>
        <div class="filter-col">
          <label>所属仓库</label>
          <el-select v-model="searchForm.warehouseId" placeholder="全部仓库" clearable>
            <el-option
              v-for="warehouse in warehouseOptions"
              :key="warehouse.value"
              :label="warehouse.label"
              :value="warehouse.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>库位类型</label>
          <el-select v-model="searchForm.locationType" placeholder="全部类型" clearable>
            <el-option
              v-for="type in locationTypeOptions"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>使用状态</label>
          <el-select v-model="searchForm.occupancyStatus" placeholder="全部状态" clearable>
            <el-option
              v-for="status in occupancyStatusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button class="btn-reset" @click="resetSearch">重置</el-button>
          <el-button type="primary" class="btn-primary" @click="handleSearch">查询</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" class="action-btn" @click="handleAdd">
        <i class="el-icon-plus"></i>新增库位
      </el-button>
      <el-button 
        type="danger" 
        class="action-btn" 
        :disabled="!selectedRows.length" 
        @click="handleBatchDelete"
      >
        <i class="el-icon-delete"></i>批量删除
      </el-button>
      <el-button class="action-btn" @click="handleExport" style="display: none;">
        <i class="el-icon-download"></i>导出数据
      </el-button>
      <el-button class="action-btn" @click="handleLocationMap" style="display: none;">
        <i class="el-icon-location-outline"></i>库位地图
      </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="data-container">
      <div class="table-container">        <el-table
          v-loading="loading"
          :data="tableData"
          border
          stripe
          height="calc(100vh - 300px)"
          style="width: 100%"
          header-fixed
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="locationCode" label="库位编号" width="140" sortable>
            <template #default="{ row }">
              <el-link type="primary" @click="handleLocationDetail(row)">
                {{ row.locationCode }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="locationName" label="库位名称" width="160" show-overflow-tooltip />
          <el-table-column prop="warehouseName" label="所属仓库" width="120" />
          <el-table-column label="位置信息" width="200">
            <template #default="{ row }">
              <span class="location-position">
                {{ formatLocationPosition(row) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="locationType" label="库位类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getLocationTypeTagType(row.locationType)" size="small">
                {{ getLocationTypeText(row.locationType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="容量信息" width="160">
            <template #default="{ row }">
              <div class="capacity-info">
                <div class="capacity-bar">
                  <el-progress 
                    :percentage="getOccupancyPercentage(row)" 
                    :color="getOccupancyColor(row)"
                    :stroke-width="19"
                    text-inside
                  />
                </div>
                <div class="capacity-text">
                  {{ row.currentOccupancy || 0 }} / {{ row.capacity || 0 }}
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="materialInfo" label="存储通用" width="200">
            <template #default="{ row }">
              <div v-if="row.materialInfo && row.materialInfo.length > 0">
                <div 
                  v-for="(material, index) in row.materialInfo.slice(0, 2)" 
                  :key="index"
                  class="material-item"
                >
                  <el-tag size="small" class="material-tag">
                    {{ material.materialName }}
                  </el-tag>
                  <span class="material-quantity">{{ material.quantity }}{{ material.unit }}</span>
                </div>
                <el-link 
                  v-if="row.materialInfo.length > 2" 
                  type="primary" 
                  size="small"
                  @click="showMoreMaterials(row)"
                >
                  +{{ row.materialInfo.length - 2 }}种通用
                </el-link>
              </div>
              <span v-else class="empty-location">空库位</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="130" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="禁用"
                @change="handleStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small"<el-button link type="primary" @click="handlePrint(row)">
              <el-icon><Printer /></el-icon>
            </el-button>
            <el-button link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
              <el-button size="small" link type="info" @click="handleLocationDetail(row)">
                详情
              </el-button>
              <el-button size="small" link type="success" @click="handleInventoryManage(row)" style="display: none;">
                库存
              </el-button>
              <el-button size="small" link type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :page-sizes="[5,10, 20, 50, 100]"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑库位对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="库位编号" prop="locationCode">
              <el-input 
                v-model="formData.locationCode" 
                placeholder="请输入库位编号"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库位名称" prop="locationName">
              <el-input v-model="formData.locationName" placeholder="请输入库位名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属仓库" prop="warehouseId">
              <el-select v-model="formData.warehouseId" placeholder="请选择仓库" style="width: 100%">
                <el-option
                  v-for="warehouse in warehouseOptions"
                  :key="warehouse.value"
                  :label="warehouse.label"
                  :value="warehouse.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库位类型" prop="locationType">
              <el-select v-model="formData.locationType" placeholder="请选择类型" style="width: 100%">
                <el-option
                  v-for="type in locationTypeOptions"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="区域" prop="zone">
              <el-input v-model="formData.zone" placeholder="如：A区" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="排" prop="row">
              <el-input v-model="formData.row" placeholder="如：01排" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="列" prop="col">
              <el-input v-model="formData.col" placeholder="如：01列" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="层" prop="level">
              <el-input v-model="formData.level" placeholder="如：01层" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="容量" prop="capacity">
              <el-input-number
                v-model="formData.capacity"
                :min="0"
                :precision="2"
                controls-position="right"
                style="width: 100%"
                placeholder="库位最大容量"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 库位详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="库位详情"
      width="1000px"
      destroy-on-close
    >
      <div v-if="locationDetail" class="location-detail">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="库位编号">{{ locationDetail.data.locationCode }}</el-descriptions-item>
          <el-descriptions-item label="库位名称">{{ locationDetail.data.locationName }}</el-descriptions-item>
          <el-descriptions-item label="所属仓库">{{ locationDetail.data.warehouseName }}</el-descriptions-item>
          <el-descriptions-item label="位置信息">
            {{ formatLocationPosition(locationDetail.data) }}
          </el-descriptions-item>
          <el-descriptions-item label="库位类型">
            <el-tag :type="getLocationTypeTagType(locationDetail.data.locationType)">
              {{ getLocationTypeText(locationDetail.data.locationType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="容量利用率">
            <el-progress 
              :percentage="getOccupancyPercentage(locationDetail.data)" 
              :color="getOccupancyColor(locationDetail.data)"
            />
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">库存明细</el-divider>
        
        <el-table :data="locationDetail.data.inventoryDetails" border stripe>
          <el-table-column prop="materialCode" label="通用编码" width="120" />
          <el-table-column prop="materialName" label="通用名称" width="150" />
          <el-table-column prop="specification" label="规格" show-overflow-tooltip />
          <el-table-column prop="batchNumber" label="批次号" width="120" />
          <el-table-column label="库存数量" width="120" align="right">
            <template #default="{ row }">
              {{ row.currentQuantity }}{{ row.unit }}
            </template>
          </el-table-column>
          <el-table-column prop="lastInboundDate" label="最后入库时间" width="160" />
        </el-table>
      </div>
    </el-dialog>

    <!-- 通用详情弹窗 -->
    <el-dialog
      v-model="materialDialogVisible"
      title="库位存储通用详情"
      width="600px"
    >
      <el-table :data="selectedLocationMaterials" border>
        <el-table-column prop="materialName" label="通用名称" />
        <el-table-column prop="materialCode" label="通用编码" />
        <el-table-column label="数量">
          <template #default="{ row }">
            {{ row.quantity }}{{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="batchNumber" label="批次号" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, Search, Printer } from '@element-plus/icons-vue'

// 使用动态导入处理request模块，确保兼容性
const getRequestModule = async () => {
  try {
    const module = await import('@/utils/request')
    return module.default
  } catch (error) {
    console.warn('无法导入request模块，使用axios或fetch替代')
    // 可以在这里实现fallback逻辑
    return null
  }
}

// 初始化request
let request = null
onMounted(async () => {
  request = await getRequestModule()
  if (request) {
    await Promise.all([
      getTableData(),
      getWarehouseOptions()
    ])
  } else {
    // 使用模拟数据进行演示
    initMockData()
  }
})

// 响应式数据
const tableData = ref([])
const loading = ref(false)
const selectedRows = ref([])
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const materialDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const submitLoading = ref(false)
const locationDetail = ref(null)
const selectedLocationMaterials = ref([])

// 搜索表单
const searchForm = reactive({
  locationCode: '',
  locationName: '',
  warehouseId: '',
  locationType: '',
  occupancyStatus: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 表单数据
const formRef = ref(null)
const formData = reactive({
  locationCode: '',
  locationName: '',
  warehouseId: '',
  locationType: 'Raw',
  zone: '',
  row: '',
  col: '',
  level: '',
  capacity: 1000,
  status: 1
})

// 选项数据
const warehouseOptions = ref([])
const locationTypeOptions = [
  { value: 'Raw', label: '原材料库位' },
  { value: 'Finished', label: '成品库位' },
  { value: 'Normal', label: '普通库位' }
]

const occupancyStatusOptions = [
  { value: 'empty', label: '空闲' },
  { value: 'partial', label: '部分占用' },
  { value: 'full', label: '满库位' },
  { value: 'overload', label: '超载' }
]

// 表单验证规则
const formRules = reactive({
  locationCode: [{ required: true, message: '请输入库位编号', trigger: 'blur' }],
  locationName: [{ required: true, message: '请输入库位名称', trigger: 'blur' }],
  warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
  locationType: [{ required: true, message: '请选择库位类型', trigger: 'change' }],
  capacity: [{ required: true, message: '请输入容量', trigger: 'blur' }]
})

// 计算属性和方法
const formatLocationPosition = (row) => {
  const parts = []
  if (row.zone) parts.push(`${row.zone}`)
  if (row.row) parts.push(`${row.row}`)
  if (row.col) parts.push(`${row.col}`)
  if (row.level) parts.push(`${row.level}`)
  return parts.join('-') || '未设置'
}

const getOccupancyPercentage = (row) => {
  if (!row.capacity || row.capacity === 0) return 0
  return Math.round((row.currentOccupancy || 0) / row.capacity * 100)
}

const getOccupancyColor = (row) => {
  const percentage = getOccupancyPercentage(row)
  if (percentage === 0) return '#909399'
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  if (percentage < 100) return '#f56c6c'
  return '#ff4757'
}

const getLocationTypeTagType = (type) => {
  const typeMap = {
    'Raw': 'success',
    'Finished': 'warning',
    'Normal': 'info'
  }
  return typeMap[type] || 'info'
}

const getLocationTypeText = (type) => {
  const typeMap = {
    'Raw': '原材料',
    'Finished': '成品',
    'Normal': '普通'
  }
  return typeMap[type] || '普通'
}

// 模拟数据初始化
const initMockData = () => {
  console.log('使用模拟数据初始化')
  
  // 模拟仓库选项
  warehouseOptions.value = [
    { value: 1, label: '原材料仓库' },
    { value: 2, label: '成品仓库' },
    { value: 3, label: '包装材料仓库' }
  ]

  // 模拟库位数据
  tableData.value = [
    {
      locationCode: 'WH001-A01-R01-C01-L01',
      locationName: 'A区01排01列01层',
      warehouseId: 1,
      warehouseName: '原材料仓库',
      locationType: 'Raw',
      zone: 'A',
      row: '01',
      col: '01',
      level: '01',
      capacity: 1000,
      currentOccupancy: 500,
      status: 1,
      materialInfo: [
        { materialName: 'PP塑料颗粒', quantity: 500, unit: 'KG', batchNumber: 'PP20250615001' }
      ]
    },
    {
      locationCode: 'WH001-A01-R01-C02-L01',
      locationName: 'A区01排02列01层',
      warehouseId: 1,
      warehouseName: '原材料仓库',
      locationType: 'Raw',
      zone: 'A',
      row: '01',
      col: '02',
      level: '01',
      capacity: 1000,
      currentOccupancy: 0,
      status: 1,
      materialInfo: []
    }
  ]
  
  pagination.total = tableData.value.length
}

// API调用方法
const getTableData = async () => {
  if (!request) {
    initMockData()
    return
  }

  try {
    loading.value = true
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      locationCode: searchForm.locationCode || undefined,
      locationName: searchForm.locationName || undefined,
      warehouseId: searchForm.warehouseId || undefined,
      locationType: searchForm.locationType || undefined,
      occupancyStatus: searchForm.occupancyStatus || undefined
    }
    
    const response = await request({
      url: '/locations/list',
      method: 'get',
      params
    })
    
    if (response.data) {
      tableData.value = response.data.list || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    console.error('获取库位列表失败:', error)
    ElMessage.error('获取库位列表失败')
    // 失败时使用模拟数据
    initMockData()
  } finally {
    loading.value = false
  }
}

const getWarehouseOptions = async () => {
  if (!request) return

  try {
    const response = await request({
      url: '/warehouses/options',
      method: 'get'
    })
    
    const resData = response.data?.data || response.data || []
    if (Array.isArray(resData)) {
      warehouseOptions.value = resData.map(item => ({
        value: item.id,
        label: item.name
      }))
    }
  } catch (error) {
    console.error('获取仓库选项失败:', error)
    // 使用默认选项
    warehouseOptions.value = [
      { value: 1, label: '原材料仓库' },
      { value: 2, label: '成品仓库' },
      { value: 3, label: '包装材料仓库' }
    ]
  }
}

const getLocationDetail = async (locationCode) => {
  if (!request) {
    ElMessage.info('详情功能需要后端支持')
    return
  }

  try {
    const response = await request({
      url: `/locations/${locationCode}`,
      method: 'get'
    })
    
    if (response.data) {
      locationDetail.value = response.data
      detailDialogVisible.value = true
      console.log('库位详情:', locationDetail.value)
    }
  } catch (error) {
    console.error('获取库位详情失败:', error)
    ElMessage.error('获取库位详情失败')
  }
}

// 事件处理方法
const handleSearch = () => {
  pagination.currentPage = 1
  getTableData()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  handleSearch()
}

const clearSearch = () => {
  searchForm.locationCode = ''
  handleSearch()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  getTableData()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  getTableData()
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const handleRowClick = (row) => {
  // 点击行可以触发选择或查看详情等操作
}

const handleAdd = () => {
  dialogTitle.value = '新增库位'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑库位'
  isEdit.value = true
  Object.assign(formData, {
    locationCode: row.locationCode,
    locationName: row.locationName,
    warehouseId: row.warehouseId,
    locationType: row.locationType,
    zone: row.zone,
    row: row.row,
    col: row.col,
    level: row.level,
    capacity: row.capacity,
    status: row.status
  })
  dialogVisible.value = true
}

// const handleDelete = (row) => {
//   ElMessageBox.confirm('确认删除该库位吗？', '提示', {
//     confirmButtonText: '确定',
//     cancelButtonText: '取消',
//     type: 'warning'
//   }).then(async () => {
//     if (!request) {
//       ElMessage.info('删除功能需要后端支持')
//       return
//     }

//     try {
//       await request({
//         url: `/locations/${row.locationCode}`,
//         method: 'delete'
//       })
//       ElMessage.success('删除成功')
//       getTableData()
//     } catch (error) {
//       ElMessage.error('删除失败')
//     }
//   }).catch(() => {
//     ElMessage.info('已取消删除')
//   })
// }

const handleDelete = async (row) => {
  // 使用浏览器原生确认框
  const confirmed = confirm('确认删除该库位吗？')
  
  if (confirmed) {
    if (!request) {
      ElMessage.info('删除功能需要后端支持')
      return
    }

    try {
      await request({
        url: `/locations/${row.locationCode}`,
        method: 'delete'
      })
      ElMessage.success('删除成功')
      getTableData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  } else {
    ElMessage.info('已取消删除')
  }
}

const handleBatchDelete = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请至少选择一条数据')
    return
  }
  
  ElMessageBox.confirm(`确认删除选中的${selectedRows.value.length}条数据吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    if (!request) {
      ElMessage.info('批量删除功能需要后端支持')
      return
    }

    try {
      const locationCodes = selectedRows.value.map(row => row.locationCode)
      await request({
        url: '/locations/batch-delete',
        method: 'delete',
        data: { locationCodes }
      })
      ElMessage.success('批量删除成功')
      getTableData()
    } catch (error) {
      ElMessage.error('批量删除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleStatusChange = async (row) => {
  if (!request) {
    ElMessage.info('状态更新功能需要后端支持')
    // 恢复原状态
    row.status = row.status === 1 ? 0 : 1
    return
  }

  try {
    await request({
      url: `/locations/${row.locationCode}/status`,
      method: 'put',
      data: { status: row.status }
    })
    ElMessage.success('状态更新成功')
  } catch (error) {
    // 恢复原状态
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error('状态更新失败')
  }
}

const handleLocationDetail = (row) => {
  getLocationDetail(row.locationCode)
}

const handleInventoryManage = (row) => {
  // 跳转到库存管理页面，传递库位信息
  ElMessage.info('跳转到库存管理功能')
}

const handleExport = async () => {
  if (!request) {
    ElMessage.info('导出功能需要后端支持')
    return
  }

  try {
    const response = await request({
      url: '/locations/export',
      method: 'get',
      params: searchForm,
      responseType: 'blob'
    })
    
    // 处理文件下载
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `库位列表_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const handleLocationMap = () => {
  ElMessage.info('库位地图功能开发中')
}

// ===== 打印功能 (Print Barcode) =====
const handlePrint = (row) => {
  const barcodeUrl = `/api/print/barcode?text=${row.LocationCode}&type=code128&scale=4&height=12`;
  
  const printWindow = window.open('', '_blank');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>库位条码打印</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
        .label { border: 2px solid #000; padding: 20px; width: 300px; text-align: center; border-radius: 10px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .zone { font-size: 18px; margin-bottom: 15px; color: #555; }
        img { max-width: 100%; height: auto; }
        @media print {
          @page { size: 100mm 60mm; margin: 0; }
          body { height: auto; }
          .label { border: none; width: 100%; height: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="title">WMS 通用库位标签</div>
        <div class="zone">${row.WarehouseType === 'Normal' ? '标准库区' : row.WarehouseType}</div>
        <img src="${barcodeUrl}" alt="Barcode" onload="window.print(); setTimeout(() => window.close(), 500);" />
        <div style="margin-top:10px;font-size:12px;color:#888;">扫码绑定作业</div>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

const showMoreMaterials = (row) => {
  selectedLocationMaterials.value = row.materialInfo
  materialDialogVisible.value = true
}

const resetForm = () => {
  Object.assign(formData, {
    locationCode: '',
    locationName: '',
    warehouseId: '',
    locationType: 'Raw',
    zone: '',
    row: '',
    col: '',
    level: '',
    capacity: 1000,
    status: 1
  })
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const submitForm = async () => {
  if (!request) {
    ElMessage.info('保存功能需要后端支持')
    dialogVisible.value = false
    return
  }

  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value) {
      await request({
        url: `/locations/${formData.locationCode}`,
        method: 'put',
        data: formData
      })
      ElMessage.success('编辑成功')
    } else {
      await request({
        url: '/locations',
        method: 'post',
        data: formData
      })
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
    getTableData()
  } catch (error) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
      dialogVisible.value = false
      getTableData()
    } else {
      ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
      dialogVisible.value = false
      getTableData()
    }
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.erp-container {
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  background-color: #f0f2f5;
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
}

.filter-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-col {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;

  label {
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
    font-size: 14px;
    white-space: nowrap;
  }

  .el-input,
  .el-select {
    width: 100%;
  }
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
}

.btn-reset {
  background: #f5f7fa;
  border-color: #e4e7ed;
  color: #666;
}

.btn-primary {
  background: #409eff;
  border-color: #409eff;
  transition: all 0.3s;

  &:hover {
    background: #66b1ff;
  }
}

.action-bar {
  display: flex;
  gap: 12px;
  padding: 0 24px;
  margin-bottom: 16px;
}

.action-btn {
  height: 44px;
  border-radius: 4px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;

  i {
    margin-right: 6px;
    font-size: 16px;
  }
}

.data-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-container {
  flex: 1;
  overflow: auto;
  padding: 16px;
  
  .el-table {
    width: 100%;
    
    .el-table__row {
      cursor: pointer;
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
}

.location-position {
  color: #606266;
  font-size: 12px;
  background: #f0f9ff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e1f5fe;
}

.capacity-info {
  .capacity-bar {
    margin-bottom: 4px;
  }
  
  .capacity-text {
    font-size: 12px;
    color: #666;
    text-align: center;
  }
}

.material-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  
  .material-tag {
    margin-right: 8px;
    max-width: 100px;
  }
  
  .material-quantity {
    font-size: 12px;
    color: #666;
  }
}

.empty-location {
  color: #c0c4cc;
  font-style: italic;
}

.pagination-container {
  padding: 16px;
  border-top: 1px solid #ebeef5;
  background: white;
  display: flex;
  justify-content: center;
}

.location-detail {
  .el-descriptions {
    margin-bottom: 20px;
  }
  
  .el-table {
    margin-top: 16px;
  }
}

.el-dialog {
  border-radius: 8px;

  .el-dialog__header {
    border-bottom: 1px solid #e4e7ed;
    margin-right: 0;
    padding: 20px 24px 16px;
  }

  .el-dialog__body {
    padding: 24px;
  }

  .el-dialog__footer {
    border-top: 1px solid #e4e7ed;
    padding: 16px 24px;
  }
}

.el-form {
  .el-row {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .el-input-number {
    width: 100%;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .filter-row {
    flex-direction: column;
  }
  
  .filter-col {
    min-width: auto;
  }
  
  .action-bar {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .erp-container {
    padding: 8px;
  }
  
  .filter-card {
    padding: 16px;
  }
  
  .action-bar {
    padding: 0 16px;
  }
  
  .action-btn {
    flex: 1;
    min-width: 120px;
  }
}
</style>
