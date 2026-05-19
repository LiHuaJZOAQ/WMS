<template>
  <div class="system-container">
    <div class="filter-card">
      <el-form :inline="true" :model="filter" class="filter-form">
        <el-form-item label="操作人">
          <el-input v-model="filter.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filter.operationType" placeholder="全部" clearable>
            <el-option label="登录" value="Login" />
            <el-option label="登出" value="Logout" />
            <el-option label="创建" value="Create" />
            <el-option label="更新" value="Update" />
            <el-option label="删除" value="Delete" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块">
          <el-input v-model="filter.moduleName" placeholder="例如: User" clearable />
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="data-container">
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="日志ID" width="80" />
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.operationType)">
              {{ typeMap[row.operationType] || row.operationType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="moduleName" label="模块名称" width="120" />
        <el-table-column prop="functionName" label="功能描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="method" label="请求方式" width="90" />
        <el-table-column prop="url" label="请求路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="operationTime" label="操作时间" width="180" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
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
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/api';

const filter = reactive({
  username: '',
  operationType: '',
  moduleName: '',
  startDate: '',
  endDate: ''
});

const dateRange = ref([]);

const tableData = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const typeMap = {
  Login: '登录',
  Logout: '登出',
  Create: '创建',
  Update: '更新',
  Delete: '删除',
  Query: '查询'
};

const getTypeTag = (type) => {
  const map = {
    Login: 'info',
    Logout: 'info',
    Create: 'success',
    Update: 'warning',
    Delete: 'danger',
    Query: ''
  };
  return map[type] || '';
};

const handleDateChange = (val) => {
  if (val) {
    filter.startDate = val[0] + ' 00:00:00';
    filter.endDate = val[1] + ' 23:59:59';
  } else {
    filter.startDate = '';
    filter.endDate = '';
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.getOperationLogs({ page: currentPage.value, pageSize: pageSize.value, ...filter });
    tableData.value = res.data?.items || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    ElMessage.error('获取日志失败');
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  Object.keys(filter).forEach(k => filter[k] = '');
  dateRange.value = [];
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.system-container { padding: 16px; background: #f0f2f5; min-height: 100vh; }
.filter-card, .data-container { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 16px; }
.pagination-container { display: flex; justify-content: flex-end; padding-top: 16px; }
</style>
