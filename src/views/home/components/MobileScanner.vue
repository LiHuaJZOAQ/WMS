<template>
  <div class="mobile-scanner-container">
    <div class="scanner-header">
      <h2><el-icon><Aim /></el-icon> 移动扫码工作台 (PDA)</h2>
      <el-tag type="success" effect="dark">连接正常</el-tag>
    </div>

    <el-card class="scanner-card" shadow="always">
      <div class="camera-placeholder" @click="focusInput">
        <el-icon class="camera-icon"><Camera /></el-icon>
        <p>点击此处唤起扫码枪输入焦点</p>
        <p class="sub-text">(或直接使用键盘输入条码并回车)</p>
      </div>

      <div class="input-section">
        <el-input
          ref="scanInput"
          v-model="barcode"
          placeholder="扫描或输入条码 (如: LOC-A1-01, MAT-1001)"
          clearable
          size="large"
          @keyup.enter="handleScan"
        >
          <template #prefix>
            <el-icon><Crop /></el-icon>
          </template>
          <template #append>
            <el-button type="primary" @click="handleScan">确定</el-button>
          </template>
        </el-input>
      </div>
    </el-card>

    <!-- 最近扫描记录 -->
    <el-card class="history-card" header="近期扫码记录 (本地模拟)" shadow="hover">
      <el-timeline v-if="scanHistory.length > 0">
        <el-timeline-item
          v-for="(item, index) in scanHistory"
          :key="index"
          :type="item.type"
          :timestamp="item.time"
        >
          <strong>{{ item.code }}</strong>
          <p class="history-msg">{{ item.message }}</p>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无扫描记录" :image-size="60"></el-empty>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Aim, Camera, Crop } from '@element-plus/icons-vue';
import moment from 'moment';

const scanInput = ref(null);
const barcode = ref('');
const scanHistory = ref([]);

// 聚焦输入框，模拟 PDA 扫码准备
const focusInput = () => {
  nextTick(() => {
    if (scanInput.value) {
      scanInput.value.focus();
    }
  });
};

// 模拟扫码处理逻辑
const handleScan = () => {
  const code = barcode.value.trim().toUpperCase();
  if (!code) {
    ElMessage.warning('请输入或扫描有效条码');
    return;
  }

  let type = 'info';
  let message = '';

  // 简单的条码规则解析演示
  if (code.startsWith('LOC-')) {
    type = 'success';
    message = `成功定位到库位: ${code.replace('LOC-', '')}`;
  } else if (code.startsWith('MAT-')) {
    type = 'primary';
    message = `识别到原材料: ${code.replace('MAT-', '')}`;
  } else if (code.startsWith('ORD-')) {
    type = 'warning';
    message = `读取到单据号: ${code}`;
  } else {
    type = 'danger';
    message = `未知的条码格式，请核对标签`;
  }

  // 插入历史记录 (最新在前)
  scanHistory.value.unshift({
    code,
    type,
    message,
    time: moment().format('HH:mm:ss')
  });

  // 保持记录在 10 条以内
  if (scanHistory.value.length > 10) {
    scanHistory.value.pop();
  }

  ElMessage({ message, type: type === 'danger' ? 'error' : 'success' });
  barcode.value = ''; // 清空以备下次扫码
  focusInput();
};

onMounted(() => {
  focusInput();
});
</script>

<style scoped>
.mobile-scanner-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.scanner-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.scanner-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.camera-placeholder {
  height: 150px;
  background-color: #f5f7fa;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.camera-placeholder:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.camera-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 10px;
}

.camera-placeholder p {
  margin: 5px 0;
  color: #606266;
  font-weight: bold;
}

.sub-text {
  font-size: 12px;
  color: #909399 !important;
  font-weight: normal !important;
}

.history-card {
  border-radius: 12px;
}

.history-msg {
  margin: 4px 0 0;
  color: #606266;
  font-size: 13px;
}
</style>
