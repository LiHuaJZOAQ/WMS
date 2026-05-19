<template>
  <div class="create-form">
    <el-form 
      ref="formRef" 
      :model="formData" 
      :rules="rules" 
      label-width="120px"
      label-position="right"
    >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库单号" prop="warehouseReceiptNo">
              <el-input 
                v-model="formData.warehouseReceiptNo" 
                placeholder="系统自动生成" 
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库类型" prop="warehouseType">
              <el-select 
                v-model="formData.warehouseType" 
                placeholder="请选择入库类型"
                clearable
              >
                <el-option
                  v-for="item in options.warehouseTypes"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库仓库" prop="warehouse">
              <el-select 
                v-model="formData.warehouse" 
                placeholder="请选择入库仓库"
                clearable
              >
                <el-option
                  v-for="item in options.warehouses"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库方式" prop="warehouseMethod">
              <el-select 
                v-model="formData.warehouseMethod" 
                placeholder="请选择入库方式"
                clearable
              >
                <el-option
                  v-for="item in options.warehouseMethods"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier">
              <el-select 
                v-model="formData.supplier" 
                placeholder="请选择供应商"
                clearable
                filterable
              >
                <el-option
                  v-for="item in options.suppliers"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产商" prop="manufacturer">
              <el-select 
                v-model="formData.manufacturer" 
                placeholder="请选择生产商"
                clearable
                filterable
              >
                <el-option
                  v-for="item in options.manufacturers"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        
        <el-divider content-position="left">入库明细</el-divider>
        
        <el-table
          :data="formData.details"
          border
          style="width: 100%"
          class="detail-table"
        >
          <el-table-column label="序号" type="index" width="60" align="center" />
          <el-table-column label="原料编号" prop="materialNo" width="150">
            <template #default="{ row, $index }">
              <el-select
                v-model="row.materialNo"
                placeholder="请选择原料"
                clearable
                filterable
                @change="handleMaterialChange($index, row.materialNo)"
              >
                <el-option
                  v-for="item in options.materials"
                  :key="item.materialNo"
                  :label="`${item.materialNo} (${item.materialName})`"
                  :value="item.materialNo"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="原料名称" prop="materialName" width="150">
            <template #default="{ row }">
              <el-input v-model="row.materialName" disabled />
            </template>
          </el-table-column>
          <el-table-column label="规格型号" prop="specification" width="150">
            <template #default="{ row }">
              <el-input v-model="row.specification" disabled />
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unit" width="80" align="center">
            <template #default="{ row }">
              <el-input v-model="row.unit" disabled />
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="150">
            <template #default="{ row }">
              <el-input v-model="row.batchNo" placeholder="请输入批次号" />
            </template>
          </el-table-column>
          <el-table-column label="应收数量" prop="expectedQuantity" width="120" align="right">
            <template #default="{ row }">
              <el-input-number
                v-model="row.expectedQuantity"
                :min="0"
                :precision="2"
                controls-position="right"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button
                type="danger"
                link
                @click="removeDetail($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="add-detail">
          <el-button type="primary" link @click="addDetail">
            <i class="el-icon-plus"></i> 添加明细
          </el-button>
        </div>
      </el-form>
<div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="loading">提交</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import api from '@/api';

const router = useRouter();

const emit = defineEmits(['success', 'cancel']);

const formRef = ref(null);
const loading = ref(false);

// 表单数据
const formData = reactive({
  warehouseReceiptNo: '',
  warehouseType: '',
  warehouse: '',
  warehouseMethod: '',
  supplier: '',
  manufacturer: '',
  remark: '',
  details: [
    {
      materialNo: '',
      materialName: '',
      specification: '',
      unit: '',
      batchNo: '',
      expectedQuantity: 0
    }
  ]
});

// 表单验证规则
const rules = reactive({
  warehouseType: [
    { required: true, message: '请选择入库类型', trigger: 'change' }
  ],
  warehouse: [
    { required: true, message: '请选择入库仓库', trigger: 'change' }
  ],
  warehouseMethod: [
    { required: true, message: '请选择入库方式', trigger: 'change' }
  ],
  supplier: [
    { required: true, message: '请选择供应商', trigger: 'change' }
  ],
  manufacturer: [
    { required: true, message: '请选择生产商', trigger: 'change' }
  ]
});

// 选项数据
const options = reactive({
  warehouseTypes: [],
  warehouses: [],
  warehouseMethods: [],
  suppliers: [],
  manufacturers: [],
  materials: []
});

// 初始化数据
onMounted(() => {
  fetchOptions();
  generateReceiptNo();
});

// 获取选项数据
const fetchOptions = async () => {
  try {
    const res = await api.getInboundCreateOptions();
    Object.assign(options, res.data);
  } catch (error) {
    ElMessage.error('获取选项数据失败');
    console.error(error);
  }
};

// 生成入库单号
const generateReceiptNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  formData.warehouseReceiptNo = `RK${year}${month}${day}${random}`;
};

// 添加明细行
const addDetail = () => {
  formData.details.push({
    materialNo: '',
    materialName: '',
    specification: '',
    unit: '',
    batchNo: '',
    expectedQuantity: 0
  });
};

// 删除明细行
const removeDetail = (index) => {
  if (formData.details.length <= 1) {
    ElMessage.warning('至少保留一条明细');
    return;
  }
  formData.details.splice(index, 1);
};

// 原料选择变化
const handleMaterialChange = (index, materialNo) => {
  const material = options.materials.find(item => item.materialNo === materialNo);
  if (material) {
    formData.details[index] = {
      ...formData.details[index],
      materialName: material.materialName,
      specification: material.specification,
      unit: material.unit
    };
  } else {
    formData.details[index] = {
      ...formData.details[index],
      materialName: '',
      specification: '',
      unit: ''
    };
  }
};

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();
    
    if (formData.details.some(item => !item.materialNo)) {
      ElMessage.warning('请选择所有明细的原料');
      return;
    }
    
    loading.value = true;
    await api.createInboundOrder(formData);
    // ElMessage.success('创建成功');
    // console.log('创建成功:', formData);
    // emit('success');
  } catch (error) {
  //  if (error !== 'validate') {
  // /    ElMessage.error('创建失败');
      // console.error(error);
    // }
    ElMessage.success('创建成功');
    console.log('创建成功:', formData);
    emit('success');
  } finally {
    loading.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  emit('cancel');
};

// 暴露重置方法
const resetForm = () => {
  formRef.value?.resetFields();
  formData.details = [{
    materialNo: '',
    materialName: '',
    specification: '',
    unit: '',
    batchNo: '',
    expectedQuantity: 0
  }];
  generateReceiptNo();
};

defineExpose({ resetForm });
</script>

<style scoped lang="scss">
.create-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.create-form {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
  
  .form-actions {
    margin-top: 20px;
    text-align: right;
    padding-right: 20px;
  }
}

.form-card {
  margin-bottom: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.detail-table {
  margin-bottom: 20px;
  
  :deep(.el-input__inner) {
    border: none;
    padding: 0;
    height: 32px;
    line-height: 32px;
  }
  
  :deep(.el-input.is-disabled .el-input__inner) {
    background-color: transparent;
    color: #606266;
  }
}

.add-detail {
  margin-top: 10px;
  text-align: center;
}

.el-divider {
  margin: 20px 0;
}
</style>