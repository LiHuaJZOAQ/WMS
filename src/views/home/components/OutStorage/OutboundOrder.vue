
<template>
  <div class="erp-container">
    <!-- 查询条件区域 -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-col">
          <label>出库单号：</label>
          <el-input v-model="filter.outboundNo" placeholder="请输入单号" clearable />
        </div>
        <div class="filter-col">
          <label>状态：</label>
          <el-select v-model="filter.status" placeholder="请选择" clearable>
            <el-option label="草稿" value="Draft"></el-option>
            <el-option label="待处理" value="Pending"></el-option>
            <el-option label="已完成" value="Completed"></el-option>
            <el-option label="已取消" value="Cancelled"></el-option>
          </el-select>
        </div>
        <div class="filter-col">
          <label>出库日期(起)：</label>
          <el-date-picker v-model="filter.startDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" clearable />
        </div>
        <div class="filter-col">
          <label>出库日期(止)：</label>
          <el-date-picker v-model="filter.endDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" clearable />
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="fetchData"><i class="el-icon-search"></i> 查询</el-button>
        <el-button @click="resetFilter"><i class="el-icon-refresh"></i> 重置</el-button>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-card">
      <el-button class="action-btn" type="success" @click="handleCreate">
        <i class="el-icon-plus"></i> 新建
      </el-button>
      <el-button class="action-btn" type="primary" @click="handlePrint">
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
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="outboundNo" label="出库单号" width="160" />
        <el-table-column prop="type" label="出库类型" width="120">
          <template #default="{ row }">
            {{ getTypeText(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="departmentName" label="往来单位" min-width="120" />
        <el-table-column prop="warehouseName" label="仓库" min-width="120" />
        <el-table-column prop="totalQuantity" label="总数量" width="120" align="right" />
        <el-table-column prop="totalAmount" label="总金额" width="120" align="right" />
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="outboundDate" label="出库时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetails(row)">详情</el-button>
            <el-button
              link
              type="success"
              @click="handleAudit(row)"
              :disabled="row.status !== 'Pending'"
            >审核</el-button>
            <el-button
              link
              type="warning"
              @click="handleRevoke(row)"
              :disabled="row.status === 'Completed' || row.status === 'Cancelled'"
            >撤销</el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(row)"
              :disabled="row.status === 'Completed'"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog title="出库单详情" v-model="detailsDialogVisible" width="60%">
      <div v-if="detailsData" class="details-content">
        <el-descriptions title="基础信息" :column="2" border>
          <el-descriptions-item label="出库单号">{{ detailsData.outboundNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(detailsData.status)">
              {{ statusMap[detailsData.status] || detailsData.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="出库类型">{{ getTypeText(detailsData.type) }}</el-descriptions-item>
          <el-descriptions-item label="往来单位">{{ detailsData.departmentName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ detailsData.warehouseName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ detailsData.operatorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="出库时间">{{ detailsData.outboundDate }}</el-descriptions-item>
          <el-descriptions-item label="总金额">{{ detailsData.totalAmount }} 元</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detailsData.remarks || '无' }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px;">出库明细</h4>
        <el-table :data="detailsData.details" border stripe style="width: 100%; margin-top: 10px;">
          <el-table-column prop="materialName" label="商品名称" />
          <el-table-column prop="materialCode" label="商品编号" />
          <el-table-column prop="specification" label="规格" />
          <el-table-column prop="quantity" label="出库数量" align="right" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="locationCode" label="库位" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailsDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog title="出库审核" v-model="auditDialogVisible" width="30%">
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="审核操作" required>
          <el-radio-group v-model="auditForm.action">
            <el-radio label="approve">通过并出库</el-radio>
            <el-radio label="reject">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input type="textarea" v-model="auditForm.reason" placeholder="请输入审核意见（驳回必填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAudit">确定</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import api from '@/api';

const router = useRouter();

const filter = reactive({
  outboundNo: '',
  status: '',
  startDate: '',
  endDate: ''
});

const tableData = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const selectedRows = ref([]);

const detailsDialogVisible = ref(false);
const detailsData = ref(null);

const auditDialogVisible = ref(false);
const auditForm = reactive({ id: null, action: 'approve', reason: '' });

const statusMap = {
  Draft: '草稿',
  Pending: '待处理',
  Completed: '已完成',
  Cancelled: '已取消',
  Rejected: '已驳回'
};

const getStatusTagType = (status) => {
  const types = {
    Draft: 'info',
    Pending: 'warning',
    Completed: 'success',
    Cancelled: 'info',
    Rejected: 'danger'
  };
  return types[status] || '';
};

const getTypeText = (type) => {
  const map = {
    Production: '生产领料',
    Transfer: '调拨',
    Return: '退货',
    Other: '其他'
  };
  return map[type] || type;
};

const tableRowClassName = ({ rowIndex }) => rowIndex % 2 === 0 ? 'even-row' : 'odd-row';

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filter
    };
    const res = await api.getOutboundOrders(params);
    tableData.value = res.data?.items || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    console.error(error);
    ElMessage.error('获取出库单列表失败');
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  Object.keys(filter).forEach(key => filter[key] = '');
  fetchData();
};

const handleSelectionChange = (val) => {
  selectedRows.value = val;
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchData();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchData();
};

const handleCreate = () => {
  ElMessage.warning('新建出库单页面暂未实现');
};

const handleDetails = async (row) => {
  try {
    const res = await api.getOutboundOrderDetail(row.id);
    detailsData.value = res.data;
    detailsDialogVisible.value = true;
  } catch (error) {
    console.error(error);
    ElMessage.error('获取出库单详情失败');
  }
};

const handleAudit = (row) => {
  auditForm.id = row.id;
  auditForm.action = 'approve';
  auditForm.reason = '';
  auditDialogVisible.value = true;
};

const confirmAudit = async () => {
  if (auditForm.action === 'reject' && !auditForm.reason) {
    return ElMessage.warning('驳回时必须填写审核意见');
  }
  try {
    await api.auditOutboundOrder(auditForm.id, {
      action: auditForm.action,
      reason: auditForm.reason
    });
    ElMessage.success('审核完成');
    auditDialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error(error);
    ElMessage.error(error.response?.data?.message || '审核失败');
  }
};

const handleRevoke = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要撤销出库单 ${row.outboundNo} 吗？`, '提示', { type: 'warning' });
    await api.revokeOutboundOrder(row.id);
    ElMessage.success('撤销成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
      ElMessage.error('撤销失败');
    }
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除出库单 ${row.outboundNo} 吗？此操作不可恢复。`, '危险操作', { type: 'error' });
    await api.deleteOutboundOrder(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
      ElMessage.error('删除失败');
    }
  }
};

const handlePrint = () => {
  ElMessage.info('打印功能暂未实现');
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.erp-container {
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  background-color: #f0f2f5;
  padding: 16px;
  min-height: 100vh;
}

.filter-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 16px;

    .filter-col {
      display: flex;
      align-items: center;

      label {
        width: 100px;
        text-align: right;
        color: #606266;
        font-weight: 500;
        margin-right: 12px;
      }
      .el-select, .el-input, .el-date-picker {
        width: 200px;
      }
    }
  }

  .filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.action-card {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.data-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-grow: 1;

  ::v-deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
    
    th.el-table__cell {
      background-color: #fafafa;
      color: #333;
      font-weight: 600;
    }
    
    .even-row { background-color: #fafafa; }
    .odd-row { background-color: #ffffff; }
    .even-row:hover, .odd-row:hover { background-color: #e6f7ff; }
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0;
}

.details-content {
  padding: 0 20px;
}
</style>
