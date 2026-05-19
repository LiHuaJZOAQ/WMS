<template>
  <el-row class="tac">
    <el-menu active-text-color="#ffd04b" background-color="#545c64" class="el-menu-vertical-demo" default-active="首页"
      text-color="#fff" @select="handleMenuClick" @open="handleOpen" @close="handleClose">
      <el-menu-item index="首页">
        <template #title>
          <el-icon>
            <HomeFilled />
          </el-icon>
          <span>首页</span>
        </template>
      </el-menu-item>
      <el-sub-menu index="基础数据">
        <template #title>
          <el-icon>
            <Document />
          </el-icon>
          <span>基础数据</span>
        </template>
        <el-menu-item index="基础数据/往来单位管理">往来单位管理</el-menu-item>
        <el-menu-item index="基础数据/部门管理">部门管理</el-menu-item>
        <el-menu-item index="基础数据/商品档案">商品档案 (SKU)</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="入库管理">
        <template #title>
          <el-icon>
            <Sell />
          </el-icon>
          <span>入库管理</span>
        </template>
        <el-menu-item index="入库管理/通用入库单">入库单管理</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="出库管理">
        <template #title>
          <el-icon>
            <Van />
          </el-icon>
          <span>出库管理</span>
        </template>
        <el-menu-item index="出库管理/通用出库单">出库单管理</el-menu-item>
        <el-menu-item index="出库管理/波次拣货">智能波次拣货 (推荐)</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="盘点管理">
        <template #title>
          <el-icon>
            <DocumentChecked />
          </el-icon>
          <span>盘点管理</span>
        </template>
        <el-menu-item index="盘点管理/通用盘点">库存盘点作业</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="库存管理">
        <template #title>
          <el-icon>
            <Coin />
          </el-icon>
          <span>库存管理</span>
        </template>
        <el-menu-item index="库存管理/全局库存">全局库存查询</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="仓位管理">
        <template #title>
          <el-icon>
            <Location />
          </el-icon>
          <span>仓位管理</span>
        </template>
        <el-menu-item index="仓位管理/仓库库位">仓库库位</el-menu-item>
        <!-- <el-menu-item index="仓位管理/产品仓位">仓位</el-menu-item> -->
        
      </el-sub-menu>
      <el-sub-menu index="系统设置">
        <template #title>
          <el-icon>
            <Setting />
          </el-icon>
          <span>系统设置</span>
        </template>
        <el-menu-item index="系统设置/用户管理">用户管理</el-menu-item>
        <el-menu-item index="系统设置/角色管理">角色管理</el-menu-item>
        <el-menu-item index="系统设置/操作日志">操作日志</el-menu-item>
      </el-sub-menu>
      
      <!-- 新增创新功能入口 -->
      <el-menu-item index="创新功能/移动扫码台">
        <el-icon>
          <Cellphone />
        </el-icon>
        <template #title>移动扫码工作台</template>
      </el-menu-item>
    </el-menu>
  </el-row>
  <template>
    <LogoutView :State="LogoutState" />
  </template>
</template>

<script lang="ts" setup>
import {
  Document,
  Menu as IconMenu,
  Location,
  Setting,
  HomeFilled,
  Cellphone
} from '@element-plus/icons-vue'
import { ref } from 'vue'
import LogoutView from '@/views/LogoutView.vue'

const LogoutState = ref(false)
const selectedIndex = ref('首页')
const emit = defineEmits(['onChangeView'])
const sendChangeView = (view: any) => {
  emit('onChangeView', view)
}
const handleMenuClick = (index: string) => {
  if (index === "首页") {
    console.log("首页")
    sendChangeView("MainView")
  } else if (index === "基础数据/往来单位管理") {
    sendChangeView("SupplierManage")
  } else if (index === "基础数据/部门管理") {
    sendChangeView("DepartmentManage")
  } else if (index === "基础数据/商品档案") {
    sendChangeView("FinishedProductManage")
  } else if (index === "入库管理/通用入库单") {
    sendChangeView("InStorageRawMaterial")
  } else if (index === '出库管理/通用出库单') {
    sendChangeView('OutStorageRawMaterial')
  } else if (index === '出库管理/波次拣货') {
    sendChangeView('WavePicking')
  } else if (index === '盘点管理/通用盘点') {
    sendChangeView('CheckStorageRawMaterial')
  } else if (index === '库存管理/全局库存') {
    sendChangeView('InventoryRawMaterial')
  } else if (index === '仓位管理/仓库库位') {
    sendChangeView('LocationRawMaterial')
  } else if (index === '系统设置/用户管理') {
    sendChangeView('UserManage')
  } else if (index === '系统设置/角色管理') {
    sendChangeView('RoleManage')
  } else if (index === '系统设置/操作日志') {
    sendChangeView('OperationLog')
  } else if (index === '创新功能/移动扫码台') {
    sendChangeView('MobileScanner')
  } else if (index === '系统设置/系统退出') {
    LogoutState.value = LogoutState.value == true ? false : true
  }
};
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style scoped lang="scss">
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  height: 100vh;
}
</style>
