<template>
    <div class="erp-container">
        <!-- 筛选卡片 -->
        <div class="filter-card">
            <div class="filter-row">
                <div class="filter-col">
                    <label>商品名称/编码</label>
                    <el-input v-model="searchQuery" placeholder="请输入商品名称或编码" clearable @clear="clearSearch" />
                </div>
                <div class="filter-col">
                    <label>分类</label>
                    <el-select v-model="categoryFilter" placeholder="全部分类" clearable>
                        <el-option v-for="item in categories" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </div>
                <div class="filter-col">
                    <label>状态</label>
                    <el-select v-model="statusFilter" placeholder="全部状态" clearable>
                        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </div>
            </div>
            <div class="filter-actions">
                <el-button class="btn-reset" @click="resetFilters">重置</el-button>
                <el-button class="btn-primary" @click="handleSearch">查询</el-button>
            </div>
        </div>

        <!-- 操作栏 -->
        <div class="action-bar">
            <el-button class="action-btn" type="primary" @click="handleAdd">
                <i class="el-icon-plus"></i>
                新增商品
            </el-button>
            <el-button class="action-btn" @click="exportData">
                <i class="el-icon-download"></i>
                导出数据
            </el-button>
        </div>

        <!-- 数据表格 -->
        <div class="data-container">
            <div class="table-wrapper">
                <el-table 
                    :data="materials" 
                    border 
                    stripe 
                    v-loading="loading"
                    @selection-change="handleSelectionChange"
                    style="width: 100%"
                    height="440"
                    empty-text="暂无数据">
                    
                    <el-table-column type="selection" width="50" align="center" />
                    
                    <el-table-column prop="code" label="商品编码" width="120" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ row.code || '-' }}
                        </template>
                    </el-table-column>
                    
                    <el-table-column prop="name" label="商品名称" width="150" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ row.name || '-' }}
                        </template>
                    </el-table-column>
                    
                    <el-table-column prop="category" label="分类" width="120" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ row.category || '-' }}
                        </template>
                    </el-table-column>
                    
                    <el-table-column prop="specification" label="规格" width="180" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ row.specification || '-' }}
                        </template>
                    </el-table-column>
                    
                    <el-table-column prop="unit" label="单位" width="80" align="center">
                        <template #default="{ row }">
                            {{ row.unit || '-' }}
                        </template>
                    </el-table-column>
                    
                    <el-table-column label="当前库存" width="120" align="right">
                        <template #default="{ row }">
                            <span :class="getStockClass(row)">
                                {{ formatStock(row.stock || 0) }}
                            </span>
                        </template>
                    </el-table-column>
                    
                    <el-table-column label="最小库存" width="100" align="right">
                        <template #default="{ row }">
                            {{ formatStock(row.minStock || 0) }}
                        </template>
                    </el-table-column>
                    
                    <el-table-column label="状态" width="100" align="center">
                        <template #default="{ row }">
                            <el-tag :type="getStatusTagType(row.status)" size="small">
                                {{ row.status }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    
                    <el-table-column label="操作" width="180" fixed="right" align="center">
                        <template #default="{ row }">
                            <el-button 
                                link 
                                type="info" 
                                size="small" 
                                @click="handleDetails(row)">
                                详情
                            </el-button>
                            <el-button 
                                link 
                                type="primary" 
                                size="small" 
                                @click="editMaterial(row)">
                                编辑
                            </el-button>
                            <el-button 
                                link 
                                type="danger" 
                                size="small" 
                                @click="deleteMaterial(row)">
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 分页 -->
            <div class="pagination">
                <el-pagination background layout="total, sizes, prev, pager, next, jumper" 
                    :current-page="currentPage" 
                    :page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="totalItems" 
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
            </div>
        </div>

        <!-- 新增/编辑对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
            <el-form :model="currentMaterial" label-width="120px" :rules="formRules" ref="materialForm">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="商品编码" prop="code">
                            <el-input v-model="currentMaterial.code" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="商品名称" prop="name">
                            <el-input v-model="currentMaterial.name" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="分类" prop="category">
                            <el-select v-model="currentMaterial.category" placeholder="请选择" style="width: 100%">
                                <el-option v-for="item in categories" :key="item.value" :label="item.label"
                                    :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="单位" prop="unit">
                            <el-input v-model="currentMaterial.unit" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="规格" prop="specification">
                    <el-input v-model="currentMaterial.specification" />
                </el-form-item>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="最小库存" prop="minStock">
                            <el-input-number v-model="currentMaterial.minStock" :min="0" :precision="2" 
                                style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="最大库存" prop="maxStock">
                            <el-input-number v-model="currentMaterial.maxStock" :min="0" :precision="2" 
                                style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="状态">
                    <el-radio-group v-model="currentMaterial.status">
                        <el-radio label="正常">正常</el-radio>
                        <el-radio label="盘盈">盘盈</el-radio>
                        <el-radio label="盘亏">盘亏</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
            </template>
        </el-dialog>

        <!-- 详情对话框 -->
        <el-dialog v-model="detailDialogVisible" title="商品详情" width="800px">
            <div v-if="materialDetail" class="detail-container">
                <!-- 基本信息 -->
                <div class="detail-section">
                    <h3 class="section-title">基本信息</h3>
                    <el-row :gutter="20" class="detail-row">
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">商品编码：</span>
                                <span class="value">{{ materialDetail.data.code }}</span>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">商品名称：</span>
                                <span class="value">{{ materialDetail.data.name }}</span>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">分类：</span>
                                <span class="value">{{ materialDetail.data.category }}</span>
                            </div>
                        </el-col>
                    </el-row>
                    <el-row :gutter="20" class="detail-row">
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">规格：</span>
                                <span class="value">{{ materialDetail.data.specification || '-' }}</span>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">单位：</span>
                                <span class="value">{{ materialDetail.data.unit }}</span>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">状态：</span>
                                <el-tag :type="getStatusTagType(materialDetail.data.Status)" size="small">
                                    {{ getStatusText(materialDetail.data.Status) }}
                                </el-tag>
                            </div>
                        </el-col>
                    </el-row>
                </div>

                <!-- 库存信息 -->
                <div class="detail-section">
                    <h3 class="section-title">库存信息</h3>
                    <el-row :gutter="20" class="detail-row">
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">当前库存：</span>
                                <span class="value stock-highlight">{{ formatStock(materialDetail.data.totalStock || 0) }}</span>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">最小库存：</span>
                                <span class="value">{{ formatStock(materialDetail.data.MinStock || 0) }}</span>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">最大库存：</span>
                                <span class="value">{{ formatStock(materialDetail.data.MaxStock || 0) }}</span>
                            </div>
                        </el-col>
                    </el-row>
                    <el-row :gutter="20" class="detail-row">
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">可用数量：</span>
                                <span class="value">{{ formatStock(materialDetail.data.totalAvailable || materialDetail.data.stock || 0) }}</span>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">预留数量：</span>
                                <span class="value">{{ formatStock(materialDetail.data.totalReserved || 0) }}</span>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">库存状态：</span>
                                <el-tag :type="getStockStatusType(materialDetail.data)" size="small">
                                    {{ getStockStatusText(materialDetail.data) }}
                                </el-tag>
                            </div>
                        </el-col>
                    </el-row> 
                    <!-- <el-row :gutter="20" class="detail-row">
                        <el-col :span="8">
                            <div class="detail-item">
                                <span class="label">库位：</span>
                                <span class="value">{{locationNames().join(', ') || '-' }}</span>
                            </div>
                        </el-col>
                    </el-row>                             -->
                </div>

                <!-- 库位分布 -->
                <div class="detail-section" v-if="materialDetail.data.inventoryDetails && materialDetail.data.inventoryDetails.length > 0">
                    <h3 class="section-title">库位分布</h3>
                    <el-table :data="materialDetail.data.inventoryDetails" border size="small" max-height="300">
                        <el-table-column prop="locationId" label="库位编码" width="180" >
                            <template #default="{ row }">
                                {{ row.LocationID || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="locationName" label="库位名称" width="150" >
                            <template #default="{ row }">
                                {{ row.LocationName || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="batchNumber" label="批次号" width="120" >
                            <template #default="{ row }">
                                {{ row.BatchNumber || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="currentQuantity" label="库存数量" width="100" align="right">
                            <template #default="{ row }">
                                {{ formatStock(row.CurrentQuantity || 0) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="availableQuantity" label="可用数量" width="100" align="right">
                            <template #default="{ row }">
                                {{ formatStock(row.AvailableQuantity || 0) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="productionDate" label="生产日期" width="100">
                            <template #default="{ row }">
                                {{ row.ProductionDate || '-' }}
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <!-- 时间信息 -->
                <div class="detail-section">
                    <h3 class="section-title">时间信息</h3>
                    <el-row :gutter="20" class="detail-row">
                        <el-col :span="12">
                            <div class="detail-item">
                                <span class="label">创建时间：</span>
                                <span class="value">{{ formatDateTime(materialDetail.data.CreatedAt) }}</span>
                            </div>
                        </el-col>
                        <el-col :span="12">
                            <div class="detail-item">
                                <span class="label">更新时间：</span>
                                <span class="value">{{ formatDateTime(materialDetail.data.UpdatedAt) }}</span>
                            </div>
                        </el-col>
                    </el-row>
                    <el-row :gutter="20" class="detail-row">
                        <el-col :span="12">
                            <div class="detail-item">
                                <span class="label">最后入库时间：</span>
                                <span class="value">{{ formatDateTime(materialDetail.data.inventoryDetails[0].LastInboundDate) || '-' }}</span>
                            </div>
                        </el-col>
                        <el-col :span="12">
                            <div class="detail-item">
                                <span class="label">最后出库时间：</span>
                                <span class="value">{{ formatDateTime(materialDetail.data.inventoryDetails[0].LastOutboundDate) || '-' }}</span>
                            </div>
                        </el-col>
                    </el-row>
                </div>
            </div>
            <template #footer>
                <el-button @click="detailDialogVisible = false">关闭</el-button>
                <el-button type="primary" @click="editMaterial(materialDetail)">编辑</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

// 响应式数据
const materials = ref([])
const loading = ref(false)
const submitting = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(7)
const totalItems = ref(0)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const materialDetail = ref(null)
const currentMaterial = ref({
    id: null,
    code: '',
    name: '',
    category: '',
    specification: '',
    unit: '',
    minStock: 0,
    maxStock: 0,
    status: '正常'
})
const selectedMaterials = ref([])

// 分类选项
const categories = [
    { value: '塑料商品', label: '塑料商品' },
    { value: '金属商品', label: '金属商品' },
    { value: '玻璃商品', label: '玻璃商品' },
    { value: '密封配件', label: '密封配件' },
    { value: '配件', label: '配件' },
    { value: '包装材料', label: '包装材料' }
]

// 状态选项
const statusOptions = [
    { value: '正常', label: '正常' },
    { value: '盘盈', label: '盘盈' },
    { value: '盘亏', label: '盘亏' }
]

// 表单验证规则
const formRules = {
    code: [
        { required: true, message: '请输入商品编码', trigger: 'blur' },
        { pattern: /^[A-Z0-9]{3,20}$/, message: '商品编码格式不正确', trigger: 'blur' }
    ],
    name: [
        { required: true, message: '请输入商品名称', trigger: 'blur' },
        { min: 2, max: 100, message: '商品名称长度在2到100个字符', trigger: 'blur' }
    ],
    category: [{ required: true, message: '请选择分类', trigger: 'change' }],
    unit: [
        { required: true, message: '请输入单位', trigger: 'blur' },
        { max: 10, message: '单位长度不能超过10个字符', trigger: 'blur' }
    ],
    minStock: [{ type: 'number', min: 0, message: '最小库存不能小于0', trigger: 'blur' }],
    maxStock: [{ type: 'number', min: 0, message: '最大库存不能小于0', trigger: 'blur' }]
}

// 计算属性
const filteredMaterials = computed(() => {
    return materials.value
})

// 格式化方法
const formatStock = (value) => {
    if (value === null || value === undefined) return '0.00'
    return Number(value).toFixed(2)
}

const getStatusText = (status) => {
    if (status === 1 || status === '1' || status === true) return '启用'
    if (status === 0 || status === '0' || status === false) return '禁用'
    return '未知'
}

// 生命周期钩子
onMounted(() => {
    fetchMaterials()
})

// 方法
const fetchMaterials = async () => {
    loading.value = true
    try {
        const response = await api.getInventory({
            page: currentPage.value,
            pageSize: pageSize.value,
            keyword: searchQuery.value || undefined,
            category: categoryFilter.value || undefined,
            status: statusFilter.value !== '' ? statusFilter.value : undefined
        })
        
        materials.value = response.data?.items || response.data?.list || response.data || []
        totalItems.value = response.data?.total || response.data?.count || materials.value.length || 0
    } catch (error) {
        console.error('获取商品库存列表失败:', error)
        ElMessage.error('获取商品库存列表失败')
        materials.value = []
        totalItems.value = 0
    } finally {
        loading.value = false
    }
}

const clearSearch = () => {
    searchQuery.value = ''
    currentPage.value = 1
    fetchMaterials()
}

const resetFilters = () => {
    searchQuery.value = ''
    categoryFilter.value = ''
    statusFilter.value = ''
    currentPage.value = 1
    fetchMaterials()
}

const handleSearch = () => {
    currentPage.value = 1
    fetchMaterials()
}

const handleCurrentChange = (val) => {
    currentPage.value = val
    fetchMaterials()
}

const handleSizeChange = (val) => {
    pageSize.value = val
    currentPage.value = 1
    fetchMaterials()
}

const handleSelectionChange = (val) => {
    selectedMaterials.value = val
}

const getStatusTagType = (status) => {
    if (status === 1 || status === '正常' || status === true) return 'success'
    if (status === 0 || status === '盘盈' || status==='盘亏'|| status === false) return 'danger'
    return 'info'
}

const getStockClass = (row) => {
    const currentStock = row.TotalStock || row.CurrentStock || 0
    const minStock = row.MinStock || 0
    if (minStock > 0 && currentStock <= minStock) {
        return 'low-stock'
    }
    return ''
}

const getStockStatusType = (material) => {
    const currentStock = material.stock || 0
    const minStock = material.minStock || 0
    const maxStock = material.maxStock || 0
    
    if (minStock > 0 && currentStock <= minStock) return 'danger'
    if (maxStock > 0 && currentStock >= maxStock) return 'warning'
    return 'success'
}

const getStockStatusText = (material) => {
    const currentStock = material.stock || 0
    const minStock = material.minStock || 0
    const maxStock = material.maxStock || 0
    
    if (minStock > 0 && currentStock <= minStock) return '库存不足'
    if (maxStock > 0 && currentStock >= maxStock) return '库存过多'
    return '正常'
}

const handleAdd = () => {
    dialogTitle.value = '新增商品'
    currentMaterial.value = {
        ItemID: null,
        ItemCode: '',
        ItemName: '',
        Category: '',
        Specification: '',
        Unit: '',
        Description: '',
        MinStock: 0,
        MaxStock: 0,
        Status: 1
    }
    dialogVisible.value = true
}

const handleDetails = async (row) => {
    try {
        loading.value = true
        console.log('获取详情:', row)
        
        const materialId = row.ItemID || row.id
        if (!materialId) {
            ElMessage.error('无法获取商品ID')
            return
        }
        
        const response = await getRawMaterialInventoryDetail(materialId)
        console.log('详情响应:', response)
        
        if (response && response.data) {
            materialDetail.value = response.data
            detailDialogVisible.value = true
        } else {
            ElMessage.error('获取商品详情失败')
        }
    } catch (error) {
        console.error('获取商品详情失败:', error)
        ElMessage.error(error.response?.data?.message || error.message || '获取商品详情失败')
    } finally {
        loading.value = false
    }
}

// const editMaterial = (row) => {
//     dialogTitle.value = '编辑商品'
//     currentMaterial.value = { ...row }
//     detailDialogVisible.value = false
//     dialogVisible.value = true
// }
const editMaterial = (row) => {
    dialogTitle.value = '编辑商品'
    
    // 适配不同的数据结构
    currentMaterial.value = {
        id: row.ItemID || row.id,
        code: row.ItemCode || row.code || '',
        name: row.ItemName || row.name || '',
        category: row.Category || row.category || '',
        specification: row.Specification || row.specification || '',
        unit: row.Unit || row.unit || '',
        minStock: row.MinStock || row.minStock || 0,
        maxStock: row.MaxStock || row.maxStock || 0,
        status: row.Status || row.status || '正常'
    }
    
    detailDialogVisible.value = false
    dialogVisible.value = true
}

// const deleteMaterial = (row) => {
//     const materialId = row.ItemID || row.id
//     const materialName = row.ItemName || row.name || '该商品'
    
//     ElMessageBox.confirm(
//         `确认删除商品"${materialName}"吗？删除后不可恢复！`, 
//         '删除确认', 
//         {
//             confirmButtonText: '确定删除',
//             cancelButtonText: '取消',
//             type: 'warning',
//             dangerouslyUseHTMLString: true
//         }
//     ).then(async () => {
//         try {
//             loading.value = true
//             await deleteRawMaterial(materialId)
//             ElMessage.success('删除成功')
//             fetchMaterials()
//         } catch (error) {
//             console.error('删除商品失败:', error)
//             ElMessage.error(error.response?.data?.message || error.message || '删除商品失败')
//         } finally {
//             loading.value = false
//         }
//     }).catch(() => {
//         ElMessage.info('已取消删除')
//     })
// }
const deleteMaterial = async (row) => {
    const materialId = row.ItemID || row.id
    const materialName = row.ItemName || row.name || '该商品'
    
    // 使用浏览器原生确认框
    const confirmed = confirm(`确认删除商品"${materialName}"吗？删除后不可恢复！`)
    
    if (confirmed) {
        try {
            loading.value = true
            await deleteRawMaterial(materialId)
            ElMessage.success('删除成功')
            fetchMaterials()
        } catch (error) {
            console.error('删除商品失败:', error)
            ElMessage.error(error.response?.data?.message || error.message || '删除商品失败')
        } finally {
            loading.value = false
        }
    }
}

const exportData = () => {
    ElMessage.success('导出功能开发中')
}

const submitForm = async () => {
    // 验证表单
    try {
        if (!currentMaterial.value.code) {
            ElMessage.error('请输入商品编码')
            return
        }
        if (!currentMaterial.value.name) {
            ElMessage.error('请输入商品名称')
            return
        }
        if (!currentMaterial.value.category) {
            ElMessage.error('请选择分类')
            return
        }
        if (!currentMaterial.value.unit) {
            ElMessage.error('请输入单位')
            return
        }

        // 验证最大库存不能小于最小库存
        if (currentMaterial.value.maxStock > 0 && currentMaterial.value.minStock > currentMaterial.value.maxStock) {
            ElMessage.error('最大库存不能小于最小库存')
            return
        }

        submitting.value = true

        const materialData = {
            code: currentMaterial.value.code,
            name: currentMaterial.value.name,
            category: currentMaterial.value.category,
            specification: currentMaterial.value.specification,
            unit: currentMaterial.value.unit,
            minStock: currentMaterial.value.minStock || 0,
            maxStock: currentMaterial.value.maxStock || 0,
            status: currentMaterial.value.status
        }

        if (currentMaterial.value.id) {
            // 更新
            await updateRawMaterial(currentMaterial.value.id, materialData)
            ElMessage.success('更新成功')
        } else {
            // 新增
            await addRawMaterial(materialData)
            ElMessage.success('新增成功')
        }

        dialogVisible.value = false
        fetchMaterials()
    } catch (error) {
        console.error('提交表单失败:', error)
        if (error.response && error.response.data && error.response.data.message) {
            ElMessage.error(error.response.data.message)
        } else {
            ElMessage.error(error.message || '操作失败')
        }
    } finally {
        submitting.value = false
        dialogVisible.value = false
        fetchMaterials()
    }
}

const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-'
    const date = new Date(dateTimeStr)
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

const locationNames = () => {
    return materialDetail.data.inventoryDetails.map(item => item.LocationName);
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
    gap: 16px;
    margin-bottom: 16px;
}

.filter-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    label {
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
        font-size: 14px;
        white-space: nowrap;
    }

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
    flex: 1;
    height: 44px;
    border-radius: 4px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
        margin-right: 6px;
        font-size: 18px;
    }
}

.data-container {
    flex: 1;
    overflow: hidden;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

    .table-wrapper {
        padding: 16px;
        height: 90%;
        
        .el-table {
            border-radius: 4px;
            overflow: hidden;
            
            .el-table__header {
                th {
                    background-color: #fafafa;
                    color: #303133;
                    font-weight: 600;
                    border-bottom: 1px solid #ebeef5;
                }
            }
            
            .el-table__body {
                tr {
                    &:hover {
                        background-color: #f5f7fa;
                    }
                    
                    td {
                        border-bottom: 1px solid #ebeef5;
                        padding: 12px 0;
                        
                        .cell {
                            padding: 0 10px;
                            word-break: break-all;
                        }
                    }
                }
            }

            .low-stock {
                color: #f56c6c;
                font-weight: bold;
            }

            .stock-highlight {
                font-weight: 600;
                color: #409eff;
            }
            
            .el-button {
                margin: 0 2px;
                
                &.is-link {
                    padding: 0;
                    height: auto;
                    line-height: normal;
                }
            }
        }
    }
}

.pagination {
    padding: 16px 0;
    display: flex;
    justify-content: center;
    background: white;
}

// 详情对话框样式
.detail-container {
    .detail-section {
        margin-bottom: 24px;
        
        .section-title {
            margin: 0 0 16px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e4e7ed;
            font-size: 16px;
            font-weight: 600;
            color: #303133;
        }
        
        .detail-row {
            margin-bottom: 16px;
            
            &:last-child {
                margin-bottom: 0;
            }
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            min-height: 32px;
            
            .label {
                font-weight: 500;
                color: #606266;
                margin-right: 8px;
                min-width: 80px;
                flex-shrink: 0;
            }
            
            .value {
                color: #303133;
                flex: 1;
                word-break: break-all;
                
                &.stock-highlight {
                    font-weight: 600;
                    font-size: 16px;
                    color: #409eff;
                }
            }
        }
    }
}

// 对话框表单样式
.el-dialog {
    border-radius: 8px;

    .el-dialog__header {
        border-bottom: 1px solid #e4e7ed;
        margin-right: 0;
        padding: 20px 20px 15px;
    }

    .el-dialog__body {
        padding: 20px;
    }

    .el-dialog__footer {
        border-top: 1px solid #e4e7ed;
        padding: 15px 20px 20px;
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
    
    .el-form-item {
        margin-bottom: 18px;
    }
}

// 响应式设计
@media (max-width: 768px) {
    .filter-row {
        flex-direction: column;
        gap: 12px;
    }
    
    .action-bar {
        flex-direction: column;
        
        .action-btn {
            width: 100%;
            margin-bottom: 8px;
        }
    }
    
    .el-dialog {
        width: 95% !important;
        margin: 5vh auto;
    }
    
    .detail-row {
        .el-col {
            margin-bottom: 12px;
        }
    }
}

// 表格样式优化
.el-table {
    .el-table__header {
        th {
            background-color: #fafafa;
            color: #303133;
            font-weight: 600;
        }
    }
    
    .el-table__body {
        tr:hover {
            background-color: #f5f7fa;
        }
    }
}

// 标签样式
.el-tag {
    border-radius: 4px;
    font-weight: 500;
}

// 按钮加载状态
.el-button.is-loading {
    position: relative;
    pointer-events: none;
    
    &:before {
        pointer-events: none;
        content: '';
        position: absolute;
        left: -1px;
        top: -1px;
        right: -1px;
        bottom: -1px;
        border-radius: inherit;
        background-color: hsla(0,0%,100%,.35);
    }
}

// 输入框焦点状态
.el-input__inner:focus,
.el-textarea__inner:focus,
.el-select .el-input.is-focus .el-input__inner {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

// 危险操作样式
.el-message-box.el-message-box--warning {
    .el-message-box__content {
        color: #e6a23c;
    }
}

// 分页器样式优化
.el-pagination {
    .el-pagination__total {
        color: #606266;
        font-weight: 500;
    }
    
    .btn-next,
    .btn-prev {
        border-radius: 4px;
    }
    
    .el-pager li {
        border-radius: 4px;
        margin: 0 2px;
        
        &.active {
            background-color: #409eff;
            color: white;
        }
    }
}
</style>
