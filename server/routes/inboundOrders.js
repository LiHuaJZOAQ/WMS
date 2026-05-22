const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse, executeQuery, executeTransaction } = require('../utils');
const ExcelJS = require('exceljs');
const moment = require('moment');

// 获取入库单创建选项
router.get('/inbound-orders/create-options', async (req, res) => {
  try {
    // 获取入库类型
    const [warehouseTypes] = await executeQuery("SELECT DISTINCT OrderType as value, OrderType as label FROM InboundOrder WHERE OrderType IS NOT NULL");
    
    // 获取仓库（简化：使用固定的仓库列表，实际应从配置表获取）
    const warehouses = [
      { value: 'MAIN', label: '主仓库' },
      { value: 'RAW', label: '原料仓库' },
      { value: 'FINISHED', label: '成品仓库' }
    ];
    
    // 获取入库方式
    const warehouseMethods = [
      { value: 'MANUAL', label: '人工入库' },
      { value: 'AUTO', label: '自动入库' }
    ];
    
    // 获取供应商列表
    const [suppliers] = await executeQuery('SELECT PartnerID as value, PartnerName as label FROM Partner WHERE Status = 1 LIMIT 100');
    
    // 获取生产商列表（复用供应商表）
    const [manufacturers] = await executeQuery('SELECT PartnerID as value, PartnerName as label FROM Partner WHERE Status = 1 LIMIT 100');
    
    // 获取商品列表
    const [materials] = await executeQuery('SELECT ItemCode as materialNo, ItemName as materialName, Specification, Unit FROM Item WHERE Status = 1 LIMIT 100');

    res.json(successResponse({
      warehouseTypes: warehouseTypes.length > 0 ? warehouseTypes : [
        { value: 'PURCHASE', label: '采购入库' },
        { value: 'RETURN', label: '退货入库' },
        { value: 'TRANSFER', label: '调拨入库' }
      ],
      warehouses,
      warehouseMethods,
      suppliers,
      manufacturers,
      materials
    }));
  } catch (error) {
    res.status(500).json(errorResponse('获取选项失败'));
  }
});

// 获取入库单筛选选项
router.get('/inbound-orders/options', async (req, res) => {
  try {
    // 订单状态
    const orderStatus = [
      { value: 'Pending', label: '待审核' },
      { value: 'Completed', label: '已完成' },
      { value: 'Rejected', label: '已拒绝' }
    ];
    
    // 入库单号列表
    const [warehouseReceiptNos] = await executeQuery('SELECT InboundID as value, InboundNo as label FROM InboundOrder ORDER BY CreatedTime DESC LIMIT 100');
    
    // 来源单号（暂无）
    const sourceDocNos = [];
    
    // 商品名称列表
    const [materialNames] = await executeQuery(`
      SELECT DISTINCT i.ItemName as value, i.ItemName as label 
      FROM InboundOrderDetail d 
      JOIN Item i ON d.ItemID = i.ItemID 
      LIMIT 100
    `);
    
    // 商品编号列表
    const [materialNos] = await executeQuery(`
      SELECT DISTINCT i.ItemCode as value, i.ItemCode as label 
      FROM InboundOrderDetail d 
      JOIN Item i ON d.ItemID = i.ItemID 
      LIMIT 100
    `);
    
    // 批次号列表
    const [batchNos] = await executeQuery('SELECT DISTINCT BatchNo as value, BatchNo as label FROM InboundOrderDetail WHERE BatchNo IS NOT NULL LIMIT 100');
    
    // 仓库列表
    const warehouses = [
      { value: 'MAIN', label: '主仓库' },
      { value: 'RAW', label: '原料仓库' },
      { value: 'FINISHED', label: '成品仓库' }
    ];
    
    // 入库类型
    const warehouseTypes = [
      { value: 'PURCHASE', label: '采购入库' },
      { value: 'RETURN', label: '退货入库' },
      { value: 'TRANSFER', label: '调拨入库' }
    ];
    
    // 入库方式
    const warehouseMethods = [
      { value: 'MANUAL', label: '人工入库' },
      { value: 'AUTO', label: '自动入库' }
    ];
    
    // 供应商列表
    const [suppliers] = await executeQuery('SELECT PartnerID as value, PartnerName as label FROM Partner WHERE Status = 1 LIMIT 100');
    
    // 生产商列表
    const [manufacturers] = await executeQuery('SELECT PartnerID as value, PartnerName as label FROM Partner WHERE Status = 1 LIMIT 100');

    res.json(successResponse({
      orderStatus,
      warehouseReceiptNos,
      sourceDocNos,
      materialNames,
      materialNos,
      batchNos,
      warehouses,
      warehouseTypes,
      warehouseMethods,
      suppliers,
      manufacturers
    }));
  } catch (error) {
    res.status(500).json(errorResponse('获取筛选选项失败'));
  }
});

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

// 批量审核入库单
router.put('/inbound-orders/batch-audit', async (req, res) => {
  try {
    const { ids, status, reason } = req.body;
    const userId = req.user ? req.user.id : 1;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('请选择要审核的入库单'));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const inboundId of ids) {
        if (status === 'approved') {
          // 审核通过：增加库存
          await connection.execute('UPDATE InboundOrder SET Status=?, AuditBy=?, AuditTime=NOW(), Remark=? WHERE InboundID=?', ['Completed', userId, reason || '', inboundId]);

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
        } else {
          // 审核拒绝
          await connection.execute('UPDATE InboundOrder SET Status=?, AuditBy=?, AuditTime=NOW(), Remark=? WHERE InboundID=?', ['Rejected', userId, reason || '', inboundId]);
        }
      }

      await connection.commit();
      res.json(successResponse(null, `成功审核 ${ids.length} 条入库单`));
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json(errorResponse('批量审核失败'));
  }
});

// 撤销入库单（审核通过后可撤销，需扣减库存）
router.put('/inbound-orders/revoke', async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user ? req.user.id : 1;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('请选择要撤销的入库单'));
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const inboundId of ids) {
        // 查询入库单状态
        const [orders] = await connection.execute('SELECT Status FROM InboundOrder WHERE InboundID = ?', [inboundId]);
        if (orders.length === 0) continue;

        const currentStatus = orders[0].Status;
        
        if (currentStatus === 'Completed') {
          // 如果已审核通过，需要扣减库存
          const [details] = await connection.execute('SELECT * FROM InboundOrderDetail WHERE InboundID = ?', [inboundId]);
          
          for (const d of details) {
            const [inv] = await connection.execute('SELECT * FROM Inventory WHERE ItemID=? AND LocationID=?', [d.ItemID, d.LocationCode || 'DEFAULT']);
            if (inv.length > 0) {
              // 扣减库存
              const newCurrent = Math.max(0, inv[0].CurrentQuantity - d.Quantity);
              const newAvailable = Math.max(0, inv[0].AvailableQuantity - d.Quantity);
              await connection.execute(
                'UPDATE Inventory SET CurrentQuantity = ?, AvailableQuantity = ?, LastUpdatedTime = NOW() WHERE InventoryID = ?',
                [newCurrent, newAvailable, inv[0].InventoryID]
              );
              
              // 记录流水
              await connection.execute(
                'INSERT INTO InventoryTransaction (ItemID, TransactionType, Quantity, SourceDocumentNo, TransactionTime, OperatorID) VALUES (?, "INBOUND_REVOKE", ?, (SELECT InboundNo FROM InboundOrder WHERE InboundID=?), NOW(), ?)',
                [d.ItemID, -d.Quantity, inboundId, userId]
              );
            }
          }
        }

        // 更新状态为已撤销
        await connection.execute(
          'UPDATE InboundOrder SET Status = ?, AuditBy = NULL, AuditTime = NULL, Remark = CONCAT(IFNULL(Remark, ""), " [已撤销]") WHERE InboundID = ?',
          ['Pending', inboundId]
        );
      }

      await connection.commit();
      res.json(successResponse(null, `成功撤销 ${ids.length} 条入库单`));
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

// 获取入库单打印数据
router.get('/inbound-orders/:id/print', async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderSql = `
      SELECT o.*, p.PartnerName, p.PartnerCode 
      FROM InboundOrder o 
      LEFT JOIN Partner p ON o.PartnerID = p.PartnerID 
      WHERE o.InboundID = ?`;
    const orders = await executeQuery(orderSql, [orderId]);
    if (orders.length === 0) return res.status(404).json(errorResponse('未找到入库单'));

    const order = orders[0];

    const detailSql = `
      SELECT d.*, i.ItemCode, i.ItemName, i.Specification, i.Unit 
      FROM InboundOrderDetail d 
      JOIN Item i ON d.ItemID = i.ItemID 
      WHERE d.InboundID = ?`;
    const details = await executeQuery(detailSql, [orderId]);

    res.json(successResponse({
      warehouseReceiptNo: order.InboundNo,
      warehouseDate: order.CreatedTime,
      supplierName: order.PartnerName || '',
      manufacturerName: order.PartnerName || '',
      materialName: details[0]?.ItemName || '',
      materialNo: details[0]?.ItemCode || '',
      receivedQuantity: details.reduce((sum, d) => sum + (d.Quantity || 0), 0),
      receivedGrossWeight: order.Remark || '',
      receivedNetWeight: order.Remark || '',
      warehouse: order.OrderType || '',
      status: order.Status
    }));
  } catch (error) {
    res.status(500).json(errorResponse('获取打印数据失败'));
  }
});

// 导出入库单
router.get('/inbound-orders/export', async (req, res) => {
  try {
    const { status, startDate, endDate, keyword } = req.query;
    
    let sql = `
      SELECT o.InboundNo, o.OrderType, o.Status, o.CreatedTime, o.AuditTime, 
             p.PartnerName, u.FullName as CreatorName
      FROM InboundOrder o
      LEFT JOIN Partner p ON o.PartnerID = p.PartnerID
      LEFT JOIN User u ON o.CreatedBy = u.UserID
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ' AND o.Status = ?'; params.push(status); }
    if (startDate && endDate) {
      sql += ' AND o.CreatedTime BETWEEN ? AND ?';
      params.push(startDate, endDate + ' 23:59:59');
    }
    if (keyword) {
      sql += ' AND (o.InboundNo LIKE ? OR p.PartnerName LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY o.CreatedTime DESC LIMIT 1000';

    const items = await executeQuery(sql, params);

    // 创建 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('入库单');

    worksheet.columns = [
      { header: '入库单号', key: 'InboundNo', width: 20 },
      { header: '入库类型', key: 'OrderType', width: 15 },
      { header: '状态', key: 'Status', width: 10 },
      { header: '创建时间', key: 'CreatedTime', width: 20 },
      { header: '审核时间', key: 'AuditTime', width: 20 },
      { header: '供应商', key: 'PartnerName', width: 20 },
      { header: '创建人', key: 'CreatorName', width: 15 }
    ];

    items.forEach(item => {
      worksheet.add row({
        ...item,
        Status: item.Status === 'Completed' ? '已完成' : item.Status === 'Pending' ? '待审核' : '已拒绝'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=入库单导出.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json(errorResponse('导出失败'));
  }
});

module.exports = router;
