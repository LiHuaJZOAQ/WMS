const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse, executeQuery } = require('../utils');
const moment = require('moment');

// 获取仪表盘综合统计数据
router.get('/dashboard/summary', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');

    // 1. 获取库存卡片数据 (按 ItemType 分组)
    const inventorySql = `
      SELECT i.ItemType, COUNT(inv.InventoryID) as totalItems, SUM(inv.CurrentQuantity) as totalQuantity
      FROM Inventory inv
      JOIN Item i ON inv.ItemID = i.ItemID
      GROUP BY i.ItemType
    `;
    const inventoryStats = await executeQuery(inventorySql);

    // 2. 获取今日/本月入库量
    const inboundSql = `
      SELECT 
        SUM(CASE WHEN DATE(CreatedTime) = ? THEN 1 ELSE 0 END) as todayCount,
        SUM(CASE WHEN DATE(CreatedTime) >= ? THEN 1 ELSE 0 END) as monthCount
      FROM InboundOrder
      WHERE Status = 'Completed'
    `;
    const inboundStats = await executeQuery(inboundSql, [today, startOfMonth]);

    // 3. 获取今日/本月出库量
    const outboundSql = `
      SELECT 
        SUM(CASE WHEN DATE(CreatedTime) = ? THEN 1 ELSE 0 END) as todayCount,
        SUM(CASE WHEN DATE(CreatedTime) >= ? THEN 1 ELSE 0 END) as monthCount
      FROM OutboundOrder
      WHERE Status = 'Completed'
    `;
    const outboundStats = await executeQuery(outboundSql, [today, startOfMonth]);

    // 4. 获取待办任务数
    const pendingTasksSql = `
      SELECT 
        (SELECT COUNT(*) FROM InboundOrder WHERE Status = 'Pending') as pendingInbounds,
        (SELECT COUNT(*) FROM OutboundOrder WHERE Status = 'Pending') as pendingOutbounds,
        (SELECT COUNT(*) FROM Wave WHERE Status = 'Pending') as pendingWaves
    `;
    const pendingTasks = await executeQuery(pendingTasksSql);

    // 5. 获取库存分布图表数据 (Top 5 品类)
    const categorySql = `
      SELECT i.Category as name, SUM(inv.CurrentQuantity) as value
      FROM Inventory inv
      JOIN Item i ON inv.ItemID = i.ItemID
      GROUP BY i.Category
      ORDER BY value DESC
      LIMIT 5
    `;
    const categoryStats = await executeQuery(categorySql);

    // 6. 获取近7天出入库趋势
    const trendSql = `
      SELECT 
        DATE(TransactionDate) as date,
        SUM(CASE WHEN TransactionType = 'INBOUND' THEN QuantityChange ELSE 0 END) as inQuantity,
        SUM(CASE WHEN TransactionType = 'OUTBOUND' THEN ABS(QuantityChange) ELSE 0 END) as outQuantity
      FROM InventoryTransaction
      WHERE TransactionDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(TransactionDate)
      ORDER BY date ASC
    `;
    const trendStats = await executeQuery(trendSql);

    res.json(successResponse({
      inventory: inventoryStats,
      inbound: inboundStats[0],
      outbound: outboundStats[0],
      pending: pendingTasks[0],
      categoryChart: categoryStats,
      trendChart: trendStats
    }));

  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json(errorResponse('获取仪表盘数据失败'));
  }
});

module.exports = router;
