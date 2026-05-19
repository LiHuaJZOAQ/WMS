<template>
  <div class="system-container">
    <div class="action-card">
      <el-button type="success" @click="handleAdd">
        <i class="el-icon-plus"></i> 新增角色
      </el-button>
    </div>

    <div class="data-container">
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="description" label="角色描述" min-width="200" />
        <el-table-column label="角色类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isSystem === 1 ? 'danger' : 'info'">
              {{ row.isSystem === 1 ? '系统内置' : '自定义' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)" :disabled="row.isSystem === 1">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)" :disabled="row.isSystem === 1">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 角色表单弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" placeholder="例如: 仓库管理员" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="formData.description" placeholder="角色职责描述" />
        </el-form-item>
        
        <el-form-item label="菜单权限">
          <div class="tree-container">
            <el-tree
              ref="treeRef"
              :data="permissionsTree"
              show-checkbox
              node-key="id"
              :props="defaultProps"
              :default-checked-keys="formData.permissionIds"
            />
          </div>
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api';

const tableData = ref([]);
const loading = ref(false);
const permissionsTree = ref([]);

const dialogVisible = ref(false);
const dialogTitle = ref('新增角色');
const formRef = ref(null);
const treeRef = ref(null);

const formData = reactive({
  id: null,
  name: '',
  description: '',
  permissionIds: []
});

const defaultProps = {
  children: 'children',
  label: 'name'
};

const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.getRoles();
    tableData.value = res.data?.items || [];
  } catch (error) {
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchPermissions = async () => {
  try {
    const res = await api.getPermissions();
    permissionsTree.value = res.data?.items || [];
  } catch (error) {
    console.error('获取权限树失败', error);
  }
};

const handleAdd = () => {
  dialogTitle.value = '新增角色';
  formData.id = null;
  formData.name = '';
  formData.description = '';
  formData.permissionIds = [];
  dialogVisible.value = true;
  nextTick(() => {
    if (treeRef.value) treeRef.value.setCheckedKeys([]);
  });
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑角色';
  formData.id = row.id;
  formData.name = row.name;
  formData.description = row.description || '';
  formData.permissionIds = row.permissionIds || [];
  dialogVisible.value = true;
  nextTick(() => {
    if (treeRef.value) treeRef.value.setCheckedKeys(formData.permissionIds);
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 获取树形组件中勾选的节点
        if (treeRef.value) {
          const checkedKeys = treeRef.value.getCheckedKeys();
          const halfCheckedKeys = treeRef.value.getHalfCheckedKeys();
          formData.permissionIds = [...checkedKeys, ...halfCheckedKeys];
        }

        if (formData.id) {
          await api.updateRole(formData.id, formData);
          ElMessage.success('更新成功');
        } else {
          await api.createRole(formData);
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
    await ElMessageBox.confirm(`确定要删除角色 ${row.name} 吗？`, '危险操作', { type: 'error' });
    await api.deleteRole(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '删除失败');
  }
};

onMounted(() => {
  fetchData();
  fetchPermissions();
});
</script>

<style scoped>
.system-container { padding: 16px; background: #f0f2f5; min-height: 100vh; }
.action-card, .data-container { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 16px; }
.tree-container {
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}
</style>
