<template>
  <div class="erp-container">
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-col">
          <label>盘点单号：</label>
          <el-input v-model="filter.stocktakingNo" placeholder="请输入单号" clearable />
        </div>
        <div class="filter-col">
          <label>状态：</label>
          <el-select v-model="filter.status" placeholder="请选择" clearable>
            <el-option label="草稿" value="Draft"></el-option>
            <el-option label="盘点中" value="Processing"></el-option>
            <el-option label="待审核" value="Pending"></el-option>
            <el-option label="已完成" value="Completed"></el-option>
            <el-option label="已取消" value="Cancelled"></el-option>
          </el-select>
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="fetchData"><i class="el-icon-search"></i> 查询</el-button>
        <el-button @click="resetFilter"><i class="el-icon-refresh"></i> 重置</el-button>
      </div>
    </div>

    <div class="action-card">
      <el-button class="action-btn" type="success" @click="handleCreate">
        <i class="el-icon-plus"></i> 新建盘点
      </el-button>
    </div>

    <div class="data-container">
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="stocktakingNo" label="盘点单号" width="160" />
        <el-table-column prop="type" label="盘点类型" width="120">
          <template #default="{ row }">
            {{ row.type === 'Full' ? '全盘' : '抽盘' }}
          </template>
        </el-table-column>
        <el-table-column prop="warehouseName" label="仓库" min-width="120" />
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="stocktakingDate" label="盘点时间" width="180" />
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
              :disabled="row.status !== 'Pending' && row.status !== 'Processing'"
            >审核</el-button>
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
    <el-dialog title="盘点单详情" v-model="detailsDialogVisible" width="70%">
      <div v-if="detailsData" class="details-content">
        <el-descriptions title="基础信息" :column="2" border>
          <el-descriptions-item label="盘点单号">{{ detailsData.stocktakingNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(detailsData.status)">
              {{ statusMap[detailsData.status] || detailsData.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="类型">{{ detailsData.type === 'Full' ? '全盘' : '抽盘' }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ detailsData.warehouseName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="盘点时间">{{ detailsData.stocktakingDate }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detailsData.remarks || '无' }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px;">盘点明细</h4>
        <el-table :data="detailsData.details" border stripe style="width: 100%; margin-top: 10px;">
          <el-table-column prop="itemName" label="商品名称" />
          <el-table-column prop="itemCode" label="商品编号" />
          <el-table-column prop="locationCode" label="库位" />
          <el-table-column prop="systemQuantity" label="系统库存" align="right" />
          <el-table-column prop="actualQuantity" label="实际库存" align="right" />
          <el-table-column prop="difference" label="差异数" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.difference > 0 ? 'green' : (row.difference < 0 ? 'red' : 'black') }">
                {{ row.difference > 0 ? '+' : '' }}{{ row.difference }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailsDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog title="盘点审核" v-model="auditDialogVisible" width="30%">
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="审核操作" required>
          <el-radio-group v-model="auditForm.action">
            <el-radio label="approve">通过并更新库存</el-radio>
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
import api from '@/api';

const filter = reactive({
  stocktakingNo: '',
  status: ''
});

const tableData = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const detailsDialogVisible = ref(false);
const detailsData = ref(null);

const auditDialogVisible = ref(false);
const auditForm = reactive({ id: null, action: 'approve', reason: '' });

const statusMap = {
  Draft: '草稿',
  Processing: '盘点中',
  Pending: '待审核',
  Completed: '已完成',
  Cancelled: '已取消',
  Rejected: '已驳回'
};

const getStatusTagType = (status) => {
  const types = {
    Draft: 'info',
    Processing: 'primary',
    Pending: 'warning',
    Completed: 'success',
    Cancelled: 'info',
    Rejected: 'danger'
  };
  return types[status] || '';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      itemType: 'RawMaterial', // 仅查询包含盘点作业的记录
      ...filter
    };
    const res = await api.getStocktakings(params);
    tableData.value = res.data?.items || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  filter.stocktakingNo = '';
  filter.status = '';
  fetchData();
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
  ElMessage.warning('新建盘点作业功能暂未实现');
};

const handleDetails = async (row) => {
  try {
    const res = await api.getStocktakingDetail(row.id);
    detailsData.value = res.data;
    detailsDialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取详情失败');
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
    await api.auditStocktaking(auditForm.id, {
      action: auditForm.action,
      reason: auditForm.reason
    });
    ElMessage.success('审核完成');
    auditDialogVisible.value = false;
    fetchData();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '审核失败');
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除单号 \${row.stocktakingNo} 吗？`, '警告', { type: 'error' });
    await api.deleteStocktaking(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败');
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.erp-container {
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  padding: 16px;
  min-height: 100vh;
}
.filter-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}
.filter-row {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  .filter-col {
    display: flex;
    align-items: center;
    label { width: 80px; text-align: right; margin-right: 12px; }
  }
}
.filter-actions {
  display: flex;
  justify-content: flex-end;
}
.action-card {
  margin-bottom: 16px;
}
.data-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0;
}
</style>
