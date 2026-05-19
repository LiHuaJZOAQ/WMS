<template>
  <div class="system-container">
    <div class="filter-card">
      <el-form :inline="true" :model="filter" class="filter-form">
        <el-form-item label="关键字">
          <el-input v-model="filter.keyword" placeholder="用户名/姓名/邮箱" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable>
            <el-option label="激活" :value="1" />
            <el-option label="停用" :value="0" />
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
        <i class="el-icon-plus"></i> 新增用户
      </el-button>
    </div>

    <div class="data-container">
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="fullName" label="姓名" width="120" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column label="角色" min-width="150">
          <template #default="{ row }">
            <el-tag v-for="role in row.roles" :key="role.roleId" size="small" style="margin-right: 5px;">
              {{ role.roleName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive === 1 ? 'success' : 'danger'">
              {{ row.isActive === 1 ? '激活' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)" :disabled="row.id === 1">删除</el-button>
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

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="formData.username" :disabled="!!formData.id" placeholder="登录账号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码" prop="password" v-if="!formData.id">
              <el-input v-model="formData.password" type="password" show-password placeholder="初始密码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="fullName">
              <el-input v-model="formData.fullName" placeholder="真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="formData.phone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="formData.email" placeholder="电子邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门">
              <el-input v-model="formData.department" placeholder="所属部门" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位">
              <el-input v-model="formData.position" placeholder="职务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="formData.isActive" :active-value="1" :inactive-value="0" active-text="激活" inactive-text="停用" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="分配角色">
              <el-select v-model="formData.roleIds" multiple placeholder="请选择角色" style="width: 100%">
                <el-option v-for="role in rolesOptions" :key="role.id" :label="role.name" :value="role.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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

const filter = reactive({ keyword: '', status: '' });
const tableData = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const dialogVisible = ref(false);
const dialogTitle = ref('新增用户');
const formRef = ref(null);
const rolesOptions = ref([]);

const formData = reactive({
  id: null,
  username: '',
  password: '',
  fullName: '',
  phone: '',
  email: '',
  department: '',
  position: '',
  isActive: 1,
  roleIds: []
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }],
  fullName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }]
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.getUsers({ page: currentPage.value, pageSize: pageSize.value, ...filter });
    tableData.value = res.data?.items || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchRoles = async () => {
  try {
    const res = await api.getRoles();
    rolesOptions.value = res.data?.items || [];
  } catch (error) {
    console.error('获取角色选项失败', error);
  }
};

const resetFilter = () => {
  filter.keyword = ''; filter.status = '';
  fetchData();
};

const handleAdd = () => {
  dialogTitle.value = '新增用户';
  Object.keys(formData).forEach(k => formData[k] = (k === 'roleIds') ? [] : '');
  formData.id = null;
  formData.isActive = 1;
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑用户';
  Object.keys(formData).forEach(k => formData[k] = row[k]);
  formData.id = row.id;
  formData.roleIds = row.roleIds || [];
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.id) {
          await api.updateUser(formData.id, formData);
          ElMessage.success('更新成功');
        } else {
          await api.createUser(formData);
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
    await ElMessageBox.confirm(`确定要删除用户 ${row.username} 吗？`, '危险操作', { type: 'error' });
    await api.deleteUser(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '删除失败');
  }
};

onMounted(() => {
  fetchData();
  fetchRoles();
});
</script>

<style scoped>
.system-container { padding: 16px; background: #f0f2f5; min-height: 100vh; }
.filter-card, .action-card, .data-container { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 16px; }
.pagination-container { display: flex; justify-content: flex-end; padding-top: 16px; }
</style>
