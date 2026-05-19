<template>
  <div class="factory-container">
    <div class="filter-card">
      <el-form :inline="true" :model="filter" class="filter-form">
        <el-form-item label="关键字">
          <el-input v-model="filter.keyword" placeholder="名称或编码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="action-card">
      <el-button type="success" @click="handleAdd">
        <i class="el-icon-plus"></i> 新增加工厂
      </el-button>
    </div>

    <div class="data-container">
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="code" label="加工厂编码" width="150" />
        <el-table-column prop="name" label="加工厂名称" min-width="200" />
        <el-table-column prop="contactPerson" label="联系人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="150" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 表单弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="编码" prop="code">
          <el-input v-model="formData.code" :disabled="!!formData.id" placeholder="请输入编码" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="formData.contactPhone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input type="textarea" v-model="formData.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api';

const filter = reactive({
  keyword: '',
  status: ''
});

const tableData = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const dialogVisible = ref(false);
const dialogTitle = ref('新增加工厂');
const formRef = ref(null);
const formData = reactive({
  id: null,
  code: '',
  name: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
  status: 1
});

const rules = {
  code: [{ required: true, message: '请输入加工厂编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入加工厂名称', trigger: 'blur' }]
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filter
    };
    const res = await api.getFactories(params);
    tableData.value = res.data?.items || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  filter.keyword = '';
  filter.status = '';
  fetchData();
};

const handleAdd = () => {
  dialogTitle.value = '新增加工厂';
  Object.keys(formData).forEach(k => formData[k] = '');
  formData.id = null;
  formData.status = 1;
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑加工厂';
  Object.keys(formData).forEach(k => formData[k] = row[k]);
  formData.id = row.id;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.id) {
          await api.updateFactory(formData.id, formData);
          ElMessage.success('更新成功');
        } else {
          await api.createFactory(formData);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        fetchData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '保存失败');
      }
    }
  });
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该加工厂吗？', '提示', { type: 'warning' });
    await api.deleteFactory(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.factory-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100vh;
}
.filter-card, .action-card, .data-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}
</style>
