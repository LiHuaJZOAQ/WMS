const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse, executeQuery, executeTransaction } = require('../utils');
const ExcelJS = require('exceljs');
const moment = require('moment');

// 获取入库单列表
router.get('/inbound-orders', async (req, res) => {
  try {
    const { status, orderType, startDate, endDate, keyword, page = 1, pageSize = 10 } = req.query;
    let sql = `
      SELECT o.*, p.PartnerName, u.FullName as CreatorName, a.FullName as AuditorName
      FROM InboundOrder o
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
      sql += ' AND (o.InboundNo LIKE ? OR p.PartnerName LIKE ?)';
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
router.get('/inbound-orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderSql = `
      SELECT o.*, p.PartnerName, p.PartnerCode 
      FROM InboundOrder o 
      LEFT JOIN Partner p ON o.PartnerID = p.PartnerID 
      WHERE o.InboundID = ?`;
    const orders = await executeQuery(orderSql, [orderId]);
    if (orders.length === 0) return res.status(404).json(errorResponse('未找到入库单'));

    const detailSql = `
      SELECT d.*, i.ItemCode, i.ItemName, i.Specification, i.Unit 
      FROM InboundOrderDetail d 
      JOIN Item i ON d.ItemID = i.ItemID 
      WHERE d.InboundID = ?`;
    const details = await executeQuery(detailSql, [orderId]);

    res.json(successResponse({ ...orders[0], details }));
  } catch (error) {
    res.status(500).json(errorResponse('获取详情失败'));
  }
});

// 创建入库单
router.post('/inbound-orders', async (req, res) => {
  try {
    const { OrderType, PartnerID, Status, Remark, details } = req.body;
    const userId = req.user ? req.user.id : 1;
    const inboundNo = 'IN' + moment().format('YYYYMMDDHHmmss');

    const operations = [{
      sql: 'INSERT INTO InboundOrder (InboundNo, OrderType, PartnerID, Status, CreatedBy, Remark) VALUES (?, ?, ?, ?, ?, ?)',
      params: [inboundNo, OrderType || 'PURCHASE', PartnerID, Status || 'Pending', userId, Remark || '']
    }];

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [orderResult] = await connection.execute(operations[0].sql, operations[0].params);
      const inboundId = orderResult.insertId;

      for (const item of details) {
        await connection.execute(
          'INSERT INTO InboundOrderDetail (InboundID, ItemID, Quantity, LocationCode) VALUES (?, ?, ?, ?)',
          [inboundId, item.ItemID, item.Quantity, item.LocationCode || null]
        );
      }
      await connection.commit();
      res.json(successResponse({ inboundId, inboundNo }, '入库单创建成功'));
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json(errorResponse('创建入库单失败'));
  }
});

// 审核入库单 (增加库存)
router.put('/inbound-orders/audit/:id', async (req, res) => {
  try {
    const inboundId = req.params.id;
    const { Status, AuditRemark } = req.body;
    const userId = req.user ? req.user.id : 1;

    if (Status !== 'Completed') {
      await executeQuery('UPDATE InboundOrder SET Status=?, AuditBy=?, AuditTime=NOW(), Remark=? WHERE InboundID=?', [Status, userId, AuditRemark, inboundId]);
      return res.json(successResponse(null, '单据状态已更新'));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('UPDATE InboundOrder SET Status=?, AuditBy=?, AuditTime=NOW() WHERE InboundID=?', ['Completed', userId, inboundId]);

      const [details] = await connection.execute('SELECT * FROM InboundOrderDetail WHERE InboundID = ?', [inboundId]);
      
      for (const d of details) {
        const [inv] = await connection.execute('SELECT * FROM Inventory WHERE ItemID=? AND LocationID=?', [d.ItemID, d.LocationCode || 'DEFAULT']);
        if (inv.length > 0) {
          await connection.execute('UPDATE Inventory SET CurrentQuantity = CurrentQuantity + ?, AvailableQuantity = AvailableQuantity + ?, LastUpdatedTime=NOW() WHERE InventoryID=?', [d.Quantity, d.Quantity, inv[0].InventoryID]);
        } else {
          await connection.execute('INSERT INTO Inventory (ItemType, ItemID, LocationID, CurrentQuantity, AvailableQuantity, ReservedQuantity) VALUES (?, ?, ?, ?, ?, 0)', ['NORMAL', d.ItemID, d.LocationCode || 'DEFAULT', d.Quantity, d.Quantity]);
        }

        await connection.execute(
          'INSERT INTO InventoryTransaction (ItemID, TransactionType, Quantity, SourceDocumentNo, TransactionTime, OperatorID) VALUES (?, "INBOUND", ?, (SELECT InboundNo FROM InboundOrder WHERE InboundID=?), NOW(), ?)',
          [d.ItemID, d.Quantity, inboundId, userId]
        );
      }
      await connection.commit();
      res.json(successResponse(null, '审核入库成功，库存已增加'));
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json(errorResponse('审核失败'));
  }
});

module.exports = router;
