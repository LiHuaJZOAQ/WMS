<template>
  <div class="dashboard-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="status-item" v-for="(item, index) in statusItems" :key="index" :class="item.type">
        <div class="value">{{ item.value }}</div>
        <div class="label">{{ item.label }}</div>
        <div class="icon">{{ item.icon }}</div>
      </div>
    </div>

    <!-- 入库/出库切换 -->
    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'inbound' }" @click="activeTab = 'inbound'">
        入库管理
      </div>
      <div class="tab" :class="{ active: activeTab === 'outbound' }" @click="activeTab = 'outbound'">
        出库管理
      </div>
      <div class="tab" :class="{ active: activeTab === 'inventory' }" @click="activeTab = 'inventory'">
        库存监控
      </div>
    </div>

    <!-- 主要数据卡片 -->
    <div class="cards">
      <div class="card" v-for="(card, index) in currentCards" :key="index" :class="card.status">
        <div class="card-header">
          <div class="card-value">
            {{ card.value }}
            <span v-if="card.trend" class="trend" :class="card.trend">
              {{ card.trend === 'up' ? '↗' : '↓' }}
            </span>
          </div>
          <div class="card-percentage" v-if="card.percentage">{{ card.percentage }}</div>
        </div>
        <div class="card-label">{{ card.label }}</div>
        <div class="detail" @click="viewDetails(card.type)">查看详情 ></div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 库存预警趋势图 -->
      <div class="chart-panel large">
        <div class="panel-header">
          <h3>库存预警趋势</h3>
          <div class="chart-filters">
            <select v-model="chartTimeRange" @change="updateWarningChart">
              <option value="7">最近7天</option>
              <option value="30">最近30天</option>
              <option value="90">最近90天</option>
            </select>
          </div>
        </div>
        <div id="warningChart" style="height: 300px"></div>
      </div>

      <!-- 实时库存监控 -->
      <div class="chart-panel medium">
        <div class="panel-header">
          <h3>实时库存监控</h3>
          <div class="refresh-indicator" :class="{ active: isRefreshing }">
            <span class="refresh-dot"></span>
            实时更新
          </div>
        </div>
        <div class="inventory-monitor">
          <div class="monitor-item" v-for="item in inventoryMonitor" :key="item.id" :class="item.status">
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-location">{{ item.location }}</div>
            </div>
            <div class="item-quantity">
              <div class="current">{{ item.current }}</div>
              <div class="unit">{{ item.unit }}</div>
            </div>
            <div class="item-status">
              <div class="status-bar-mini">
                <div class="fill" :style="{ width: item.percentage + '%' }"></div>
              </div>
              <div class="percentage">{{ item.percentage }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部详细信息区域 -->
    <div class="bottom-section">
      <!-- 库位分布热力图 -->
      <div class="chart-panel">
        <div class="panel-header">
          <h3>库位分布热力图</h3>
          <div class="warehouse-selector">
            <button 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :class="{ active: selectedWarehouse === warehouse.id }"
              @click="selectedWarehouse = warehouse.id"
            >
              {{ warehouse.name }}
            </button>
          </div>
        </div>
        <div class="warehouse-heatmap">
          <div class="warehouse-layout">
            <div 
              v-for="location in warehouseLayout" 
              :key="location.id"
              class="location-cell"
              :class="[location.type, location.status]"
              :title="`${location.name} - 占用率: ${location.occupancy}%`"
            >
              <div class="location-label">{{ location.code }}</div>
              <div class="occupancy-indicator" :style="{ height: location.occupancy + '%' }"></div>
            </div>
          </div>
          <div class="heatmap-legend">
            <div class="legend-item">
              <span class="color empty"></span>
              <span>空闲</span>
            </div>
            <div class="legend-item">
              <span class="color low"></span>
              <span>低占用</span>
            </div>
            <div class="legend-item">
              <span class="color medium"></span>
              <span>中等占用</span>
            </div>
            <div class="legend-item">
              <span class="color high"></span>
              <span>高占用</span>
            </div>
            <div class="legend-item">
              <span class="color full"></span>
              <span>满载</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 预警通知面板 -->
      <div class="alert-panel">
        <div class="panel-header">
          <h3>预警通知</h3>
          <div class="alert-count">{{ alertNotifications.length }} 条预警</div>
        </div>
        <div class="alert-list">
          <div 
            v-for="alert in alertNotifications" 
            :key="alert.id"
            class="alert-item"
            :class="alert.level"
          >
            <div class="alert-icon">⚠</div>
            <div class="alert-content">
              <div class="alert-title">{{ alert.title }}</div>
              <div class="alert-description">{{ alert.description }}</div>
              <div class="alert-time">{{ alert.time }}</div>
            </div>
            <div class="alert-action">
              <button @click="handleAlert(alert.id)">处理</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预警弹窗 -->
    <div v-if="showAlertModal" class="alert-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>⚠ 库存预警</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <p>{{ currentAlert.message }}</p>
          <div class="alert-details">
            <div>物料名称: {{ currentAlert.itemName }}</div>
            <div>当前库存: {{ currentAlert.currentStock }}</div>
            <div>最小库存: {{ currentAlert.minStock }}</div>
            <div>建议补货量: {{ currentAlert.suggestedOrder }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal">关闭</button>
          <button class="primary" @click="createPurchaseOrder">生成采购订单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { ArrowUp, ArrowDown, Wallet, Box, Connection, User, Clock, Check, List, Money } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const loading = ref(true)

// ==================== 响应式数据状态 ====================

// 响应式数据
const activeTab = ref('inventory')
const chartTimeRange = ref('30')
const selectedWarehouse = ref(1)
const isRefreshing = ref(false)
const showAlertModal = ref(false)
const currentAlert = ref({})

// 顶部状态数据
const statusItems = ref([
  { value: 0, label: '订单待审核', icon: '📋', type: 'warning' },
  { value: 0, label: '订单已审核', icon: '✅', type: 'success' },
  { value: 0, label: '待出库', icon: '📦', type: 'info' },
  { value: 0, label: '库存预警', icon: '⚠', type: 'danger' },
  { value: 0, label: '波次任务', icon: '🔄', type: 'warning' },
  { value: 0, label: '今日完成', icon: '✅', type: 'info' }
])

// 卡片数据
const inboundCards = ref([
  { value: 0, label: '待处理入库', trend: 'down', percentage: '0', type: 'pending', status: 'normal' },
  { value: 0, label: '今日入库单', trend: 'up', percentage: '0', type: 'inbound', status: 'good' }
])

const outboundCards = ref([
  { value: 0, label: '待处理出库', trend: 'up', percentage: '0', type: 'picking', status: 'normal' },
  { value: 0, label: '今日出库单', trend: 'up', percentage: '0', type: 'outbound', status: 'good' }
])

const inventoryCards = ref([
  { value: 0, label: '全局总库存', trend: 'up', percentage: '常规', type: 'total', status: 'good' },
  { value: 0, label: '商品SKU总数', trend: 'up', percentage: '活跃', type: 'sku', status: 'normal' }
])

// 计算当前显示的卡片
const currentCards = computed(() => {
  switch (activeTab.value) {
    case 'inbound':
      return inboundCards.value
    case 'outbound':
      return outboundCards.value
    case 'inventory':
    default:
      return inventoryCards.value
  }
})

// 实时库存监控数据（Mock或后端返回）
const inventoryMonitor = ref([])

// 仓库列表
const warehouses = ref([
  { id: 1, name: '主仓库', code: 'WH001' }
])

// 库位布局数据
const warehouseLayout = ref([])

// 预警通知数据
const alertNotifications = ref([])

// 图表相关
let warningChart = null

// ==================== API 数据拉取 ====================

const fetchDashboardData = async () => {
  try {
    loading.value = true;
    const res = await api.getDashboardSummary();
    const data = res.data;
    
    if (data) {
      // 1. 刷新状态栏
      statusItems.value[0].value = data.pending?.pendingInbounds || 0;
      statusItems.value[2].value = data.pending?.pendingOutbounds || 0;
      statusItems.value[4].value = data.pending?.pendingWaves || 0;
      statusItems.value[5].value = (data.inbound?.todayCount || 0) + (data.outbound?.todayCount || 0);

      // 2. 刷新核心卡片
      inboundCards.value[0].value = data.pending?.pendingInbounds || 0;
      inboundCards.value[1].value = data.inbound?.todayCount || 0;
      
      outboundCards.value[0].value = data.pending?.pendingOutbounds || 0;
      outboundCards.value[1].value = data.outbound?.todayCount || 0;

      const totalInv = (data.inventory || []).reduce((sum, item) => sum + Number(item.totalQuantity), 0);
      const totalSku = (data.inventory || []).reduce((sum, item) => sum + Number(item.totalItems), 0);
      inventoryCards.value[0].value = totalInv;
      inventoryCards.value[1].value = totalSku;

      // 3. 更新图表
      await nextTick();
      updateCharts(data.trendChart || [], data.categoryChart || []);
    }
  } catch (error) {
    console.error('获取仪表盘数据失败', error);
  } finally {
    loading.value = false;
  }
}

// ==================== 业务逻辑与图表 ====================

const viewDetails = (type) => {
  if (activeTab.value === 'inbound') {
    router.push({ path: '/inStorage/rawMaterial' }) // 兼容旧路由名或通用路由
  } else if (activeTab.value === 'outbound') {
    router.push({ path: '/outStorage/finishedProduct' })
  } else {
    router.push({ path: '/inventoryManage/rawMaterial' })
  }
}

const initCharts = () => {
  const chartDom = document.getElementById('warningChart')
  if (!chartDom) return
  warningChart = echarts.init(chartDom)
}

const updateCharts = (trendData, categoryData) => {
  if (!warningChart) return;
  
  // 使用从后端拉取的近7天出入库趋势作为主图表数据
  const dates = trendData.map(t => t.date);
  const inData = trendData.map(t => t.inQuantity);
  const outData = trendData.map(t => t.outQuantity);

  warningChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['入库量', '出库量'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: [{ type: 'category', data: dates.length ? dates : ['暂无数据'] }],
    yAxis: [{ type: 'value' }],
    series: [
      { name: '入库量', type: 'bar', data: inData.length ? inData : [0], itemStyle: { color: '#67C23A' } },
      { name: '出库量', type: 'bar', data: outData.length ? outData : [0], itemStyle: { color: '#F56C6C' } }
    ]
  });
}

const updateWarningChart = () => {
  // 切换时间范围时，可以扩展重新调用 API 传入日期
  fetchDashboardData();
}

const handleAlert = (alertId) => {
  // 弹窗处理
  showAlertModal.value = true
}

const closeModal = () => {
  showAlertModal.value = false
}

const createPurchaseOrder = () => {
  showAlertModal.value = false
}

const startRealTimeUpdates = () => {
  // 废除前端纯随机的假数据轮询，改为定时轮询后端 API (每30秒一次)
  setInterval(() => {
    isRefreshing.value = true;
    fetchDashboardData().then(() => {
      setTimeout(() => isRefreshing.value = false, 500);
    });
  }, 30000);
}

// 生命周期
onMounted(() => {
  initCharts()
  fetchDashboardData()
  startRealTimeUpdates()
  window.addEventListener('resize', () => warningChart?.resize())
})

onUnmounted(() => {
  warningChart?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

/* 状态栏样式 */
.status-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.status-item {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid #409eff;
}

.status-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.status-item.warning { border-left-color: #e6a23c; }
.status-item.success { border-left-color: #67c23a; }
.status-item.info { border-left-color: #909399; }
.status-item.danger { border-left-color: #f56c6c; }

.status-item .value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.status-item .label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.status-item .icon {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 20px;
  opacity: 0.3;
}

/* 标签页样式 */
.tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  background: white;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tab {
  padding: 12px 24px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #606266;
  font-weight: 500;
}

.tab:hover {
  background: #f0f9ff;
  color: #409eff;
}

.tab.active {
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

/* 卡片样式 */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #409eff;
  position: relative;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.card.warning { border-left-color: #e6a23c; }
.card.good { border-left-color: #67c23a; }
.card.normal { border-left-color: #409eff; }

.card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, transparent 30%, rgba(64, 158, 255, 0.1));
  border-radius: 0 0 0 100px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.trend {
  font-size: 20px;
  font-weight: normal;
}

.trend.up { color: #67c23a; }
.trend.down { color: #f56c6c; }

.card-percentage {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: #f0f9ff;
  color: #409eff;
  font-weight: 500;
}

.card-label {
  font-size: 16px;
  color: #606266;
  margin-bottom: 15px;
  font-weight: 500;
}

.detail {
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s ease;
}

.detail:hover {
  color: #66b1ff;
}

/* 图表容器样式 */
.charts-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.chart-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  overflow: hidden;
}

.chart-panel.large {
  grid-column: span 1;
}

.chart-panel.medium {
  grid-column: span 1;
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8f9fa, #fff);
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  font-weight: 600;
}

.chart-filters select {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: white;
  color: #606266;
  font-size: 14px;
}

.refresh-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.refresh-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
  animation: pulse 2s infinite;
}

.refresh-indicator.active .refresh-dot {
  background: #67c23a;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 库存监控样式 */
.inventory-monitor {
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}

.monitor-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f2f5;
  transition: background 0.3s ease;
  align-items: center;
}

.monitor-item:hover {
  background: #f9fafc;
}

.monitor-item:last-child {
  border-bottom: none;
}

.monitor-item.warning {
  background: linear-gradient(90deg, #fef0e6, transparent);
}

.monitor-item.critical {
  background: linear-gradient(90deg, #fef0f0, transparent);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.item-location {
  font-size: 12px;
  color: #909399;
}

.item-quantity {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-quantity .current {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.item-quantity .unit {
  font-size: 12px;
  color: #909399;
}

.item-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.status-bar-mini {
  width: 60px;
  height: 8px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
}

.status-bar-mini .fill {
  height: 100%;
  background: linear-gradient(90deg, #f56c6c, #e6a23c, #67c23a);
  transition: width 0.3s ease;
}

.percentage {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

/* 底部区域样式 */
.bottom-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

/* 仓库热力图样式 */
.warehouse-selector {
  display: flex;
  gap: 8px;
}

.warehouse-selector button {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.warehouse-selector button:hover {
  border-color: #409eff;
  color: #409eff;
}

.warehouse-selector button.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.warehouse-heatmap {
  padding: 24px;
}

.warehouse-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.location-cell {
  position: relative;
  height: 60px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.location-cell:hover {
  transform: scale(1.05);
  border-color: #409eff;
}

.location-cell.empty {
  background: #f5f7fa;
  color: #c0c4cc;
}

.location-cell.low {
  background: linear-gradient(135deg, #e1f3d8, #f0f9ff);
  color: #67c23a;
}

.location-cell.medium {
  background: linear-gradient(135deg, #fdf6ec, #f0f9ff);
  color: #e6a23c;
}

.location-cell.high {
  background: linear-gradient(135deg, #fef0f0, #f0f9ff);
  color: #f56c6c;
}

.location-cell.full {
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  color: #909399;
}

.location-label {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
}

.occupancy-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: currentColor;
  opacity: 0.3;
  border-radius: 0 0 6px 6px;
  transition: height 0.3s ease;
}

.heatmap-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.legend-item .color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-item .color.empty { background: #f5f7fa; }
.legend-item .color.low { background: #e1f3d8; }
.legend-item .color.medium { background: #fdf6ec; }
.legend-item .color.high { background: #fef0f0; }
.legend-item .color.full { background: #f0f0f0; }

/* 预警面板样式 */
.alert-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  overflow: hidden;
}

.alert-count {
  background: linear-gradient(135deg, #f56c6c, #ff7875);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.alert-list {
  max-height: 400px;
  overflow-y: auto;
}

.alert-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f2f5;
  transition: background 0.3s ease;
  align-items: center;
}

.alert-item:hover {
  background: #f9fafc;
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-item.critical {
  border-left: 4px solid #f56c6c;
}

.alert-item.warning {
  border-left: 4px solid #e6a23c;
}

.alert-item.info {
  border-left: 4px solid #409eff;
}

.alert-icon {
  font-size: 18px;
  color: #f56c6c;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.alert-description {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.alert-time {
  font-size: 11px;
  color: #c0c4cc;
}

.alert-action button {
  padding: 6px 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s ease;
}

.alert-action button:hover {
  background: #66b1ff;
}

/* 预警弹窗样式 */
.alert-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #f56c6c;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #c0c4cc;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f5f7fa;
  color: #909399;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin: 0 0 16px;
  color: #606266;
  line-height: 1.5;
}

.alert-details {
  background: #f9fafc;
  padding: 16px;
  border-radius: 8px;
  display: grid;
  gap: 8px;
}

.alert-details div {
  font-size: 14px;
  color: #303133;
}

.alert-details div:before {
  content: '• ';
  color: #409eff;
  font-weight: bold;
}

.modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-footer button {
  padding: 10px 20px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
  color: #606266;
}

.modal-footer button:hover {
  border-color: #c0c4cc;
}

.modal-footer button.primary {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.modal-footer button.primary:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .bottom-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }
  
  .status-bar {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }
  
  .cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .tabs {
    flex-direction: column;
    gap: 5px;
  }
  
  .warehouse-layout {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .heatmap-legend {
    gap: 10px;
  }
}
</style>