
---

## 2026/04/24

### 创新功能：智能波次拣货与 PDA 扫码台
    - **移动扫码工作台 (PDA Simulation)**：在前端新增 `MobileScanner.vue`，模拟现场工人手持 PDA 或手机浏览器进行条码扫描作业。支持对库位码（LOC-）、物料码（MAT-）及单据码（ORD-）的智能识别，并在下方生成实时操作流水线。
    - **智能波次管理 (Smart Wave Picking)**：新增 `server/routes/wave.js` 后端接口与数据库 `Wave`、`WaveDetail` 表。系统支持将多个状态为“已审核”的待出库单智能聚合成一个拣货波次，极大提升了仓库现场作业效率。
    - **3D/2D 拣货最优路径图 (Pick Path Map)**：前端新增 `PickPathMap.vue` 库位可视化组件。在执行波次拣货时，系统会渲染出仓库的平面货架图，并利用排序算法自动生成并绘制一条连接所有待拣库位的 SVG 动态指引路线。

### 架构与配置优化 (2026/04/24 补充)
    - **前端请求拦截器重构 (Axios)**：全面升级了 `src/utils/request.ts`。新增了全局的 Element Plus 错误消息提示 (`ElMessage.error`)；增加了对 401 鉴权失败的自动拦截与登录页跳转逻辑；增加了对后端业务状态码 (`res.code !== 200`) 的统一异常捕获。
    - **热更新修复**：修正了根目录 `package.json` 中的 `dev:backend` 脚本，现已正确调用 `nodemon` 以支持后端代码的实时热更新。

---

## 2026/04/23

### 架构与配置优化
    - **一键启动优化**：在根目录 `package.json` 中引入了 `concurrently` 依赖，优化了 `npm run dev` 脚本，现可通过单条命令同时启动 Vue 前端 (Vite) 和 Node 后端 (Express) 服务，极大简化了开发启动流程。
    - **冗余文件清理**：将开发期间残留的 `.` 开头的临时备份文件、用于批量生成 API 的 `.cjs` 脚本文件以及 dogfood 测试的报告统一迁移到了 `quit/` 目录下，并补充了相应的 `quit/README.md`。

### 全功能补齐与前后端打通
    - **基础数据模块 (CRUD)**：基于系统现有的 `Supplier`、`Customer`、`Department`、`ProcessingFactory`、`FinishedProduct` 数据库表，全量开发了对应的增删改查 Node.js 接口，并在前端 `BasicData` 下新增了对应的 Vue 数据管理表格页面，完善了数据完整性校验。
    - **出入库模块扩充**：废除了原出入库页面的纯前端 Mock 假数据。新增了 `FinishedProductInbound` (成品入库) 和 `FinishedProductOutbound` (成品出库) 模块的 API。
    - **自动扣减库存流水**：出入库模块现已完全对接库存核心表（`Inventory`）。前端发起“审核通过”动作后，系统会自动更新对应库位的 `CurrentQuantity` 和 `AvailableQuantity`，并向 `InventoryTransaction` 表写入标准的出入库流水。
    - **盘点模块重构**：将原料盘点和成品盘点拆分并对接真实的 `Stocktaking` API。实现了盘点单的审核结算逻辑：如果实际库存和系统库存有差异 (`DifferenceQuantity`)，系统在审核后会自动执行“盘盈/盘亏”并平账到当前库存。
    - **系统设置与权限 (RBAC)**：完成了 `User`（用户管理）、`Role`（角色与权限分配树）、`OperationLog`（操作日志追溯）三个核心系统功能的前后端闭环。管理员可为员工分配动态角色，并按日期/模块查询系统的操作日志。

---

## 2026/04/22

### 优化与功能完善
    - 完善原料入库前端：实现了“详情”、“打印”、“审核”和“撤销”等功能的逻辑。详情现直接调用后台接口并以模态框展示，打印功能使用新窗口打印特定入库单样式。
    - 修复首页链接：在 MainView.vue 中完善了 viewDetails 方法，实现首页图表卡片点击后正确跳转至各对应的列表页面。
    - 修复库存管理详情：修复了由于 axios 响应拦截器直接返回 response 而导致的 detail 对象获取路径问题（`materialDetail.data.code`），使得原料库存详情对话框能够正确渲染展示。
    - 修复库存管理编辑问题：更新了后端 `updateRawMaterial` 接口，在更新语句中加入 `MinStock`、`MaxStock` 以及 `Status` 字段，并移除了前端库存管理编辑表单中最大/小库存输入框的 `display: none` 隐藏样式。
    - 解决仓位管理遗留问题：由于仓位管理页面已整体重写，原有添加仓位时的“原料选择 undefined”问题已被新版库位生命周期管理设计覆盖且不再出现。
    - 修复 LocationRawMaterial 中下拉框获取列表时的 `.map` 报错问题。

---

## 2025/06/17

### 增加 \server\index.js 后端接口
    WMS系统后端服务
    服务地址: http://localhost:3000
    使用方法: cd server && npm start
    可用接口:
    【用户认证】
    - POST /api/users/login     - 用户登录
    - GET  /api/users/info      - 获取用户信息
    【入库管理】
    - GET  /api/inbound-orders/create-options - 获取新建选项
    - POST /api/inbound-orders   - 创建入库单
    - GET  /api/inbound-orders/:id      - 获取入库单详情
    - PUT  /api/inbound-orders/:id      - 修改入库单
    - DELETE /api/inbound-orders/:id    - 删除入库单
    【系统功能】
    - GET  /api/test      - 测试数据库连接
    - GET  /health        - 健康检查

### 完善数据库与测试数据

---

