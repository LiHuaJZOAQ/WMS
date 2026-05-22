const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse, executeQuery, executeTransaction } = require('../utils');

// ====================================
// 波次拣货管理接口 (Smart Wave Picking API)
// ====================================

// 1. 获取所有波次列表
router.get('/waves', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    let sql = `
      SELECT w.*, u.FullName as CreatorName,
      (SELECT COUNT(*) FROM WaveDetail wd WHERE wd.WaveID = w.WaveID) as TotalOrders,
      (SELECT COUNT(*) FROM WaveDetail wd WHERE wd.WaveID = w.WaveID AND wd.Status = 'Picked') as PickedOrders
      FROM Wave w
      LEFT JOIN User u ON w.CreatedBy = u.UserID
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND w.Status = ?';
      params.push(status);
    }

    sql += ' ORDER BY w.CreatedTime DESC';

    // 分页
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    
    const countResult = await executeQuery(countSql, params);
    const total = countResult[0].total;

    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);

    const items = await executeQuery(sql, params);
    
    res.json(successResponse({ items, total }));
  } catch (error) {
    console.error('获取波次列表失败:', error);
    res.status(500).json(errorResponse('获取波次列表失败'));
  }
});

// 2. 智能推荐波次 (算法：将相同物料或相近库位的出库单合并)
router.post('/waves/recommend', async (req, res) => {
  try {
    // 找出所有状态为'approved'且尚未加入波次的原出库单
    const pendingSql = `
      SELECT o.OutboundID, o.OutboundNo, o.CreatedTime,
             d.ItemID, d.Quantity, m.ItemName as MaterialName, d.LocationCode
      FROM OutboundOrder o
      JOIN OutboundOrderDetail d ON o.OutboundID = d.OutboundID
      LEFT JOIN Item m ON d.ItemID = m.ItemID
      WHERE o.Status = 'approved' 
      AND o.OutboundID NOT IN (SELECT OutboundID FROM WaveDetail)
    `;
    
    const rawOrders = await executeQuery(pendingSql);
    
    if (rawOrders.length === 0) {
      return res.json(successResponse([], '当前没有待拣货的出库单可推荐'));
    }

    // 简单的波次聚合逻辑：按照库位的前缀（比如仓库区或排）或者包含相同原料来分组
    // 这里我们简单按照包含的物料种类重合度来做聚合（演示用途）
    const waves = [];
    const grouped = {};
    
    // 按单据进行归类
    const ordersMap = {};
    rawOrders.forEach(row => {
      if (!ordersMap[row.OutboundID]) {
        ordersMap[row.OutboundID] = {
          OutboundID: row.OutboundID,
          OutboundNo: row.OutboundNo,
          items: [],
          locations: new Set()
        };
      }
      ordersMap[row.OutboundID].items.push(row.MaterialName);
      if (row.LocationCode) ordersMap[row.OutboundID].locations.add(row.LocationCode);
    });

    // 模拟推荐：把所有剩余待处理的订单打包成一个建议波次
    const recommendedWave = {
      WaveName: '系统智能推荐波次 1',
      OutboundOrders: Object.values(ordersMap).map(o => ({
        OutboundID: o.OutboundID,
        OutboundNo: o.OutboundNo,
        ItemsCount: o.items.length,
        LocationsCount: o.locations.size
      }))
    };
    waves.push(recommendedWave);

    res.json(successResponse(waves, '推荐波次生成成功'));
  } catch (error) {
    console.error('智能推荐波次失败:', error);
    res.status(500).json(errorResponse('智能推荐波次失败'));
  }
});

// 3. 生成新波次
router.post('/waves', async (req, res) => {
  try {
    const { outboundIds, remark } = req.body;
    
    if (!outboundIds || outboundIds.length === 0) {
      return res.status(400).json(errorResponse('必须选择至少一个出库单'));
    }

    const userId = req.user ? req.user.id : 1; // 容错处理
    const waveNo = 'WV' + new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);

    const operations = [];
    
    // 1. 创建波次主表
    operations.push({
      sql: 'INSERT INTO Wave (WaveNo, Status, CreatedBy, Remark) VALUES (?, ?, ?, ?)',
      params: [waveNo, 'Pending', userId, remark || '']
    });

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [waveResult] = await connection.execute(operations[0].sql, operations[0].params);
      const waveId = waveResult.insertId;

      // 2. 插入波次明细
      for (const outId of outboundIds) {
        await connection.execute(
          'INSERT INTO WaveDetail (WaveID, OutboundID, Status) VALUES (?, ?, ?)',
          [waveId, outId, 'Pending']
        );
        // 3. 将原出库单状态更新为 Picking
        await connection.execute(
          'UPDATE OutboundOrder SET Status = ? WHERE OutboundID = ?',
          ['Picking', outId]
        );
      }

      await connection.commit();
      res.json(successResponse({ waveId, waveNo }, '波次生成成功'));
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('生成波次失败:', error);
    res.status(500).json(errorResponse('生成波次失败'));
  }
});

// 4. 获取波次拣货地图 (3D / 2D 路径所需数据)
router.get('/waves/:id/pick-map', async (req, res) => {
  try {
    const waveId = req.params.id;
    
    // 获取该波次下所有的待拣货库位和物料
    const sql = `
      SELECT d.LocationCode, m.ItemName as MaterialName, d.Quantity, o.OutboundNo
      FROM WaveDetail wd
      JOIN OutboundOrder o ON wd.OutboundID = o.OutboundID
      JOIN OutboundOrderDetail d ON o.OutboundID = d.OutboundID
      LEFT JOIN Item m ON d.ItemID = m.ItemID
      WHERE wd.WaveID = ? AND d.LocationCode IS NOT NULL
    `;
    const items = await executeQuery(sql, [waveId]);

    // 简单路径规划算法 (模拟 TSP，按排和列进行 S 型排序)
    // 假设库位格式为 LOC-A1-01
    items.sort((a, b) => {
      const codeA = a.LocationCode || '';
      const codeB = b.LocationCode || '';
      return codeA.localeCompare(codeB); // 简单的字母序排序即可模拟出一种顺序
    });

    // 聚合同一库位的任务
    const pathNodes = [];
    const locationMap = {};
    
    items.forEach(item => {
      if (!locationMap[item.LocationCode]) {
        locationMap[item.LocationCode] = {
          LocationCode: item.LocationCode,
          tasks: []
        };
        pathNodes.push(locationMap[item.LocationCode]);
      }
      locationMap[item.LocationCode].tasks.push({
        MaterialName: item.MaterialName,
        Quantity: item.Quantity,
        OutboundNo: item.OutboundNo
      });
    });

    res.json(successResponse(pathNodes, '拣货路径规划成功'));
  } catch (error) {
    console.error('获取拣货路径失败:', error);
    res.status(500).json(errorResponse('获取拣货路径失败'));
  }
});

// 5. 标记波次完成
router.put('/waves/:id/complete', async (req, res) => {
  try {
    const waveId = req.params.id;
    const userId = req.user ? req.user.id : 1;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 更新波次主表
      await connection.execute(
        'UPDATE Wave SET Status = ?, CompletedTime = NOW() WHERE WaveID = ?',
        ['Completed', waveId]
      );

      // 更新波次明细表
      await connection.execute(
        'UPDATE WaveDetail SET Status = ?, PickedTime = NOW() WHERE WaveID = ?',
        ['Picked', waveId]
      );

      // 找到所有关联的出库单并完成库存扣减
      const [waveDetails] = await connection.execute(
        'SELECT wd.OutboundID, od.ItemID, od.Quantity, od.LocationCode FROM WaveDetail wd JOIN OutboundOrderDetail od ON wd.OutboundID = od.OutboundID WHERE wd.WaveID = ?',
        [waveId]
      );
      
      for (const d of waveDetails) {
        // 1. 扣减 CurrentQuantity（最终库存）
        // 2. 扣减 ReservedQuantity（预留数量）
        // 3. 增加实际出库流水
        await connection.execute(
          'UPDATE Inventory SET CurrentQuantity = CurrentQuantity - ?, ReservedQuantity = ReservedQuantity - ?, LastUpdatedTime = NOW() WHERE ItemID = ? AND LocationID = ?',
          [d.Quantity, d.Quantity, d.ItemID, d.LocationCode || 'DEFAULT']
        );
        
        // 记录库存流水（出库）
        await connection.execute(
          'INSERT INTO InventoryTransaction (ItemID, TransactionType, Quantity, SourceDocumentNo, TransactionTime, OperatorID) VALUES (?, "WAVE_PICK", ?, (SELECT OutboundNo FROM OutboundOrder WHERE OutboundID=?), NOW(), ?)',
          [d.ItemID, -d.Quantity, d.OutboundID, userId]
        );
        
        // 标记出库单完成
        await connection.execute(
          'UPDATE OutboundOrder SET Status = ? WHERE OutboundID = ?',
          ['Completed', d.OutboundID]
        );
      }

      await connection.commit();
      res.json(successResponse(null, '波次拣货完成，库存已扣减'));
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('完成波次失败:', error);
    res.status(500).json(errorResponse('完成波次失败'));
  }
});

module.exports = router;
