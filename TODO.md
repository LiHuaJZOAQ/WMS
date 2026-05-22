- [x] 原料入库前端“详情、打印、审核、撤销”的实现
- [x] 首页与各个页面的连接以及数据的显示
- [x] 仓位管理中添加仓位的原料选择中出现undefined，但是数据可以正常返回 (注: 仓位页面已重写，此问题不再适用)
- [x] 库存管理中没有详情对话框
- [x] 库存管理中分页功能没有实现
- [x] 库存管理中编辑后没有更新
- [x] 代码走查与架构评估报告生成并归档至 `docs/code_review_report.md`
- [x] 后端重构：将庞大的 `server/index.js` 拆分成模块化的 `routes`
- [x] 后端重构：抽离配置到 `.env` 和 `config/db.js`
- [x] 后端重构：抽取公共工具函数到 `utils/index.js`
- [x] 后端重构：添加全局错误处理中间件 `middleware/errorHandler.js`
- [x] 深度自检与优化：修复 JWT 鉴权中间件缺失的严重安全漏洞
- [x] 深度自检与优化：修复库位管理路由（`locations`）被错误混入盘点模块（`stocktaking`）的架构设计问题

# WMS 项目问题修复任务清单

## 一、紧急修复 (P0) - 浏览器无响应

- [x] 1.1 KeepAlive 无限缓存导致内存泄漏 (HomeView.vue)
- [x] 1.2 ECharts 图表实例未销毁 (已验证：MainView.vue 有正确的 dispose 逻辑)

---

## 二、API 一致性修复 (P1) - 前后端接口对齐

### 2.1 修复接口路径错误

- [x] 2.1.1 入库单审核：前端 `/inbound-orders/audit` → 后端 `/inbound-orders/batch-audit`
- [x] 2.1.2 前端 `auditInboundOrders` 函数修复

### 2.2 添加后端缺失接口

- [x] 2.2.1 `GET /inbound-orders/create-options` - 入库单创建选项
- [x] 2.2.2 `GET /inbound-orders/options` - 入库单筛选选项
- [x] 2.2.3 `GET /outbound-orders/options` - 出库单筛选选项
- [x] 2.2.4 `PUT /inbound-orders/revoke` - 入库单撤销
- [x] 2.2.5 `PUT /outbound-orders/:id/revoke` - 出库单撤销
- [x] 2.2.6 `GET /inbound-orders/:id/print` - 入库单打印数据
- [x] 2.2.7 `GET /inbound-orders/export` - 入库单导出

### 2.3 补充前端缺失 API

- [x] 2.3.1 波次管理 API：`POST /waves/recommend`, `POST /waves`, `GET /waves/:id/pick-map`, `PUT /waves/:id/complete`
- [x] 2.3.2 库位管理 API：`GET /locations/list`, `GET /warehouses/options`

---

## 三、业务逻辑修复 (P1)

### 3.1 库存流水记录

- [x] 3.1.1 出库单审核时添加 InventoryTransaction 流水记录
- [x] 3.1.2 波次完成后扣减 CurrentQuantity

### 3.2 业务流程闭环

- [x] 3.2.1 波次完成后自动扣减库存逻辑
- [x] 3.2.2 出库单撤销后恢复库存逻辑（已在 outboundOrders.js 中实现）
- [x] 3.2.3 入库单撤销后扣减库存逻辑（已在 inboundOrders.js 中实现）

---

## 四、前端代码优化 (P2)

- [x] 4.1 移除 main.ts 中重复的路由守卫
- [x] 4.2 Auth Store 添加 localStorage 初始化
- [x] 4.3 路由守卫优化：Token 失效提示（已在 request.ts 响应拦截器中处理）

---

## 五、安全性修复 (P2)

- [x] 5.1 统一 JWT 认证路径配置（已通过修复 API 路径一致性解决）
- [x] 5.2 移除硬编码的默认密钥（JWT_SECRET 在 config/env.js 中集中管理）
- [x] 5.3 环境变量强制检查

---

## 六、API 文档

- [x] 6.1 生成 OpenAPI / Swagger 格式的 API 文档（使用 Markdown 格式替代）
- [x] 6.2 创建 API.md 文档

---

## 修复优先级顺序

```
P0: 浏览器无响应 → 立即修复
    ↓
P1: API 一致性 + 业务逻辑 → 核心功能
    ↓
P2: 代码优化 + 安全性 → 提升质量
    ↓
P3: API 文档 → 长期维护
```

---

## 验收标准

1. 浏览器访问多个页面后不再卡顿
2. 所有前端 API 调用与后端接口一一对应
3. 库存流水记录完整可追溯
4. 前后端代码无安全风险
5. 有完整的 API 文档供参考