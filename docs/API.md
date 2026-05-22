# WMS API 接口文档

> 本文档基于代码自动生成，描述系统的所有 API 接口

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

---

## 一、用户认证

### 1.1 用户登录

```
POST /users/login
```

**请求体:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "name": "管理员",
      "email": "admin@example.com",
      "department": "IT",
      "position": "Manager"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 获取用户信息

```
GET /users/info
```

**请求头:**
```
Authorization: Bearer <token>
```

**响应:**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "email": "admin@example.com",
    "department": "IT",
    "position": "Manager"
  }
}
```

---

## 二、仪表盘

### 2.1 获取仪表盘摘要

```
GET /dashboard/summary
```

**响应:**
```json
{
  "code": 200,
  "data": {
    "todayInbound": 10,
    "todayOutbound": 5,
    "totalInventory": 1000,
    "pendingOrders": 15,
    "lowStockItems": 3
  }
}
```

---

## 三、入库管理

### 3.1 获取入库单创建选项

```
GET /inbound-orders/create-options
```

**响应:**
```json
{
  "code": 200,
  "data": {
    "warehouseTypes": [
      { "value": "PURCHASE", "label": "采购入库" },
      { "value": "RETURN", "label": "退货入库" }
    ],
    "warehouses": [
      { "value": "MAIN", "label": "主仓库" }
    ],
    "warehouseMethods": [
      { "value": "MANUAL", "label": "人工入库" }
    ],
    "suppliers": [
      { "value": 1, "label": "供应商A" }
    ],
    "manufacturers": [],
    "materials": [
      { "materialNo": "M001", "materialName": "原料A", "specification": "规格A", "unit": "kg" }
    ]
  }
}
```

### 3.2 获取入库单筛选选项

```
GET /inbound-orders/options
```

### 3.3 获取入库单列表

```
GET /inbound-orders
```

**查询参数:**
| 参数 | 类型 | 描述 |
|------|------|------|
| status | string | 订单状态 |
| orderType | string | 入库类型 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| keyword | string | 关键词 |
| page | number | 页码 |
| pageSize | number | 每页数量 |

### 3.4 创建入库单

```
POST /inbound-orders
```

**请求体:**
```json
{
  "OrderType": "PURCHASE",
  "PartnerID": 1,
  "Status": "Pending",
  "Remark": "备注",
  "details": [
    {
      "ItemID": 1,
      "Quantity": 100,
      "LocationCode": "A-01-01"
    }
  ]
}
```

### 3.5 获取入库单详情

```
GET /inbound-orders/:id
```

### 3.6 审核入库单（单个）

```
PUT /inbound-orders/audit/:id
```

**请求体:**
```json
{
  "Status": "Completed",
  "AuditRemark": "审核备注"
}
```

### 3.7 批量审核入库单

```
PUT /inbound-orders/batch-audit
```

**请求体:**
```json
{
  "ids": [1, 2, 3],
  "status": "approved",
  "reason": "审核通过"
}
```

### 3.8 撤销入库单

```
PUT /inbound-orders/revoke
```

**请求体:**
```json
{
  "ids": [1, 2, 3]
}
```

### 3.9 获取入库单打印数据

```
GET /inbound-orders/:id/print
```

### 3.10 导出入库单

```
GET /inbound-orders/export
```

---

## 四、出库管理

### 4.1 获取出库单筛选选项

```
GET /outbound-orders/options
```

### 4.2 获取出库单列表

```
GET /outbound-orders
```

**查询参数:**
| 参数 | 类型 | 描述 |
|------|------|------|
| status | string | 订单状态 |
| orderType | string | 出库类型 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| keyword | string | 关键词 |
| page | number | 页码 |
| pageSize | number | 每页数量 |

### 4.3 创建出库单

```
POST /outbound-orders
```

**请求体:**
```json
{
  "OrderType": "SALES",
  "PartnerID": 1,
  "Status": "Pending",
  "Remark": "备注",
  "details": [
    {
      "ItemID": 1,
      "Quantity": 50,
      "LocationCode": "A-01-01"
    }
  ]
}
```

### 4.4 获取出库单详情

```
GET /outbound-orders/:id
```

### 4.5 审核出库单

```
PUT /outbound-orders/:id/audit
```

**请求体:**
```json
{
  "Status": "approved",
  "AuditRemark": "审核备注"
}
```

### 4.6 撤销出库单

```
PUT /outbound-orders/:id/revoke
```

### 4.7 获取出库单打印数据

```
GET /outbound-orders/:id/print
```

---

## 五、波次管理

### 5.1 获取波次列表

```
GET /waves
```

**查询参数:**
| 参数 | 类型 | 描述 |
|------|------|------|
| status | string | 波次状态 |
| page | number | 页码 |
| pageSize | number | 每页数量 |

### 5.2 智能推荐波次

```
POST /waves/recommend
```

**响应:**
```json
{
  "code": 200,
  "data": {
    "recommendedOrders": [
      {
        "outboundId": 1,
        "outboundNo": "OUT20240101001",
        "priority": 1
      }
    ],
    "totalQuantity": 100,
    "totalItems": 5
  }
}
```

### 5.3 创建波次

```
POST /waves
```

**请求体:**
```json
{
  "outboundIds": [1, 2, 3],
  "remark": "波次备注"
}
```

### 5.4 获取波次拣货地图

```
GET /waves/:id/pick-map
```

**响应:**
```json
{
  "code": 200,
  "data": {
    "waveNo": "WAVE20240101001",
    "status": "Picking",
    "items": [
      {
        "itemId": 1,
        "itemName": "商品A",
        "quantity": 10,
        "location": {
          "code": "A-01-01",
          "row": 1,
          "column": 1,
          "layer": 1
        }
      }
    ],
    "optimalPath": ["A-01-01", "A-01-02", "B-02-01"]
  }
}
```

### 5.5 波次完成

```
PUT /waves/:id/complete
```

**请求体:**
```json
{
  "actualQuantities": [
    { "outboundDetailId": 1, "actualQuantity": 10 }
  ]
}
```

---

## 六、库存管理

### 6.1 获取库存列表

```
GET /inventory
```

**查询参数:**
| 参数 | 类型 | 描述 |
|------|------|------|
| keyword | string | 关键词（商品编号/名称） |
| itemType | string | 商品类型 |
| locationCode | string | 库位编码 |
| page | number | 页码 |
| pageSize | number | 每页数量 |

---

## 七、库位管理

### 7.1 获取库位列表

```
GET /locations/list
```

### 7.2 获���仓库选项

```
GET /warehouses/options
```

### 7.3 创建库位

```
POST /locations
```

**请求体:**
```json
{
  "LocationCode": "A-01-01",
  "WarehouseType": "RAW",
  "Row": 1,
  "Column": 1,
  "Layer": 1,
  "Status": "Active"
}
```

### 7.4 更新库位

```
PUT /locations/:locationCode
```

### 7.5 删除库位

```
DELETE /locations/:locationCode
```

---

## 八、基础数据

### 8.1 往来单位 (Partner)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /partners | 获取往来单位列表 |
| POST | /partners | 创建往来单位 |
| PUT | /partners/:id | 更新往来单位 |
| DELETE | /partners/:id | 删除往来单位 |

### 8.2 商品档案 (Item)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /items | 获取商品列表 |
| POST | /items | 创建商品 |
| PUT | /items/:id | 更新商品 |
| DELETE | /items/:id | 删除商品 |

---

## 九、盘点管理

### 9.1 获取盘点列表

```
GET /stocktaking
```

### 9.2 获取盘点详情

```
GET /stocktaking/:id
```

### 9.3 审核盘点

```
PUT /stocktaking/:id/audit
```

### 9.4 删除盘点

```
DELETE /stocktaking/:id
```

---

## 十、系统设置

### 10.1 用户管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /users | 获取用户列表 |
| POST | /users | 创建用户 |
| PUT | /users/:id | 更新用户 |
| DELETE | /users/:id | 删除用户 |

### 10.2 角色管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /roles | 获取角色列表 |
| POST | /roles | 创建角色 |
| PUT | /roles/:id | 更新角色 |
| DELETE | /roles/:id | 删除角色 |
| GET | /permissions | 获取权限列表 |

### 10.3 操作日志

```
GET /operation-logs
```

---

## 错误响应格式

所有错误响应都遵循以下格式:

```json
{
  "code": 400,
  "message": "错误描述信息"
}
```

### 常见错误码

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或Token过期 |
| 403 | 没有权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 更新日志

- **2024-01-01**: 初始版本
- **2024-01-15**: 添加波次管理相关接口
- **2024-02-01**: 添加批量审核、撤销功能