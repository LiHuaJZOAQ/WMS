<template>
  <div class="erp-container">
    <!-- 查询条件区域 -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-col">
          <label>订单状态：</label>
          <el-select v-model="filter.orderStatus" placeholder="请选择">
            <el-option 
              v-for="item in options.orderStatus"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>入库单号：</label>
          <el-select v-model="filter.warehouseReceiptNo" placeholder="请选择">
            <el-option 
              v-for="item in options.warehouseReceiptNos"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>来源单号：</label>
          <el-select v-model="filter.sourceDocNo" placeholder="请选择">
            <el-option 
              v-for="item in options.sourceDocNos"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>商品名称：</label>
          <el-select v-model="filter.materialName" placeholder="请选择">
            <el-option 
              v-for="item in options.materialNames"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-col">
          <label>商品编号：</label>
          <el-select v-model="filter.materialNo" placeholder="请选择">
            <el-option 
              v-for="item in options.materialNos"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>批次号：</label>
          <el-select v-model="filter.batchNo" placeholder="请选择">
            <el-option 
              v-for="item in options.batchNos"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>入库仓库：</label>
          <el-select v-model="filter.warehouse" placeholder="请选择">
            <el-option 
              v-for="item in options.warehouses"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>入库类型：</label>
          <el-select v-model="filter.warehouseType" placeholder="请选择">
            <el-option 
              v-for="item in options.warehouseTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-col">
          <label>入库方式：</label>
          <el-select v-model="filter.warehouseMethod" placeholder="请选择">
            <el-option 
              v-for="item in options.warehouseMethods"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>往来单位：</label>
          <el-select v-model="filter.supplier" placeholder="请选择">
            <el-option 
              v-for="item in options.suppliers"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>生厂商：</label>
          <el-select v-model="filter.manufacturer" placeholder="请选择">
            <el-option 
              v-for="item in options.manufacturers"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="filter-col">
          <label>入库时间：</label>
          <el-date-picker
            v-model="filter.warehouseDate"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </div>
      </div>
      <div class="filter-actions">
        <div style="flex: 1;"></div>
        <el-button class="btn-reset" @click="resetFilter">重置</el-button>
        <el-button class="btn-primary" @click="search" :loading="loading">查询</el-button>
      </div>
    </div>
    <!-- 操作按钮区域 -->
    <div class="action-bar">
      <el-button class="action-btn" type="success" @click="handleNew">
        <i class="el-icon-plus"></i> 新建
      </el-button>
      <el-button class="action-btn" type="warning" @click="handleImportExport">
        <i class="el-icon-download"></i> 导入导出
      </el-button>
      <el-button class="action-btn" type="primary" @click="handleAudit" :disabled="!selectedRows.length">
        <i class="el-icon-check"></i> 审核
      </el-button>
      <el-button class="action-btn" type="primary" @click="handlePrint" :disabled="!selectedRows.length">
        <i class="el-icon-printer"></i> 打印
      </el-button>
    </div>
    <!-- 表格数据区域 -->
    <div class="data-container">
      <el-table
        :data="tableData"
        border
        stripe
        header-align="center"
        style="width: 100%"
        :row-class-name="tableRowClassName"
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column
          prop="warehouseReceiptNo"
          label="入库单号"
          width="150"
        />
        <el-table-column
          prop="receivedQuantity"
          label="实收数量"
          width="120"
          align="right"
        />
        <el-table-column
          prop="receivedGrossWeight"
          label="实收毛重(kg)"
          width="120"
          align="right"
        />
        <el-table-column
          prop="receivedNetWeight"
          label="实收净重(kg)"
          width="120"
          align="right"
        />
        <el-table-column
          prop="supplierName"
          label="往来单位名称"
          min-width="150"
        />
        <el-table-column
          prop="manufacturerName"
          label="生产商名称"
          min-width="150"
        />
        <el-table-column
          prop="orderDate"
          label="下单时间"
          width="180"
        />
        <el-table-column
          prop="warehouseDate"
          label="入库时间"
          width="180"
        />
        <el-table-column
          label="状态"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ statusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button 
              link 
              class="action-link" 
              @click="handleDetails(row)"
            >
              详情
            </el-button>
            <el-button 
              link 
              class="action-link" 
              type="primary" 
              @click="handleAudit(row)"
              :disabled="row.status !== 'pending'"
            >
              审核
            </el-button>
            <el-button 
              link 
              class="action-link" 
              @click="handlePrint(row)"
            >
              打印
            </el-button>
            <el-button 
              link 
              class="action-link" 
              type="danger" 
              @click="handleRevoke(row)"
              :disabled="row.status !== 'approved'"
            >
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next,"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

<!-- 新建入库单模态框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建入库单"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @closed="resetCreateForm"
    >
      <component 
        :is="createComponent" 
        ref="createFormRef"
        @success="handleCreateSuccess"
        @cancel="createDialogVisible = false"
      />
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="auditDialogVisible"
      title="审核入库单"
      width="500px"
    >
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.status">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="拒绝原因" v-if="auditForm.status === 'rejected'">
          <el-input
            v-model="auditForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAudit">确定</el-button>
      </template>
    </el-dialog>
  </div> 

  <!-- 查看详情模态框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="入库单详情"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @closed="resetDetailsForm"
    >
      <div v-if="detailsData">
        <el-row>
          <el-col :span="8">
            <strong>入库单号：</strong>{{ detailsData.warehouseReceiptNo }}
          </el-col>
          <el-col :span="8">
            <strong>往来单位：</strong>{{ detailsData.supplierName }}
          </el-col>
          <el-col :span="8">
            <strong>生产商：</strong>{{ detailsData.manufacturerName }}
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="8">
            <strong>实收数量：</strong>{{ detailsData.receivedQuantity }}
          </el-col>
          <el-col :span="8">
            <strong>入库仓库：</strong>{{ detailsData.warehouse }}
          </el-col>
          <el-col :span="8">
            <strong>入库时间：</strong>{{ detailsData.warehouseDate }}
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="8">
            <strong>状态：</strong>
            <el-tag :type="getStatusTagType(detailsData.status)">
              {{ statusMap[detailsData.status] }}
            </el-tag>
          </el-col>
          <el-col :span="8">
            <strong>商品名称：</strong>{{ detailsData.materialName }}
          </el-col>
          <el-col :span="8">
            <strong>商品编号：</strong>{{ detailsData.materialNo }}
          </el-col>
        </el-row>
        <!-- 可以根据需要扩展更多信息 -->
      </div>
      <template #footer>
        <el-button @click="detailsDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, shallowRef } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import api from '@/api';
import axios from '@/utils/request';
import InboundOrderCreate from './InboundOrderCreate.vue';


// import { ref, reactive } from 'vue';

// 查看详情相关
const detailsDialogVisible = ref(false);
const detailsData = ref(null);



// 重置详情模态框内容
const resetDetailsForm = () => {
  detailsData.value = null;
};


const router = useRouter();

// 表格数据
const tableData = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const selectedRows = ref([]);

// 状态映射
const statusMap = {
  pending: '待审核',
  approved: '已批准',
  rejected: '已拒绝'
};

// 筛选条件
const filter = reactive({
  orderStatus: '',
  warehouseReceiptNo: '',
  sourceDocNo: '',
  materialName: '',
  materialNo: '',
  batchNo: '',
  warehouse: '',
  warehouseType: '',
  warehouseMethod: '',
  supplier: '',
  manufacturer: '',
  warehouseDate: null,
});

// 筛选选项
const options = reactive({
  orderStatus: [],
  warehouseReceiptNos: [],
  sourceDocNos: [],
  materialNames: [],
  materialNos: [],
  batchNos: [],
  warehouses: [],
  warehouseTypes: [],
  warehouseMethods: [],
  suppliers: [],
  manufacturers: []
});

// 审核对话框
const auditDialogVisible = ref(false);
const auditForm = reactive({
  ids: [],
  status: 'approved',
  reason: ''
});

// 初始化数据
onMounted(() => {
  fetchOptions();
  fetchData();
});

// 获取筛选选项
const fetchOptions = async () => {
  try {
    const res = await api.getInboundOptions();
    Object.assign(options, res.data);
  } catch (error) {
    ElMessage.error('获取筛选选项失败');
    console.error(error);
  }
};

// 获取表格数据
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filter
    };
    
    // 处理时间范围
    if (filter.warehouseDate && filter.warehouseDate.length === 2) {
      params.startDate = filter.warehouseDate[0];
      params.endDate = filter.warehouseDate[1];
    }

    const res = await api.getInboundOrders(params);
    tableData.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {
    ElMessage.error('获取数据失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 查询方法
const search = () => {
  currentPage.value = 1;
  fetchData();
};

const resetFilter = () => {
  Object.keys(filter).forEach(key => {
    if (key === 'warehouseDate') {
      filter[key] = null;
    } else {
      filter[key] = '';
    }
  });
};

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page;
  fetchData();
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchData();
};

// 表格行选择
const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

// 新建入库单相关
const createDialogVisible = ref(false);
const createComponent = shallowRef(InboundOrderCreate);
const createFormRef = ref(null);

// 新建入库单
const handleNew = () => {
  createDialogVisible.value = true;
};

// 新建成功处理
const handleCreateSuccess = () => {
  createDialogVisible.value = false;
  console.log('新建入库单成功');
  fetchData(); // 刷新列表数据

};

// 重置新建表单
const resetCreateForm = () => {
  if (createFormRef.value) {
    createFormRef.value.resetForm();
  }
};


// 导入导出
const handleImportExport = async () => {
  try {
    // 导出逻辑
    const params = { ...filter };
    if (filter.warehouseDate && filter.warehouseDate.length === 2) {
      params.startDate = filter.warehouseDate[0];
      params.endDate = filter.warehouseDate[1];
    }

    const res = await api.exportInboundOrders(params);

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `入库单_${new Date().toLocaleDateString()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    ElMessage.error('导出失败');
    console.error(error);
  }
};

// 审核操作
const handleAudit = (row) => {
  if (row) {
    // 单条审核
    if (row.status !== 'pending') {
      ElMessage.warning('只能审核待审核状态的入库单');
      return;
    }
    auditForm.ids = [row.id];
  } else {
    // 批量审核
    const pendingRows = selectedRows.value.filter(item => item.status === 'pending');
    if (!pendingRows.length) {
      ElMessage.warning('请选择待审核状态的入库单');
      return;
    }
    auditForm.ids = pendingRows.map(item => item.id);
  }
  auditForm.status = 'approved';
  auditForm.reason = '';
  auditDialogVisible.value = true;
};

// 确认审核
const confirmAudit = async () => {
  try {
    await api.auditInboundOrders(auditForm);
    ElMessage.success('审核成功');
    auditDialogVisible.value = false;
    fetchData();
  } catch (error) {
    ElMessage.error('审核失败');
    console.error(error);
  }
};

// 撤销操作
const handleRevoke = async (row) => {
  try {
    await ElMessageBox.confirm('确定要撤销该入库单吗？', '提示', {
      type: 'warning'
    });
    
    await api.revokeInboundOrders({
      ids: [row.id]
    });
    
    ElMessage.success('撤销成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('撤销失败');
      console.error(error);
    }
  }
};

// 打印操作
const handlePrint = async (row) => {
  const ids = row ? [row.id] : selectedRows.value.map(item => item.id);
  if (!ids.length) {
    ElMessage.warning('请选择要打印的入库单');
    return;
  }

  try {
    const res = await api.getInboundOrderPrint(ids[0]);
    console.log('打印数据:', res.data);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>入库单打印</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: center; }
              h2 { text-align: center; margin-bottom: 20px; }
              .header-info { display: flex; justify-content: space-between; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <h2>入库单单</h2>
            <div class="header-info">
              <span><strong>单号：</strong>${res.data.warehouseReceiptNo || ''}</span>
              <span><strong>入库日期：</strong>${res.data.warehouseDate || ''}</span>
            </div>
            <div class="header-info">
              <span><strong>往来单位：</strong>${res.data.supplierName || ''}</span>
              <span><strong>生产商：</strong>${res.data.manufacturerName || ''}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>商品名称</th>
                  <th>商品编号</th>
                  <th>实收数量</th>
                  <th>实收毛重</th>
                  <th>实收净重</th>
                  <th>仓库</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${res.data.materialName || ''}</td>
                  <td>${res.data.materialNo || ''}</td>
                  <td>${res.data.receivedQuantity || ''}</td>
                  <td>${res.data.receivedGrossWeight || ''}</td>
                  <td>${res.data.receivedNetWeight || ''}</td>
                  <td>${res.data.warehouse || ''}</td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      // 等待样式加载后打印
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 200);
    }
  } catch (error) {
    ElMessage.error('获取打印数据失败');
    console.error(error);
  }
};

// // 查看详情
// const handleDetails = (row) => {
//   router.push({ name: 'InboundOrderDetail', params: { id: row.id } });
// };

const handleDetails = async (row) => {
  try {
    const res = await api.getInboundOrderDetail(row.id);
    detailsData.value = res.data;
    detailsDialogVisible.value = true;
  } catch (error) {
    console.error('获取入库单详情失败:', error);
    ElMessage.error('获取入库单详情失败');
  }
};


// 状态标签类型
const getStatusTagType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  };
  return types[status] || '';
};

const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
};
</script>

<style scoped lang="scss">
.erp-container {
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  background-color: #f0f2f5;
  padding: 16px;
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
}

.filter-col label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
}

.filter-col .el-select {
  width: 100%;
  .el-input__inner {
    height: 40px;
    border-radius: 4px;
    border-color: #e4e7ed;
    transition: all 0.3s;
    &:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }
}

.filter-col .el-date-editor {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
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
}

.data-container .el-table {
  th {
    background-color: #f8f9fc;
    color: #333;
    font-weight: 600;
    padding: 12px 0;
    border-bottom: 2px solid #e4e7ed;
    .cell {
      font-size: 14px;
    }
  }
  td {
    padding: 12px 0;
    color: #444;
    .cell {
      font-size: 14px;
    }
  }
  tr:hover {
    background-color: #f5f7fa;
  }
  .even-row {
    background-color: #fafafa;
  }
  .odd-row {
    background-color: #ffffff;
  }
}

.data-container .pagination {
  padding: 16px 24px;
  text-align: right;
  background: white;
  border-top: 1px solid #e4e7ed;
}

.data-container .action-link {
  font-size: 14px;
  padding: 6px 12px;
  margin: 0 4px;
  border-radius: 4px;
  transition: all 0.3s;
  &:hover {
    opacity: 0.85;
  }
}
</style>