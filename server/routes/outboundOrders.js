const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse, executeQuery, executeTransaction } = require('../utils');
const moment = require('moment');

// 获取出库单筛选选项
router.get('/outbound-orders/options', async (req, res) => {
  try {
    const orderStatus = [
      { value: 'Pending', label: '待审核' },
      { value: 'approved', label: '已批准' },
      { value: 'Rejected', label: '已拒绝' }
    ];
    
    const [outboundOrderNos] = await executeQuery('SELECT OutboundID as value, OutboundNo as label FROM OutboundOrder ORDER BY CreatedTime DESC LIMIT 100');
    const [sourceDocNos] = await executeQuery('SELECT DISTINCT SourceDocNo as value, SourceDocNo as label FROM OutboundOrder WHERE SourceDocNo IS NOT NULL LIMIT 100');
    const [materialNames] = await executeQuery(`
      SELECT DISTINCT i.ItemName as value, i.ItemName as label 
      FROM OutboundOrderDetail d 
      JOIN Item i ON d.ItemID = i.ItemID 
      LIMIT 100
    `);
    const [materialNos] = await executeQuery(`
      SELECT DISTINCT i.ItemCode as value, i.ItemCode as label 
      FROM OutboundOrderDetail d 
      JOIN Item i ON d.ItemID = i.ItemID 
      LIMIT 100
    `);
    const [batchNos] = await executeQuery('SELECT DISTINCT BatchNo as value, BatchNo as label FROM OutboundOrderDetail WHERE BatchNo IS NOT NULL LIMIT 100');
    const warehouses = [
      { value: 'MAIN', label: '主仓库' },
      { value: 'RAW', label: '原料仓库' },
      { value: 'FINISHED', label: '成品仓库' }
    ];
    const orderTypes = [
      { value: 'SALES', label: '销售出库' },
      { value: 'TRANSFER', label: '调拨出库' },
      { value: 'PRODUCTION', label: '生产领料' }
    ];
    const [suppliers] = await executeQuery('SELECT PartnerID as value, PartnerName as label FROM Partner WHERE Status = 1 LIMIT 100');
    const [manufacturers] = await executeQuery('SELECT PartnerID as value, PartnerName as label FROM Partner WHERE Status = 1 LIMIT 100');

    res.json(successResponse({
      orderStatus,
      outboundOrderNos,
      sourceDocNos,
      materialNames,
      materialNos,
      batchNos,
      warehouses,
      orderTypes,
      suppliers,
      manufacturers
    }));
  } catch (error) {
    res.status(500).json(errorResponse('获取筛选选项失败'));
  }
});

// 获取出库单列表
router.get('/outbound-orders', async (req, res) => {
  try {
    const { status, orderType, startDate, endDate, keyword, page = 1, pageSize = 10 } = req.query;
    let sql = `
      SELECT o.*, p.PartnerName, u.FullName as CreatorName, a.FullName as AuditorName
      FROM OutboundOrder o
      LEFT JOIN Partner p ON o.PartnerID = p.PartnerID
      LEFT JOIN User u ON o.CreatedBy = u.UserID
      LEFT JOIN User a ON o.AuditBy = a.UserID
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ' AND o.Status = ?'; params.push(status); }
    if (orderType) { sql += ' AND o.OrderType = ?'; params.push(orderType); }
    if (startDate && endDate) {
      sql += ' AND o.CreatedTime BETWEEN ? AND ?';
      params.push(startDate, endDate + ' 23:59:59');
    }
    if (keyword) {
      sql += ' AND (o.OutboundNo LIKE ? OR p.PartnerName LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY o.CreatedTime DESC';

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    
    const countResult = await executeQuery(countSql, params);
    const total = countResult[0].total;

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const items = await executeQuery(sql, params);
    res.json(successResponse({ items, total }));
  } catch (error) {
    res.status(500).json(errorResponse('获取列表失败'));
  }
});

// 获取详情
router.get('/outbound-orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderSql = `
      SELECT o.*, p.PartnerName, p.PartnerCode 
      FROM OutboundOrder o 
      LEFT JOIN Partner p ON o.PartnerID = p.PartnerID 
      WHERE o.OutboundID = ?`;
    const orders = await executeQuery(orderSql, [orderId]);
    if (orders.length === 0) return res.status(404).json(errorResponse('未找到出库单'));

    const detailSql = `
      SELECT d.*, i.ItemCode, i.ItemName, i.Specification, i.Unit 
      FROM OutboundOrderDetail d 
      JOIN Item i ON d.ItemID = i.ItemID 
      WHERE d.OutboundID = ?`;
    const details = await executeQuery(detailSql, [orderId]);

    res.json(successResponse({ ...orders[0], details }));
  } catch (error) {
    res.status(500).json(errorResponse('获取详情失败'));
  }
});

// 创建出库单
router.post('/outbound-orders', async (req, res) => {
  try {
    const { OrderType, PartnerID, Status, Remark, details } = req.body;
    const userId = req.user ? req.user.id : 1;
    const outboundNo = 'OUT' + moment().format('YYYYMMDDHHmmss');

    const operations = [{
      sql: 'INSERT INTO OutboundOrder (OutboundNo, OrderType, PartnerID, Status, CreatedBy, Remark) VALUES (?, ?, ?, ?, ?, ?)',
      params: [outboundNo, OrderType || 'SALES', PartnerID, Status || 'Pending', userId, Remark || '']
    }];

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [orderResult] = await connection.execute(operations[0].sql, operations[0].params);
      const outboundId = orderResult.insertId;

      for (const item of details) {
        await connection.execute(
          'INSERT INTO OutboundOrderDetail (OutboundID, ItemID, Quantity, LocationCode) VALUES (?, ?, ?, ?)',
          [outboundId, item.ItemID, item.Quantity, item.LocationCode || null]
        );
      }
      await connection.commit();
      res.json(successResponse({ outboundId, outboundNo }, '出库单创建成功'));
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json(errorResponse('创建出库单失败'));
  }
});

// 审核出库单 (预扣减库存)
router.put('/outbound-orders/audit/:id', async (req, res) => {
  try {
    const outboundId = req.params.id;
    const { Status, AuditRemark } = req.body;
    const userId = req.user ? req.user.id : 1;

    if (Status !== 'approved') {
      await executeQuery('UPDATE OutboundOrder SET Status=?, AuditBy=?, AuditTime=NOW(), Remark=? WHERE OutboundID=?', [Status, userId, AuditRemark, outboundId]);
      return res.json(successResponse(null, '单据状态已更新'));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [details] = await connection.execute('SELECT * FROM OutboundOrderDetail WHERE OutboundID = ?', [outboundId]);
      
      for (const d of details) {
        const [inv] = await connection.execute('SELECT * FROM Inventory WHERE ItemID=? AND LocationID=?', [d.ItemID, d.LocationCode || 'DEFAULT']);
        if (inv.length === 0 || inv[0].AvailableQuantity < d.Quantity) {
          throw new Error(`商品ID [${d.ItemID}] 可用库存不足，无法审核出库`);
        }
        
        await connection.execute('UPDATE Inventory SET AvailableQuantity = AvailableQuantity - ?, ReservedQuantity = ReservedQuantity + ?, LastUpdatedTime=NOW() WHERE InventoryID=?', [d.Quantity, d.Quantity, inv[0].InventoryID]);
        
        // 记录库存流水（预扣减）
        await connection.execute(
          'INSERT INTO InventoryTransaction (ItemID, TransactionType, Quantity, SourceDocumentNo, TransactionTime, OperatorID) VALUES (?, "OUTBOUND_RESERVE", ?, (SELECT OutboundNo FROM OutboundOrder WHERE OutboundID=?), NOW(), ?)',
          [d.ItemID, -d.Quantity, outboundId, userId]
        );
      }

      await connection.execute('UPDATE OutboundOrder SET Status=?, AuditBy=?, AuditTime=NOW() WHERE OutboundID=?', ['approved', userId, outboundId]);
      await connection.commit();
      res.json(successResponse(null, '审核通过，已预扣减可用库存，等待波次拣货或发货确认'));
    } catch (err) {
      await connection.rollback();
      return res.status(400).json(errorResponse(err.message || '审核失败'));
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json(errorResponse('审核失败'));
  }
});

// 撤销出库单
router.put('/outbound-orders/:id/revoke', async (req, res) => {
  try {
    const outboundId = req.params.id;
    const userId = req.user ? req.user.id : 1;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 查询出库单状态
      const [orders] = await connection.execute('SELECT Status FROM OutboundOrder WHERE OutboundID = ?', [outboundId]);
      if (orders.length === 0) {
        return res.status(404).json(errorResponse('未找到出库单'));
      }

      const currentStatus = orders[0].Status;

      if (currentStatus === 'approved') {
        // 如果已审核通过，需要恢复库存（预扣减的要还回去）
        const [details] = await connection.execute('SELECT * FROM OutboundOrderDetail WHERE OutboundID = ?', [outboundId]);
        
        for (const d of details) {
          const [inv] = await connection.execute('SELECT * FROM Inventory WHERE ItemID=? AND LocationID=?', [d.ItemID, d.LocationCode || 'DEFAULT']);
          if (inv.length > 0) {
            // 恢复库存
            await connection.execute(
              'UPDATE Inventory SET AvailableQuantity = AvailableQuantity + ?, ReservedQuantity = ReservedQuantity - ?, LastUpdatedTime = NOW() WHERE InventoryID = ?',
              [d.Quantity, d.Quantity, inv[0].InventoryID]
            );
            
            // 记录流水
            await connection.execute(
              'INSERT INTO InventoryTransaction (ItemID, TransactionType, Quantity, SourceDocumentNo, TransactionTime, OperatorID) VALUES (?, "OUTBOUND_REVOKE", ?, (SELECT OutboundNo FROM OutboundOrder WHERE OutboundID=?), NOW(), ?)',
              [d.ItemID, d.Quantity, outboundId, userId]
            );
          }
        }
      }

      // 更新状态
      await connection.execute(
        'UPDATE OutboundOrder SET Status = ?, AuditBy = NULL, AuditTime = NULL WHERE OutboundID = ?',
        ['Pending', outboundId]
      );

      await connection.commit();
      res.json(successResponse(null, '撤销成功，库存已恢复'));
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json(errorResponse('撤销失败'));
  }
});

// 获取出库单打印数据
router.get('/outbound-orders/:id/print', async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderSql = `
      SELECT o.*, p.PartnerName, p.PartnerCode 
      FROM OutboundOrder o 
      LEFT JOIN Partner p ON o.PartnerID = p.PartnerID 
      WHERE o.OutboundID = ?`;
    const orders = await executeQuery(orderSql, [orderId]);
    if (orders.length === 0) return res.status(404).json(errorResponse('未找到出库单'));

    const order = orders[0];

    const detailSql = `
      SELECT d.*, i.ItemCode, i.ItemName, i.Specification, i.Unit 
      FROM OutboundOrderDetail d 
      JOIN Item i ON d.ItemID = i.ItemID 
      WHERE d.OutboundID = ?`;
    const details = await executeQuery(detailSql, [orderId]);

    res.json(successResponse({
      outboundOrderNo: order.OutboundNo,
      outboundDate: order.CreatedTime,
      customerName: order.PartnerName || '',
      materialName: details[0]?.ItemName || '',
      materialNo: details[0]?.ItemCode || '',
      quantity: details.reduce((sum, d) => sum + (d.Quantity || 0), 0),
      warehouse: order.OrderType || '',
      status: order.Status
    }));
  } catch (error) {
    res.status(500).json(errorResponse('获取打印数据失败'));
  }
});

module.exports = router;
