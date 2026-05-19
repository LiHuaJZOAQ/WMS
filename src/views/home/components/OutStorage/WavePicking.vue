<template>
  <div class="erp-container">
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-col">
          <label>波次状态：</label>
          <el-select v-model="filter.status" placeholder="请选择状态" clearable>
            <el-option label="待拣货" value="Pending"></el-option>
            <el-option label="已完成" value="Completed"></el-option>
          </el-select>
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="fetchWaves"><i class="el-icon-search"></i> 查询</el-button>
        <el-button type="success" @click="handleRecommend"><i class="el-icon-magic-stick"></i> 智能推荐波次</el-button>
      </div>
    </div>

    <!-- 波次列表 -->
    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="WaveNo" label="波次编号" min-width="150" />
        <el-table-column prop="CreatorName" label="创建人" width="120" />
        <el-table-column prop="TotalOrders" label="包含订单数" width="100" align="center" />
        <el-table-column prop="PickedOrders" label="已拣订单" width="100" align="center" />
        <el-table-column prop="CreatedTime" label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.CreatedTime) }}</template>
        </el-table-column>
        <el-table-column prop="Status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.Status === 'Completed' ? 'success' : 'warning'">
              {{ row.Status === 'Completed' ? '已完成' : '待拣货' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.Status !== 'Completed'" type="primary" link size="small" @click="startPicking(row)">
              开始拣货
            </el-button>
            <el-button v-if="row.Status !== 'Completed'" type="success" link size="small" @click="completeWave(row)">
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchWaves"
          @current-change="fetchWaves"
        />
      </div>
    </div>

    <!-- 智能推荐弹窗 -->
    <el-dialog v-model="recommendDialogVisible" title="智能推荐波次" width="800px">
      <el-alert title="系统已根据出库单包含的物料和库位相似度自动打包了以下波次" type="info" show-icon />
      <el-table :data="recommendedWaves" style="width: 100%; margin-top: 15px" border>
        <el-table-column prop="WaveName" label="推荐波次名称" width="180" />
        <el-table-column label="包含的出库单">
          <template #default="{ row }">
            <el-tag v-for="order in row.OutboundOrders" :key="order.OutboundID" style="margin-right: 5px; margin-bottom: 5px;">
              {{ order.OutboundNo }} (库位: {{ order.LocationsCount }})
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="createWaveFromRecommend(row)">生成波次</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 拣货作业地图弹窗 -->
    <el-dialog v-model="pickingDialogVisible" title="波次拣货作业地图 (PDA 模拟视图)" width="900px">
      <el-alert title="请根据系统规划的 3D/2D 最优路径前往对应库位取货" type="success" show-icon style="margin-bottom: 15px;" />
      
      <!-- 引入刚刚编写的可视化组件 -->
      <PickPathMap :locations="pickLocations" />
      
      <el-divider>当前库位拣货任务清单</el-divider>
      
      <el-table :data="pickLocations" border stripe height="250">
        <el-table-column prop="LocationCode" label="目标库位" width="150" />
        <el-table-column prop="tasks" label="任务明细">
          <template #default="{ row }">
            <div v-for="(task, idx) in row.tasks" :key="idx">
              {{ task.ItemName }} - 需取: <b>{{ task.Quantity }}</b> (订单: {{ task.OutboundNo }})
            </div>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pickingDialogVisible = false">关闭地图</el-button>
          <el-button type="success" @click="completeWave(currentWave)">已完成本波次拣货</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import moment from 'moment';
import api from '@/api';
import PickPathMap from '../PickPathMap.vue';

const filter = reactive({ status: '' });
const tableData = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);

const recommendDialogVisible = ref(false);
const recommendedWaves = ref([]);

const pickingDialogVisible = ref(false);
const currentWave = ref(null);
const pickLocations = ref([]);

const formatTime = (time) => time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '-';

// 获取波次列表
const fetchWaves = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      status: filter.status
    };
    const res = await api.get('/api/waves', { params });
    tableData.value = res.data.data.items || [];
    total.value = res.data.data.total || 0;
  } catch (error) {
    ElMessage.error('获取波次列表失败');
  } finally {
    loading.value = false;
  }
};

// 智能推荐
const handleRecommend = async () => {
  try {
    const res = await api.post('/api/waves/recommend');
    if (res.data.code === 200 && res.data.data.length > 0) {
      recommendedWaves.value = res.data.data;
      recommendDialogVisible.value = true;
    } else {
      ElMessage.info('暂无待出库订单需要推荐');
    }
  } catch (error) {
    ElMessage.error('获取智能推荐失败');
  }
};

// 从推荐生成波次
const createWaveFromRecommend = async (row) => {
  try {
    const outboundIds = row.OutboundOrders.map(o => o.OutboundID);
    const res = await api.post('/api/waves', {
      outboundIds,
      remark: '来自系统智能推荐'
    });
    if (res.data.code === 200) {
      ElMessage.success('波次生成成功');
      recommendDialogVisible.value = false;
      fetchWaves();
    }
  } catch (error) {
    ElMessage.error('波次生成失败');
  }
};

// 开始拣货（打开 3D 路径地图）
const startPicking = async (row) => {
  currentWave.value = row;
  try {
    const res = await api.get(`/api/waves/${row.WaveID}/pick-map`);
    if (res.data.code === 200) {
      // res.data.data 返回了带有 tasks 的 location 数组
      pickLocations.value = res.data.data;
      pickingDialogVisible.value = true;
    }
  } catch (error) {
    ElMessage.error('获取拣货路径地图失败');
  }
};

// 完成波次
const completeWave = async (row) => {
  if (!row) return;
  try {
    await ElMessageBox.confirm(`确认该波次 [${row.WaveNo}] 的拣货已全部完成吗？`, '提示', { type: 'warning' });
    const res = await api.put(`/api/waves/${row.WaveID}/complete`);
    if (res.data.code === 200) {
      ElMessage.success('波次拣货已完成');
      pickingDialogVisible.value = false;
      fetchWaves();
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

onMounted(() => {
  fetchWaves();
});
</script>

<style scoped>
/* 使用现有的 ERP 样式规范 */
.filter-card {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.filter-col {
  display: flex;
  align-items: center;
}
.filter-col label {
  width: 80px;
  text-align: right;
  color: #606266;
  font-size: 14px;
}
.filter-actions {
  margin-top: 16px;
  text-align: right;
}
.table-container {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
