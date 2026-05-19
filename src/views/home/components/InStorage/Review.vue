<template>
  <div class="procurement-system" style="width: 100%; height: 100%;">
    <!-- 头部操作栏 -->
    <div class="header">
      <el-button type="default" @click="goBack">返回上一级</el-button>
      <div class="right-buttons">
        <el-button type="success" @click="approve">同意</el-button>
        <el-button type="warning" @click="disagree">不同意</el-button>
        <el-button type="danger" @click="cancel">撤销</el-button>
        <el-button type="info" @click="discard">作废</el-button>
        <el-button type="primary" @click="qualityInspection">质检</el-button>
        <el-button type="primary" @click="print">打印</el-button>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 基本信息 -->
      <div class="basic-info">
        <el-row :gutter="10">
          <el-col :span="8">
            <div class="info-item"><strong>单号：</strong>{{ orderInfo.orderNo }}</div>
            <div class="info-item"><strong>创建人：</strong>{{ orderInfo.creator }}</div>
            <div class="info-item"><strong>来源单号：</strong>{{ orderInfo.sourceNo }}</div>
            <div class="info-item"><strong>创建时间：</strong>{{ orderInfo.createTime }}</div>
          </el-col>
          <el-col :span="8">
            <div class="info-item"><strong>入库仓库：</strong>{{ orderInfo.warehouse }}</div>
            <div class="info-item"><strong>入库类型：</strong>{{ orderInfo.type }}</div>
            <div class="info-item"><strong>入库方式：</strong>{{ orderInfo.mode }}</div>
            <div class="info-item"><strong>状态：</strong><span class="status-tag">{{ orderInfo.status }}</span></div>
          </el-col>
          <el-col :span="8">
            <div class="timeline">
              <div class="timeline-item" v-for="(step, index) in processSteps" :key="index">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div>{{ step.phase }}</div>
                  <div class="user">{{ step.user }}</div>
                  <div :class="step.statusClass">{{ step.status }}</div>
                  <div>{{ step.time }}</div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 商品信息表格 -->
      <div class="goods-table">
        <el-table :data="goodsData" border style="width: 100%;">
          <el-table-column prop="index" label="序号" width="60"></el-table-column>
          <el-table-column prop="materialNo" label="原料编号"></el-table-column>
          <el-table-column prop="materialName" label="原料名称"></el-table-column>
          <el-table-column prop="specification" label="规格型号"></el-table-column>
          <el-table-column prop="unit" label="单位"></el-table-column>
          <el-table-column prop="batchNo" label="批次号"></el-table-column>
          <el-table-column prop="receivableQty" label="应收数量"></el-table-column>
          <el-table-column prop="receivableWeight" label="应收净重"></el-table-column>
          <el-table-column prop="receivedQty" label="实收数量"></el-table-column>
          <el-table-column prop="receivedGrossWeight" label="实收毛重"></el-table-column>
          <el-table-column prop="receivedNetWeight" label="实收净重"></el-table-column>
          <el-table-column prop="remark" label="备注"></el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {useCounterStore} from '@/stores/counter'
import { useRoute, useRouter } from 'vue-router'

const counter = useCounterStore()
// 订单信息数据
const orderInfo = reactive({
  orderNo: '484511345434154',
  creator: '刘会给',
  sourceNo: '484511345434154',
  createTime: '2022-08-01',
  warehouse: 'A仓库',
  type: '采购入库',
  mode: '虚拟入库',
  status: '待审批'
})

// 流程进度数据
const processSteps = ref([
  { phase: '创建单据', user: '王佳楠', time: '2022-08-01', status: '', statusClass: '' },
  { phase: '部门初审', user: '张雅甫', time: '2022-08-02', status: '已审核', statusClass: 'approved' },
  { phase: '财务复审', user: '邓复', time: '2022-08-02', status: '未审核', statusClass: 'pending' },
  { phase: '完成', user: '', time: '', status: '', statusClass: 'approved' }
])

// 商品数据
const goodsData = ref([
  {
    index: 1,
    materialNo: '123456',
    materialName: '名称名称',
    specification: '10 * 10',
    unit: 'M2',
    batchNo: '202215415',
    receivableQty: 1564,
    receivableWeight: 1564,
    receivedQty: 1564,
    receivedGrossWeight: 1564,
    receivedNetWeight: 1564,
    remark: ''
  },
  // 其他商品数据...
])

// 操作方法
const approve = () => {
  ElMessage.success('操作成功')
  // 实际业务逻辑
}

const disagree = () => {
  ElMessage.warning('操作成功')
}

const cancel = () => {
  ElMessage.info('操作成功')
}

const discard = () => {
  ElMessage.error('操作成功')
}

const qualityInspection = () => {
  ElMessage.info('质检功能')
}

const print = () => {
  ElMessage.info('打印功能')
}

const router = useRouter()

const goBack = () => {
  // counter.currentView = 'RawMaterial'
  // 这里可添加实际的返回逻辑，例如路由返回
  router.back()
  //router.push({ name:'InStorageRawMaterial' })
  // 或者使用 Vue Router 的导航守卫
  ElMessage.info('返回上一级')
}
</script>

<style scoped lang="scss">
.procurement-system {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: 'Microsoft YaHei';
}

.header {
  padding: 15px 20px;
  background-color: #f0f9ff;
  border-bottom: 1px solid #e6f7ff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.right-buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px; /* 添加按钮之间的间距 */
}

.main-content {
  flex: 1;
  padding: 20px;
}

.basic-info {
  padding: 20px;
  background-color: #f6faff;
  border: 1px solid #e6f7ff;
  border-radius: 8px;
  margin-bottom: 20px;

  .info-item {
    margin-bottom: 10px;
    font-size: 14px;
    color: #495057;
  }

  .timeline {
    margin-top: 20px;
    position: relative;
    padding-left: 20px;

    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 5px;
      width: 1px;
      height: 100%;
      background-color: #cdd9e5;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .timeline-dot {
        position: absolute;
        left: -8px;
        top: 5px;
        width: 16px;
        height: 16px;
        background-color: #409eff;
        border-radius: 50%;
        border: 2px solid #fff;
      }

      .timeline-content {
        padding-left: 20px;
        line-height: 1.8;

        .user {
          color: #6c757d;
          font-size: 12px;
          margin: 4px 0;
        }

        .pending {
          color: #f56c6c;
        }

        .approved {
          color: #67c23a;
        }
      }
    }
  }
}

.goods-table {
  border: 1px solid #e6f7ff;
  border-radius: 8px;
  overflow: hidden;
}

.status-tag {
  display: inline-block;
  padding: 5px 12px;
  background-color: #ffd700;
  color: #303133;
  border-radius: 4px;
  font-size: 12px;
}

.el-button {
  font-size: 14px;
  padding: 8px 15px; /* 适当减小按钮内边距 */
  border-radius: 4px;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
  }
}

/* 响应式布局 */
@media (max-width: 600px) {
  .right-buttons {
    flex-direction: column;
    align-items: flex-start;
    margin-top: 10px;
  }
}
</style>    