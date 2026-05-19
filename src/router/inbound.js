const express = require('express');
const router = express.Router();
const inboundController = require('../api/inboundController');

// 获取筛选选项
router.get('/api/inbound-orders/options', inboundController.getFilterOptions);

// 获取入库单列表
router.get('/api/inbound-orders', inboundController.getInboundOrders);

// 导出入库单
router.get('/api/inbound-orders/export', inboundController.exportInboundOrders);

// 审核入库单
router.put('/api/inbound-orders/audit', inboundController.auditInboundOrders);

// 撤销入库单
router.put('/api/inbound-orders/revoke', inboundController.revokeInboundOrders);

// 获取打印数据
router.get('/api/inbound-orders/:id/print', inboundController.getPrintData);

// 获取新建入库单选项
router.get('/api/inbound-orders/create-options', inboundController.getCreateOptions);

// 创建入库单
router.post('/api/inbound-orders', inboundController.createInboundOrder);

module.exports = router;