const express = require('express');
const mysql = require('mysql2/promise');
const ExcelJS = require('exceljs');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'wms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 入库管理控制器
const inboundController = {
  /**
   * 1. 获取筛选选项
   */
  async getFilterOptions(req, res) {
    try {
      const conn = await pool.getConnection();
      try {
        // 获取订单状态
        const orderStatus = [
          { value: "", label: "全部" },
          { value: "pending", label: "待审核" },
          { value: "approved", label: "已批准" },
          { value: "rejected", label: "已拒绝" }
        ];

        // 获取入库单号
        const [receipts] = await conn.query(
          'SELECT DISTINCT inboundNumber as value, inboundNumber as label FROM RawMaterialInbound ORDER BY inboundNumber DESC LIMIT 10'
        );

        // 获取原料信息
        const [materials] = await conn.query(
          'SELECT MaterialCode as value, MaterialName as label FROM RawMaterial WHERE Status = 1'
        );

        // 获取仓库信息
        const [warehouses] = await conn.query(
          'SELECT WarehouseCode as value, WarehouseName as label FROM Warehouse WHERE Status = 1'
        );

        // 获取供应商信息
        const [suppliers] = await conn.query(
          'SELECT SupplierCode as value, SupplierName as label FROM Supplier WHERE Status = 1'
        );

        const response = {
          orderStatus,
          warehouseReceiptNos: receipts,
          materialNos: materials,
          materialNames: materials.map(m => ({ value: m.value, label: m.label })),
          warehouses,
          suppliers,
          // 其他选项可以根据需要从数据库获取或硬编码
          warehouseTypes: [
            { value: "purchase", label: "采购入库" },
            { value: "return", label: "退货入库" },
            { value: "transfer", label: "调拨入库" }
          ],
          warehouseMethods: [
            { value: "normal", label: "普通入库" },
            { value: "urgent", label: "紧急入库" }
          ]
        };

        res.json(response);
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取筛选选项失败:', error);
      res.status(500).json({ message: '获取筛选选项失败' });
    }
  },

  /**
   * 2. 获取入库单列表
   */
  async getInboundOrders(req, res) {
    try {
      const conn = await pool.getConnection();
      try {
        const {
          page = 1,
          pageSize = 10,
          orderStatus,
          warehouseReceiptNo,
          materialNo,
          warehouse,
          supplier,
          startDate,
          endDate
        } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (orderStatus) {
          whereClause += ' AND rmi.Status = ?';
          params.push(orderStatus);
        }
        if (warehouseReceiptNo) {
          whereClause += ' AND rmi.InboundNumber LIKE ?';
          params.push(`%${warehouseReceiptNo}%`);
        }
        if (warehouse) {
          whereClause += ' AND w.WarehouseCode = ?';
          params.push(warehouse);
        }
        if (supplier) {
          whereClause += ' AND s.SupplierCode = ?';
          params.push(supplier);
        }
        if (startDate) {
          whereClause += ' AND rmi.InboundDate >= ?';
          params.push(startDate);
        }
        if (endDate) {
          whereClause += ' AND rmi.InboundDate <= ?';
          params.push(endDate);
        }

        // 查询总数
        const [totalResult] = await conn.query(
          `SELECT COUNT(DISTINCT rmi.InboundID) as total 
           FROM RawMaterialInbound rmi 
           LEFT JOIN Warehouse w ON rmi.WarehouseID = w.WarehouseID
           LEFT JOIN Supplier s ON rmi.SupplierID = s.SupplierID
           ${whereClause}`,
          params
        );

        // 查询列表数据
        const [list] = await conn.query(
          `SELECT 
             rmi.InboundID as id,
             rmi.InboundNumber as warehouseReceiptNo,
             SUM(rmid.Quantity) as receivedQuantity,
             s.SupplierName as supplierName,
             rmi.InboundDate as orderDate,
             rmi.Status as status
           FROM RawMaterialInbound rmi
           LEFT JOIN RawMaterialInboundDetail rmid ON rmi.InboundID = rmid.InboundID
           LEFT JOIN Warehouse w ON rmi.WarehouseID = w.WarehouseID
           LEFT JOIN Supplier s ON rmi.SupplierID = s.SupplierID
           ${whereClause}
           GROUP BY rmi.InboundID
           ORDER BY rmi.InboundDate DESC
           LIMIT ? OFFSET ?`,
          [...params, parseInt(pageSize), (page - 1) * pageSize]
        );

        res.json({
          list,
          total: totalResult[0].total
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取入库单列表失败:', error);
      res.status(500).json({ message: '获取入库单列表失败' });
    }
  },

  /**
   * 3. 导出入库单
   */
  async exportInboundOrders(req, res) {
    try {
      const conn = await pool.getConnection();
      try {
        // 查询数据（使用与获取列表相同的查询逻辑）
        const [list] = await conn.query(
          `SELECT 
             rmi.InboundNumber,
             s.SupplierName,
             w.WarehouseName,
             rmi.InboundDate,
             rmi.Status,
             rmid.Quantity,
             rm.MaterialName,
             rmid.BatchNumber,
             rmid.UnitPrice,
             rmid.Amount
           FROM RawMaterialInbound rmi
           LEFT JOIN RawMaterialInboundDetail rmid ON rmi.InboundID = rmid.InboundID
           LEFT JOIN RawMaterial rm ON rmid.RawMaterialID = rm.MaterialID
           LEFT JOIN Warehouse w ON rmi.WarehouseID = w.WarehouseID
           LEFT JOIN Supplier s ON rmi.SupplierID = s.SupplierID
           ORDER BY rmi.InboundDate DESC`
        );

        // 创建工作簿
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('入库单列表');

        // 设置表头
        worksheet.columns = [
          { header: '入库单号', key: 'InboundNumber', width: 20 },
          { header: '供应商', key: 'SupplierName', width: 20 },
          { header: '仓库', key: 'WarehouseName', width: 15 },
          { header: '入库日期', key: 'InboundDate', width: 20 },
          { header: '状态', key: 'Status', width: 10 },
          { header: '原料名称', key: 'MaterialName', width: 20 },
          { header: '数量', key: 'Quantity', width: 10 },
          { header: '批次号', key: 'BatchNumber', width: 15 },
          { header: '单价', key: 'UnitPrice', width: 10 },
          { header: '金额', key: 'Amount', width: 12 }
        ];

        // 添加数据行
        worksheet.addRows(list);

        // 设置响应头
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=入库单列表.xlsx'
        );

        // 发送文件
        await workbook.xlsx.write(res);
        res.end();
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('导出入库单失败:', error);
      res.status(500).json({ message: '导出入库单失败' });
    }
  },

  /**
   * 4. 审核入库单
   */
  async auditInboundOrders(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const { ids, status, reason } = req.body;
      const newStatus = status === 'approved' ? 'Completed' : 'Cancelled';

      // 更新入库单状态
      const [result] = await conn.query(
        'UPDATE RawMaterialInbound SET Status = ?, UpdatedAt = NOW() WHERE InboundID IN (?)',
        [newStatus, ids]
      );

      if (newStatus === 'Completed') {
        // 如果审核通过，更新库存
        for (const id of ids) {
          const [details] = await conn.query(
            'SELECT * FROM RawMaterialInboundDetail WHERE InboundID = ?',
            [id]
          );

          for (const detail of details) {
            // 更新或插入库存记录
            await conn.query(
              `INSERT INTO Inventory 
               (ItemType, ItemID, LocationID, BatchNumber, CurrentQuantity, 
                ProductionDate, ExpiryDate, LastInboundDate)
               VALUES ('RawMaterial', ?, ?, ?, ?, ?, ?, NOW())
               ON DUPLICATE KEY UPDATE
               CurrentQuantity = CurrentQuantity + ?,
               LastInboundDate = NOW()`,
              [
                detail.RawMaterialID,
                detail.LocationID || 'DEFAULT',
                detail.BatchNumber,
                detail.Quantity,
                detail.ProductionDate,
                detail.ExpiryDate,
                detail.Quantity
              ]
            );

            // 记录库存变动
            await conn.query(
              `INSERT INTO InventoryTransaction
               (InventoryID, TransactionType, ReferenceType, ReferenceID,
                QuantityBefore, QuantityChange, QuantityAfter, UnitCost,
                TransactionDate, OperatorUserID)
               SELECT 
                 i.InventoryID,
                 'Inbound',
                 'RawMaterialInbound',
                 ?,
                 i.CurrentQuantity - ?,
                 ?,
                 i.CurrentQuantity,
                 ?,
                 NOW(),
                 rmi.OperatorUserID
               FROM Inventory i
               JOIN RawMaterialInbound rmi ON rmi.InboundID = ?
               WHERE i.ItemType = 'RawMaterial'
               AND i.ItemID = ?
               AND i.LocationID = ?
               AND i.BatchNumber = ?`,
              [
                id,
                detail.Quantity,
                detail.Quantity,
                detail.UnitPrice,
                id,
                detail.RawMaterialID,
                detail.LocationID || 'DEFAULT',
                detail.BatchNumber
              ]
            );
          }
        }
      }

      await conn.commit();

      res.json({
        code: 200,
        message: status === 'approved' ? '审核通过' : '审核拒绝',
        data: {
          successCount: result.affectedRows,
          failCount: ids.length - result.affectedRows
        }
      });
    } catch (error) {
      await conn.rollback();
      console.error('审核入库单失败:', error);
      res.status(500).json({ message: '审核入库单失败' });
    } finally {
      conn.release();
    }
  },

  /**
   * 5. 撤销入库单
   */
  async revokeInboundOrders(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const { ids } = req.body;

      // 检查入库单状态
      const [orders] = await conn.query(
        'SELECT InboundID, Status FROM RawMaterialInbound WHERE InboundID IN (?)',
        [ids]
      );

      const invalidOrders = orders.filter(o => o.Status === 'Completed');
      if (invalidOrders.length > 0) {
        throw new Error('已完成的入库单不能撤销');
      }

      // 更新入库单状态
      const [result] = await conn.query(
        'UPDATE RawMaterialInbound SET Status = "Cancelled", UpdatedAt = NOW() WHERE InboundID IN (?)',
        [ids]
      );

      await conn.commit();

      res.json({
        code: 200,
        message: '撤销成功',
        data: {
          successCount: result.affectedRows,
          failCount: ids.length - result.affectedRows
        }
      });
    } catch (error) {
      await conn.rollback();
      console.error('撤销入库单失败:', error);
      res.status(500).json({ 
        code: 500,
        message: error.message || '撤销入库单失败'
      });
    } finally {
      conn.release();
    }
  },

  /**
   * 6. 获取打印数据
   */
  async getPrintData(req, res) {
    try {
      const conn = await pool.getConnection();
      try {
        const { id } = req.params;

        // 获取入库单信息
        const [inboundInfo] = await conn.query(
          `SELECT 
             rmi.InboundID as id,
             rmi.InboundNumber as warehouseReceiptNo,
             rmi.InboundDate as printTime,
             s.SupplierName,
             w.WarehouseName
           FROM RawMaterialInbound rmi
           LEFT JOIN Supplier s ON rmi.SupplierID = s.SupplierID
           LEFT JOIN Warehouse w ON rmi.WarehouseID = w.WarehouseID
           WHERE rmi.InboundID = ?`,
          [id]
        );

        if (inboundInfo.length === 0) {
          return res.status(404).json({ message: '入库单不存在' });
        }

        // 获取入库单明细
        const [details] = await conn.query(
          `SELECT 
             rm.MaterialName as materialName,
             rmid.Quantity as quantity,
             rm.Unit as unit,
             rmid.BatchNumber as batchNo
           FROM RawMaterialInboundDetail rmid
           LEFT JOIN RawMaterial rm ON rmid.RawMaterialID = rm.MaterialID
           WHERE rmid.InboundID = ?`,
          [id]
        );

        res.json({
          ...inboundInfo[0],
          details
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取打印数据失败:', error);
      res.status(500).json({ message: '获取打印数据失败' });
    }
  },

  /**
   * 7. 获取新建入库单选项
   */
  async getCreateOptions(req, res) {
    try {
      const conn = await pool.getConnection();
      try {
        // 获取仓库信息
        const [warehouses] = await conn.query(
          'SELECT WarehouseCode as value, WarehouseName as label FROM Warehouse WHERE Status = 1'
        );

        // 获取供应商信息
        const [suppliers] = await conn.query(
          'SELECT SupplierCode as value, SupplierName as label FROM Supplier WHERE Status = 1'
        );

        // 获取原料信息
        const [materials] = await conn.query(
          `SELECT 
             MaterialCode as materialNo,
             MaterialName as materialName,
             Specification as specification,
             Unit as unit
           FROM RawMaterial 
           WHERE Status = 1`
        );

        const response = {
          warehouseTypes: [
            { value: "purchase", label: "采购入库" },
            { value: "return", label: "退货入库" },
            { value: "transfer", label: "调拨入库" }
          ],
          warehouses,
          warehouseMethods: [
            { value: "normal", label: "普通入库" },
            { value: "urgent", label: "紧急入库" }
          ],
          suppliers,
          manufacturers: [
            { value: "MFG001", label: "生产商X" },
            { value: "MFG002", label: "生产商Y" }
          ],
          materials
        };

        res.json(response);
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取新建入库单选项失败:', error);
      res.status(500).json({ message: '获取新建入库单选项失败' });
    }
  },

  /**
   * 8. 创建入库单
   */
  async createInboundOrder(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const {
        warehouseReceiptNo,
        warehouseType,
        warehouse,
        warehouseMethod,
        supplier,
        manufacturer,
        remark,
        details
      } = req.body;

      // 插入入库单主表
      const [inboundResult] = await conn.query(
        `INSERT INTO RawMaterialInbound 
         (InboundNumber, SupplierID, WarehouseID, InboundDate, 
          OperatorUserID, Status, Remarks)
         VALUES (?, 
           (SELECT SupplierID FROM Supplier WHERE SupplierCode = ?),
           (SELECT WarehouseID FROM Warehouse WHERE WarehouseCode = ?),
           NOW(), 1, 'Draft', ?)`,
        [warehouseReceiptNo, supplier, warehouse, remark]
      );

      const inboundId = inboundResult.insertId;

      // 插入入库单明细
      for (const detail of details) {
        await conn.query(
          `INSERT INTO RawMaterialInboundDetail
           (InboundID, RawMaterialID, Quantity, BatchNumber)
           SELECT ?, MaterialID, ?, ?
           FROM RawMaterial
           WHERE MaterialCode = ?`,
          [inboundId, detail.expectedQuantity, detail.batchNo, detail.materialNo]
        );
      }

      await conn.commit();

      res.json({
        code: 200,
        message: '创建成功',
        data: {
          id: inboundId,
          warehouseReceiptNo,
          status: 'pending'
        }
      });
    } catch (error) {
      await conn.rollback();
      console.error('创建入库单失败:', error);
      res.status(500).json({ 
        code: 500,
        message: error.message || '创建入库单失败'
      });
    } finally {
      conn.release();
    }
  }
};

module.exports = inboundController;
