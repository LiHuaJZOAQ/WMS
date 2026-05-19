const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');


// ====================================
// 盘点管理接口
// ====================================


router.get('/stocktaking', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, stocktakingNo, type, status, itemType } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (stocktakingNo) {
      whereConditions.push('s.StocktakingNumber LIKE ?');
      queryParams.push(`%${stocktakingNo}%`);
    }
    if (type) {
      whereConditions.push('s.StocktakingType = ?');
      queryParams.push(type);
    }
    if (status) {
      whereConditions.push('s.Status = ?');
      queryParams.push(status);
    }
    if (itemType) {
      whereConditions.push('EXISTS (SELECT 1 FROM StocktakingDetail sd WHERE sd.StocktakingID = s.StocktakingID AND sd.ItemType = ?)');
      queryParams.push(itemType);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = `SELECT COUNT(*) as total FROM Stocktaking s ${whereClause}`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const sql = `
      SELECT 
        s.StocktakingID as id, s.StocktakingNumber as stocktakingNo, s.StocktakingType as type,
        s.StocktakingDate as stocktakingDate, s.Status as status, s.Remarks as remarks,
        u.Username as operatorName, w.WarehouseName as warehouseName
      FROM Stocktaking s
      LEFT JOIN User u ON s.OperatorUserID = u.UserID
      LEFT JOIN Warehouse w ON s.WarehouseID = w.WarehouseID
      ${whereClause} ORDER BY s.StocktakingDate DESC, s.StocktakingID DESC LIMIT ? OFFSET ?
    `;

    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    const formattedResults = results.map(item => ({
      ...item, stocktakingDate: formatDateTime(item.stocktakingDate)
    }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取盘点列表失败'));
  }
});

router.get('/stocktaking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        s.StocktakingID as id, s.StocktakingNumber as stocktakingNo, s.StocktakingType as type,
        s.StocktakingDate as stocktakingDate, s.Status as status, s.Remarks as remarks,
        u.Username as operatorName, w.WarehouseName as warehouseName
      FROM Stocktaking s
      LEFT JOIN User u ON s.OperatorUserID = u.UserID
      LEFT JOIN Warehouse w ON s.WarehouseID = w.WarehouseID
      WHERE s.StocktakingID = ?
    `;
    const result = await executeQuery(sql, [id]);
    if (result.length === 0) return res.status(404).json(errorResponse('盘点单不存在', 404));

    const detailsSql = `
      SELECT 
        sd.DetailID as id, sd.ItemType as itemType, sd.ItemID as itemId,
        sd.SystemQuantity as systemQuantity, sd.ActualQuantity as actualQuantity, sd.DifferenceQuantity as difference,
        l.LocationCode as locationCode, sd.BatchNumber as batchNo, sd.Remarks as remarks,
        i.ItemName as itemName,
        i.ItemCode as itemCode
      FROM StocktakingDetail sd
      LEFT JOIN Location l ON sd.LocationID = l.LocationID
      LEFT JOIN Item i ON sd.ItemID = i.ItemID
      WHERE sd.StocktakingID = ?
    `;
    const details = await executeQuery(detailsSql, [id]);

    const data = {
      ...result[0],
      stocktakingDate: formatDateTime(result[0].stocktakingDate),
      details: details.map(d => ({ 
        ...d, 
        systemQuantity: parseFloat(d.systemQuantity),
        actualQuantity: parseFloat(d.actualQuantity),
        difference: parseFloat(d.difference)
      }))
    };

    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse('获取盘点详情失败'));
  }
});

router.put('/stocktaking/:id/audit', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const checkSql = 'SELECT * FROM Stocktaking WHERE StocktakingID = ?';
    const checkResult = await executeQuery(checkSql, [id]);
    if (checkResult.length === 0) return res.status(404).json(errorResponse('盘点单不存在', 404));

    const stocktaking = checkResult[0];
    if (stocktaking.Status !== 'Pending' && stocktaking.Status !== 'Processing') {
      return res.status(400).json(errorResponse('只有待处理或处理中的盘点单才能审核', 400));
    }

    if (action === 'reject') {
      await executeQuery(
        'UPDATE Stocktaking SET Status = ?, Remarks = ? WHERE StocktakingID = ?',
        ['Rejected', stocktaking.Remarks + (reason ? ` [驳回原因: ${reason}]` : ''), id]
      );
      return res.json(successResponse(null, '盘点单已驳回'));
    }

    if (action === 'approve') {
      const details = await executeQuery('SELECT * FROM StocktakingDetail WHERE StocktakingID = ?', [id]);
      
      for (const item of details) {
        if (parseFloat(item.DifferenceQuantity) !== 0) {
          // 更新库存
          const inventoryCheck = await executeQuery(
            `SELECT * FROM Inventory WHERE ItemID = ? AND LocationID = ?`,
            [item.ItemID, item.LocationID]
          );

          if (inventoryCheck.length > 0) {
            const invId = inventoryCheck[0].InventoryID;
            const newQty = parseFloat(item.ActualQuantity);
            await executeQuery(
              'UPDATE Inventory SET CurrentQuantity = ?, AvailableQuantity = ? WHERE InventoryID = ?',
              [newQty, newQty, invId]
            );

            // 记录流水
            await executeQuery(
              `INSERT INTO InventoryTransaction 
              (InventoryID, TransactionType, ReferenceType, ReferenceID, Quantity, RemainingQuantity, OperatorUserID, TransactionDate)
              VALUES (?, 'Stocktaking', 'Stocktaking', ?, ?, ?, ?, NOW())`,
              [invId, id, parseFloat(item.DifferenceQuantity), newQty, req.user.id]
            );
          } else if (parseFloat(item.ActualQuantity) > 0) {
            // 没有库存但盘点出来有数量 (盘盈)
            const insertInv = await executeQuery(
              `INSERT INTO Inventory (${invField}, WarehouseID, LocationID, CurrentQuantity, AvailableQuantity)
               VALUES (?, ?, ?, ?, ?)`,
              [item.ItemID, stocktaking.WarehouseID, item.LocationID, item.ActualQuantity, item.ActualQuantity]
            );
            const invId = insertInv.insertId;

            await executeQuery(
              `INSERT INTO InventoryTransaction 
              (InventoryID, TransactionType, ReferenceType, ReferenceID, Quantity, RemainingQuantity, OperatorUserID, TransactionDate)
              VALUES (?, 'Stocktaking', 'Stocktaking', ?, ?, ?, ?, NOW())`,
              [invId, id, item.ActualQuantity, item.ActualQuantity, req.user.id]
            );
          }
        }
      }

      await executeQuery('UPDATE Stocktaking SET Status = ?, UpdatedAt = NOW() WHERE StocktakingID = ?', ['Completed', id]);
      return res.json(successResponse(null, '盘点审核通过，库存已更新'));
    }
    res.status(400).json(errorResponse('无效的审核操作'));
  } catch (error) {
    res.status(500).json(errorResponse('审核失败'));
  }
});

router.delete('/stocktaking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const checkResult = await executeQuery('SELECT Status FROM Stocktaking WHERE StocktakingID = ?', [id]);
    if (checkResult.length === 0) return res.status(404).json(errorResponse('不存在', 404));
    if (checkResult[0].Status === 'Completed') return res.status(400).json(errorResponse('已完成的无法删除', 400));

    await executeQuery('DELETE FROM Stocktaking WHERE StocktakingID = ?', [id]);
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除失败'));
  }
});

// 1. 获取库位列表（重写版本）
router.get('/locations/list',  async (req, res) => {
  try {
    console.log('获取库位列表 - 参数:', req.query);
    
    const {
      page = 1,
      pageSize = 20,
      locationCode,
      locationName,
      warehouseId,
      locationType,
      occupancyStatus
    } = req.query;

    // 参数验证
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    if (pageNum < 1 || size < 1 || size > 1000) {
      return res.status(400).json(errorResponse('分页参数无效', 400));
    }

    // 构建查询条件
    let whereConditions = ['l.Status = 1']; // 只显示启用的库位
    let queryParams = [];

    // 库位编号搜索
    if (locationCode && locationCode.trim()) {
      whereConditions.push('l.LocationID LIKE ?');
      queryParams.push(`%${locationCode.trim()}%`);
    }

    // 库位名称搜索
    if (locationName && locationName.trim()) {
      whereConditions.push('l.LocationName LIKE ?');
      queryParams.push(`%${locationName.trim()}%`);
    }

    // 仓库筛选
    if (warehouseId && warehouseId.trim()) {
      whereConditions.push('l.WarehouseID = ?');
      queryParams.push(warehouseId.trim());
    }

    // 库位类型筛选
    if (locationType && locationType.trim()) {
      whereConditions.push('l.LocationType = ?');
      queryParams.push(locationType.trim());
    }

    // 使用状态筛选
    if (occupancyStatus && occupancyStatus.trim()) {
      switch (occupancyStatus) {
        case 'empty':
          whereConditions.push('l.CurrentOccupancy = 0');
          break;
        case 'partial':
          whereConditions.push('l.CurrentOccupancy > 0 AND l.CurrentOccupancy < l.Capacity');
          break;
        case 'full':
          whereConditions.push('l.CurrentOccupancy >= l.Capacity');
          break;
        case 'overload':
          whereConditions.push('l.CurrentOccupancy > l.Capacity');
          break;
      }
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询总记录数
    const countSql = `
      SELECT COUNT(*) as total
      FROM Location l
      LEFT JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
      WHERE ${whereClause}
    `;

    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0]?.total || 0;

    // 查询列表数据
    const offset = (pageNum - 1) * size;
    const listSql = `
      SELECT 
        l.LocationID as locationCode,
        l.LocationName as locationName,
        l.WarehouseID as warehouseId,
        w.WarehouseName as warehouseName,
        l.LocationType as locationType,
        l.Zone as zone,
        l.Row as row,
        l.Col as col,
        l.Level as level,
        l.Capacity as capacity,
        l.CurrentOccupancy as currentOccupancy,
        l.IsOccupied as isOccupied,
        l.Status as status,
        l.CreatedAt,
        l.UpdatedAt
      FROM Location l
      LEFT JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
      WHERE ${whereClause}
      ORDER BY l.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;

    const listParams = [...queryParams, size, offset];
    const listResult = await executeQuery(listSql, listParams);

    // 获取每个库位的原料信息
    const locationCodes = listResult.map(item => item.locationCode);
    let materialInfoMap = {};

    if (locationCodes.length > 0) {
      const materialSql = `
        SELECT 
          i.LocationID,
          rm.MaterialCode as materialCode,
          rm.MaterialName as materialName,
          rm.Unit as unit,
          i.CurrentQuantity as quantity,
          i.BatchNumber as batchNumber
        FROM Inventory i
        JOIN RawMaterial rm ON i.ItemID = rm.MaterialID
        WHERE i.ItemType = 'RawMaterial' 
          AND i.LocationID IN (${locationCodes.map(() => '?').join(',')})
          AND i.CurrentQuantity > 0
        ORDER BY i.LocationID, rm.MaterialName
      `;

      const materialResult = await executeQuery(materialSql, locationCodes);
      
      // 按库位分组原料信息
      materialResult.forEach(item => {
        if (!materialInfoMap[item.LocationID]) {
          materialInfoMap[item.LocationID] = [];
        }
        materialInfoMap[item.LocationID].push({
          materialCode: item.materialCode,
          materialName: item.materialName,
          unit: item.unit,
          quantity: parseFloat(item.quantity) || 0,
          batchNumber: item.batchNumber
        });
      });
    }

    // 格式化返回数据
    const list = listResult.map(item => ({
      ...item,
      capacity: parseFloat(item.capacity) || 0,
      currentOccupancy: parseFloat(item.currentOccupancy) || 0,
      CreatedAt: formatDateTime(item.CreatedAt),
      UpdatedAt: formatDateTime(item.UpdatedAt),
      materialInfo: materialInfoMap[item.locationCode] || []
    }));

    const response = {
      list: list,
      total: total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };

    console.log(`获取库位列表 - 成功, 共${total}条记录`);
    res.json(response);

  } catch (error) {
    console.error('获取库位列表失败:', error);
    res.status(500).json(errorResponse('获取库位列表失败'));
  }
});

// 2. 获取库位详情
router.get('/locations/:locationCode',  async (req, res) => {
  try {
    const { locationCode } = req.params;
    console.log(`获取库位详情 - 库位编号: ${locationCode}`);

    if (!locationCode) {
      return res.status(400).json(errorResponse('库位编号不能为空', 400));
    }

    // 获取库位基本信息
    const locationSql = `
      SELECT 
        l.LocationID as locationCode,
        l.LocationName as locationName,
        l.WarehouseID as warehouseId,
        w.WarehouseName as warehouseName,
        l.LocationType as locationType,
        l.Zone as zone,
        l.Row as row,
        l.Col as col,
        l.Level as level,
        l.Capacity as capacity,
        l.CurrentOccupancy as currentOccupancy,
        l.IsOccupied as isOccupied,
        l.Status as status,
        l.CreatedAt,
        l.UpdatedAt
      FROM Location l
      LEFT JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
      WHERE l.LocationID = ?
    `;

    const locationResult = await executeQuery(locationSql, [locationCode]);

    if (locationResult.length === 0) {
      return res.status(404).json(errorResponse('库位不存在', 404));
    }

    // 获取库存明细信息
    const inventorySql = `
      SELECT 
        i.InventoryID,
        rm.MaterialCode as materialCode,
        rm.MaterialName as materialName,
        rm.Specification as specification,
        rm.Unit as unit,
        i.BatchNumber as batchNumber,
        i.CurrentQuantity as currentQuantity,
        i.AvailableQuantity as availableQuantity,
        i.ReservedQuantity as reservedQuantity,
        i.LastInboundDate as lastInboundDate,
        i.LastOutboundDate as lastOutboundDate
      FROM Inventory i
      JOIN RawMaterial rm ON i.ItemID = rm.MaterialID
      WHERE i.ItemType = 'RawMaterial' 
        AND i.LocationID = ?
        AND i.CurrentQuantity > 0
      ORDER BY rm.MaterialName
    `;

    const inventoryResult = await executeQuery(inventorySql, [locationCode]);

    const location = locationResult[0];
    const detail = {
      ...location,
      capacity: parseFloat(location.capacity) || 0,
      currentOccupancy: parseFloat(location.currentOccupancy) || 0,
      CreatedAt: formatDateTime(location.CreatedAt),
      UpdatedAt: formatDateTime(location.UpdatedAt),
      inventoryDetails: inventoryResult.map(item => ({
        ...item,
        currentQuantity: parseFloat(item.currentQuantity) || 0,
        availableQuantity: parseFloat(item.availableQuantity) || 0,
        reservedQuantity: parseFloat(item.reservedQuantity) || 0,
        lastInboundDate: item.lastInboundDate ? formatDateTime(item.lastInboundDate) : null,
        lastOutboundDate: item.lastOutboundDate ? formatDateTime(item.lastOutboundDate) : null
      }))
    };

    console.log(`获取库位详情 - 成功: ${location.locationName}`);
    res.json(successResponse(detail));

  } catch (error) {
    console.error('获取库位详情失败:', error);
    res.status(500).json(errorResponse('获取库位详情失败'));
  }
});

// 3. 新增库位
router.post('/locations',  async (req, res) => {
  try {
    console.log('新增库位 - 参数:', req.body);
    
    const {
      locationCode,
      locationName,
      warehouseId,
      locationType = 'Raw',
      zone,
      row,
      col,
      level,
      capacity = 1000,
      status = 1
    } = req.body;

    // 参数验证
    const validation = validateRequired({ locationCode, locationName, warehouseId }, 
      ['locationCode', 'locationName', 'warehouseId']);
    if (validation) {
      return res.status(400).json(errorResponse(validation, 400));
    }

    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json(errorResponse('容量必须大于0', 400));
    }

    // 检查库位编号是否已存在
    const existsResult = await executeQuery(
      'SELECT COUNT(*) as count FROM Location WHERE LocationID = ?',
      [locationCode]
    );

    if (existsResult[0].count > 0) {
      return res.status(400).json(errorResponse('库位编号已存在', 400));
    }

    // 检查仓库是否存在
    const warehouseCheck = await executeQuery(
      'SELECT WarehouseID FROM Warehouse WHERE WarehouseID = ? AND Status = 1',
      [warehouseId]
    );

    if (warehouseCheck.length === 0) {
      return res.status(400).json(errorResponse('仓库不存在或已禁用', 400));
    }

    // 插入库位记录
    await executeQuery(
      `INSERT INTO Location 
       (LocationID, WarehouseID, LocationName, LocationType, Zone, Row, Col, Level, 
        Capacity, CurrentOccupancy, IsOccupied, Status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      [locationCode, warehouseId, locationName, locationType, zone || '', 
       row || '', col || '', level || '', capacity, status]
    );

    const result = {
      locationCode,
      locationName,
      warehouseId,
      locationType,
      capacity: parseFloat(capacity)
    };

    console.log('新增库位 - 成功:', result);
    res.status(201).json(successResponse(result, '库位新增成功'));

  } catch (error) {
    console.error('新增库位失败:', error);
    res.status(500).json(errorResponse(error.message || '新增库位失败'));
  }
});

// 4. 更新库位
router.put('/locations/:locationCode',  async (req, res) => {
  try {
    const { locationCode } = req.params;
    console.log(`更新库位 - 库位编号: ${locationCode}`, req.body);

    if (!locationCode) {
      return res.status(400).json(errorResponse('库位编号不能为空', 400));
    }

    const {
      locationName,
      warehouseId,
      locationType,
      zone,
      row,
      col,
      level,
      capacity,
      status
    } = req.body;

    // 参数验证
    const validation = validateRequired({ locationName, warehouseId }, 
      ['locationName', 'warehouseId']);
    if (validation) {
      return res.status(400).json(errorResponse(validation, 400));
    }

    if (capacity !== undefined && (isNaN(capacity) || capacity <= 0)) {
      return res.status(400).json(errorResponse('容量必须大于0', 400));
    }

    // 检查库位是否存在
    const existsResult = await executeQuery(
      'SELECT LocationID FROM Location WHERE LocationID = ?',
      [locationCode]
    );

    if (existsResult.length === 0) {
      return res.status(404).json(errorResponse('库位不存在', 404));
    }

    // 更新库位信息
    await executeQuery(
      `UPDATE Location 
       SET LocationName = ?, WarehouseID = ?, LocationType = ?, 
           Zone = ?, Row = ?, Col = ?, Level = ?, Capacity = ?, Status = ?, 
           UpdatedAt = CURRENT_TIMESTAMP
       WHERE LocationID = ?`,
      [locationName, warehouseId, locationType || 'Raw', zone || '', 
       row || '', col || '', level || '', capacity || 1000, status || 1, locationCode]
    );

    const result = {
      locationCode,
      locationName,
      warehouseId,
      locationType,
      capacity: parseFloat(capacity) || 1000
    };

    console.log('更新库位 - 成功:', result);
    res.json(successResponse(result, '库位更新成功'));

  } catch (error) {
    console.error('更新库位失败:', error);
    res.status(500).json(errorResponse(error.message || '更新库位失败'));
  }
});

// 5. 删除库位
router.delete('/locations/:locationCode',  async (req, res) => {
  try {
    const { locationCode } = req.params;
    console.log(`删除库位 - 库位编号: ${locationCode}`);

    if (!locationCode) {
      return res.status(400).json(errorResponse('库位编号不能为空', 400));
    }

    // 检查库位是否存在
    const existsResult = await executeQuery(
      'SELECT LocationID, CurrentOccupancy FROM Location WHERE LocationID = ?',
      [locationCode]
    );

    if (existsResult.length === 0) {
      return res.status(404).json(errorResponse('库位不存在', 404));
    }

    // 检查库位是否有库存
    if (parseFloat(existsResult[0].CurrentOccupancy) > 0) {
      return res.status(400).json(errorResponse('库位仍有库存，无法删除', 400));
    }

    // 检查是否有库存记录
    const inventoryCheck = await executeQuery(
      'SELECT COUNT(*) as count FROM Inventory WHERE LocationID = ? AND CurrentQuantity > 0',
      [locationCode]
    );

    if (inventoryCheck[0].count > 0) {
      return res.status(400).json(errorResponse('库位仍有库存记录，无法删除', 400));
    }

    // 删除库位（软删除，设置状态为禁用）
    await executeQuery(
      'UPDATE Location SET Status = 0, UpdatedAt = CURRENT_TIMESTAMP WHERE LocationID = ?',
      [locationCode]
    );

    console.log(`删除库位 - 成功: ${locationCode}`);
    res.json(successResponse(null, '库位删除成功'));

  } catch (error) {
    console.error('删除库位失败:', error);
    res.status(500).json(errorResponse('删除库位失败'));
  }
});

// 6. 批量删除库位
router.delete('/locations/batch-delete',  async (req, res) => {
  try {
    const { locationCodes } = req.body;
    console.log('批量删除库位 - 库位编号:', locationCodes);

    if (!locationCodes || !Array.isArray(locationCodes) || locationCodes.length === 0) {
      return res.status(400).json(errorResponse('请选择要删除的库位', 400));
    }

    let successCount = 0;
    let failCount = 0;
    const failDetails = [];

    for (const locationCode of locationCodes) {
      try {
        // 检查库位是否存在和是否有库存
        const checkResult = await executeQuery(
          `SELECT l.LocationID, l.CurrentOccupancy,
                  COALESCE(SUM(i.CurrentQuantity), 0) as totalInventory
           FROM Location l
           LEFT JOIN Inventory i ON l.LocationID = i.LocationID AND i.CurrentQuantity > 0
           WHERE l.LocationID = ?
           GROUP BY l.LocationID, l.CurrentOccupancy`,
          [locationCode]
        );

        if (checkResult.length === 0) {
          failCount++;
          failDetails.push(`库位 ${locationCode} 不存在`);
          continue;
        }

        if (parseFloat(checkResult[0].CurrentOccupancy) > 0 || parseFloat(checkResult[0].totalInventory) > 0) {
          failCount++;
          failDetails.push(`库位 ${locationCode} 仍有库存，无法删除`);
          continue;
        }

        // 删除库位
        await executeQuery(
          'UPDATE Location SET Status = 0, UpdatedAt = CURRENT_TIMESTAMP WHERE LocationID = ?',
          [locationCode]
        );
        successCount++;

      } catch (error) {
        failCount++;
        failDetails.push(`库位 ${locationCode} 删除失败: ${error.message}`);
      }
    }

    const result = {
      successCount,
      failCount,
      details: failDetails
    };

    const message = `批量删除完成: 成功${successCount}个，失败${failCount}个`;
    console.log('批量删除库位 - 完成:', result);
    
    res.json(successResponse(result, message));

  } catch (error) {
    console.error('批量删除库位失败:', error);
    res.status(500).json(errorResponse('批量删除库位失败'));
  }
});

// 7. 更新库位状态
router.put('/locations/:locationCode/status',  async (req, res) => {
  try {
    const { locationCode } = req.params;
    const { status } = req.body;
    console.log(`更新库位状态 - 库位编号: ${locationCode}, 状态: ${status}`);

    if (!locationCode) {
      return res.status(400).json(errorResponse('库位编号不能为空', 400));
    }

    if (status !== 0 && status !== 1) {
      return res.status(400).json(errorResponse('状态值无效', 400));
    }

    // 检查库位是否存在
    const existsResult = await executeQuery(
      'SELECT LocationID FROM Location WHERE LocationID = ?',
      [locationCode]
    );

    if (existsResult.length === 0) {
      return res.status(404).json(errorResponse('库位不存在', 404));
    }

    // 更新状态
    await executeQuery(
      'UPDATE Location SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE LocationID = ?',
      [status, locationCode]
    );

    console.log(`更新库位状态 - 成功: ${locationCode}`);
    res.json(successResponse({ locationCode, status }, '状态更新成功'));

  } catch (error) {
    console.error('更新库位状态失败:', error);
    res.status(500).json(errorResponse('更新库位状态失败'));
  }
});

// 8. 获取仓库选项
router.get('/warehouses/options',  async (req, res) => {
  try {
    console.log('获取仓库选项');

    const warehouseSql = `
      SELECT 
        WarehouseID as id,
        WarehouseName as name,
        WarehouseCode as code
      FROM Warehouse 
      WHERE Status = 1 
      ORDER BY WarehouseName
    `;

    const warehouseResult = await executeQuery(warehouseSql);

    console.log(`获取仓库选项 - 成功, 共${warehouseResult.length}条记录`);
    res.json(successResponse(warehouseResult));

  } catch (error) {
    console.error('获取仓库选项失败:', error);
    res.status(500).json(errorResponse('获取仓库选项失败'));
  }
});

// 9. 导出库位数据
router.get('/locations/export',  async (req, res) => {
  try {
    console.log('导出库位数据 - 开始');
    
    const {
      locationCode,
      locationName,
      warehouseId,
      locationType,
      occupancyStatus
    } = req.query;

    // 构建查询条件（复用列表接口逻辑）
    let whereConditions = ['l.Status = 1'];
    let queryParams = [];

    if (locationCode?.trim()) {
      whereConditions.push('l.LocationID LIKE ?');
      queryParams.push(`%${locationCode.trim()}%`);
    }

    if (locationName?.trim()) {
      whereConditions.push('l.LocationName LIKE ?');
      queryParams.push(`%${locationName.trim()}%`);
    }

    if (warehouseId?.trim()) {
      whereConditions.push('l.WarehouseID = ?');
      queryParams.push(warehouseId.trim());
    }

    if (locationType?.trim()) {
      whereConditions.push('l.LocationType = ?');
      queryParams.push(locationType.trim());
    }

    if (occupancyStatus?.trim()) {
      switch (occupancyStatus) {
        case 'empty':
          whereConditions.push('l.CurrentOccupancy = 0');
          break;
        case 'partial':
          whereConditions.push('l.CurrentOccupancy > 0 AND l.CurrentOccupancy < l.Capacity');
          break;
        case 'full':
          whereConditions.push('l.CurrentOccupancy >= l.Capacity');
          break;
        case 'overload':
          whereConditions.push('l.CurrentOccupancy > l.Capacity');
          break;
      }
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询导出数据
    const exportSql = `
      SELECT 
        l.LocationID as '库位编号',
        l.LocationName as '库位名称',
        w.WarehouseName as '所属仓库',
        CASE l.LocationType 
          WHEN 'Raw' THEN '原材料'
          WHEN 'Finished' THEN '成品'
          WHEN 'Normal' THEN '普通'
          ELSE l.LocationType
        END as '库位类型',
        CONCAT_WS('-', 
          NULLIF(l.Zone, ''), 
          NULLIF(l.Row, ''), 
          NULLIF(l.Col, ''), 
          NULLIF(l.Level, '')
        ) as '位置信息',
        l.Capacity as '容量',
        l.CurrentOccupancy as '当前占用',
        ROUND(l.CurrentOccupancy / l.Capacity * 100, 2) as '利用率(%)',
        CASE 
          WHEN l.Status = 1 THEN '启用'
          ELSE '禁用'
        END as '状态',
        l.CreatedAt as '创建时间',
        l.UpdatedAt as '更新时间'
      FROM Location l
      LEFT JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
      WHERE ${whereClause}
      ORDER BY l.CreatedAt DESC
      LIMIT 10000
    `;

    const exportData = await executeQuery(exportSql, queryParams);

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('库位列表');

    // 设置工作表属性
    workbook.creator = '水杯WMS系统';
    workbook.lastModifiedBy = '系统';
    workbook.created = new Date();

    if (exportData.length > 0) {
      // 获取列标题
      const headers = Object.keys(exportData[0]);
      
      // 添加标题行
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // 添加数据行
      exportData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // 格式化日期和数值
          if (header.includes('时间')) {
            return value ? formatDateTime(value) : '';
          }
          if (header.includes('容量') || header.includes('占用')) {
            return parseFloat(value) || 0;
          }
          return value;
        });
        worksheet.addRow(values);
      });

      // 自动调整列宽
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
    } else {
      // 没有数据时添加提示
      worksheet.addRow(['暂无数据']);
    }

    // 设置响应头
    const fileName = `库位列表_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // 输出Excel文件
    await workbook.xlsx.write(res);
    res.end();

    console.log(`导出库位数据 - 成功, 导出${exportData.length}条记录`);

  } catch (error) {
    console.error('导出库位数据失败:', error);
    if (!res.headersSent) {
      res.status(500).json(errorResponse('导出库位数据失败'));
    }
  }
});

// 10. 获取库位统计数据
router.get('/locations/statistics',  async (req, res) => {
  try {
    console.log('获取库位统计数据');

    // 并行查询统计数据
    const [
      overviewStats,
      typeStats,
      warehouseStats,
      utilizationStats
    ] = await Promise.all([
      // 总体统计
      executeQuery(`
        SELECT 
          COUNT(*) as totalLocations,
          COUNT(CASE WHEN Status = 1 THEN 1 END) as activeLocations,
          COUNT(CASE WHEN IsOccupied = 1 THEN 1 END) as occupiedLocations,
          COUNT(CASE WHEN CurrentOccupancy = 0 THEN 1 END) as emptyLocations,
          COUNT(CASE WHEN CurrentOccupancy > Capacity THEN 1 END) as overloadLocations,
          ROUND(AVG(CurrentOccupancy / Capacity * 100), 2) as avgUtilization
        FROM Location 
        WHERE Status = 1
      `),
      
      // 按类型统计
      executeQuery(`
        SELECT 
          LocationType,
          COUNT(*) as count,
          COUNT(CASE WHEN IsOccupied = 1 THEN 1 END) as occupiedCount,
          ROUND(AVG(CurrentOccupancy / Capacity * 100), 2) as avgUtilization
        FROM Location 
        WHERE Status = 1
        GROUP BY LocationType
        ORDER BY count DESC
      `),
      
      // 按仓库统计
      executeQuery(`
        SELECT 
          w.WarehouseName,
          COUNT(l.LocationID) as totalLocations,
          COUNT(CASE WHEN l.IsOccupied = 1 THEN 1 END) as occupiedLocations,
          ROUND(AVG(l.CurrentOccupancy / l.Capacity * 100), 2) as avgUtilization,
          SUM(l.CurrentOccupancy) as totalOccupancy,
          SUM(l.Capacity) as totalCapacity
        FROM Location l
        JOIN Warehouse w ON l.WarehouseID = w.WarehouseID
        WHERE l.Status = 1 AND w.Status = 1
        GROUP BY w.WarehouseID, w.WarehouseName
        ORDER BY totalLocations DESC
      `),
      
      // 利用率分布统计
      executeQuery(`
        SELECT 
          CASE 
            WHEN CurrentOccupancy = 0 THEN '空闲'
            WHEN CurrentOccupancy / Capacity <= 0.3 THEN '低利用率(≤30%)'
            WHEN CurrentOccupancy / Capacity <= 0.6 THEN '中等利用率(31-60%)'
            WHEN CurrentOccupancy / Capacity <= 0.9 THEN '高利用率(61-90%)'
            WHEN CurrentOccupancy / Capacity <= 1.0 THEN '满载(91-100%)'
            ELSE '超载(>100%)'
          END as utilizationRange,
          COUNT(*) as count
        FROM Location 
        WHERE Status = 1 AND Capacity > 0
        GROUP BY 
          CASE 
            WHEN CurrentOccupancy = 0 THEN '空闲'
            WHEN CurrentOccupancy / Capacity <= 0.3 THEN '低利用率(≤30%)'
            WHEN CurrentOccupancy / Capacity <= 0.6 THEN '中等利用率(31-60%)'
            WHEN CurrentOccupancy / Capacity <= 0.9 THEN '高利用率(61-90%)'
            WHEN CurrentOccupancy / Capacity <= 1.0 THEN '满载(91-100%)'
            ELSE '超载(>100%)'
          END
        ORDER BY 
          CASE 
            WHEN CurrentOccupancy = 0 THEN 1
            WHEN CurrentOccupancy / Capacity <= 0.3 THEN 2
            WHEN CurrentOccupancy / Capacity <= 0.6 THEN 3
            WHEN CurrentOccupancy / Capacity <= 0.9 THEN 4
            WHEN CurrentOccupancy / Capacity <= 1.0 THEN 5
            ELSE 6
          END
      `)
    ]);

    const statistics = {
      overview: {
        totalLocations: overviewStats[0]?.totalLocations || 0,
        activeLocations: overviewStats[0]?.activeLocations || 0,
        occupiedLocations: overviewStats[0]?.occupiedLocations || 0,
        emptyLocations: overviewStats[0]?.emptyLocations || 0,
        overloadLocations: overviewStats[0]?.overloadLocations || 0,
        avgUtilization: parseFloat(overviewStats[0]?.avgUtilization) || 0
      },
      typeDistribution: typeStats.map(item => ({
        type: item.LocationType,
        count: item.count,
        occupiedCount: item.occupiedCount,
        avgUtilization: parseFloat(item.avgUtilization) || 0
      })),
      warehouseDistribution: warehouseStats.map(item => ({
        warehouseName: item.WarehouseName,
        totalLocations: item.totalLocations,
        occupiedLocations: item.occupiedLocations,
        avgUtilization: parseFloat(item.avgUtilization) || 0,
        totalOccupancy: parseFloat(item.totalOccupancy) || 0,
        totalCapacity: parseFloat(item.totalCapacity) || 0
      })),
      utilizationDistribution: utilizationStats.map(item => ({
        range: item.utilizationRange,
        count: item.count
      }))
    };

    console.log('获取库位统计数据 - 成功');
    res.json(successResponse(statistics));

  } catch (error) {
    console.error('获取库位统计数据失败:', error);
    res.status(500).json(errorResponse('获取库位统计数据失败'));
  }
});

// 11. 库位占用情况更新（系统内部调用）
router.put('/locations/:locationCode/occupancy',  async (req, res) => {
  try {
    const { locationCode } = req.params;
    console.log(`更新库位占用情况 - 库位编号: ${locationCode}`);

    if (!locationCode) {
      return res.status(400).json(errorResponse('库位编号不能为空', 400));
    }

    // 重新计算库位占用情况
    const occupancySql = `
      SELECT 
        l.LocationID,
        l.Capacity,
        COALESCE(SUM(i.CurrentQuantity), 0) as totalOccupancy
      FROM Location l
      LEFT JOIN Inventory i ON l.LocationID = i.LocationID AND i.CurrentQuantity > 0
      WHERE l.LocationID = ?
      GROUP BY l.LocationID, l.Capacity
    `;

    const occupancyResult = await executeQuery(occupancySql, [locationCode]);

    if (occupancyResult.length === 0) {
      return res.status(404).json(errorResponse('库位不存在', 404));
    }

    const { totalOccupancy } = occupancyResult[0];
    const isOccupied = totalOccupancy > 0 ? 1 : 0;

    // 更新库位占用情况
    await executeQuery(
      `UPDATE Location 
       SET CurrentOccupancy = ?, IsOccupied = ?, UpdatedAt = CURRENT_TIMESTAMP
       WHERE LocationID = ?`,
      [totalOccupancy, isOccupied, locationCode]
    );

    console.log(`更新库位占用情况 - 成功: ${locationCode}, 占用量: ${totalOccupancy}`);
    res.json(successResponse({ 
      locationCode, 
      currentOccupancy: parseFloat(totalOccupancy),
      isOccupied 
    }, '库位占用情况更新成功'));

  } catch (error) {
    console.error('更新库位占用情况失败:', error);
    res.status(500).json(errorResponse('更新库位占用情况失败'));
  }
});

// 12. 批量更新库位占用情况（定时任务或手动触发）
router.post('/locations/refresh-occupancy',  async (req, res) => {
  try {
    console.log('批量更新库位占用情况 - 开始');

    // 获取所有库位的实际占用情况
    const refreshSql = `
      UPDATE Location l
      LEFT JOIN (
        SELECT 
          LocationID,
          SUM(CurrentQuantity) as totalOccupancy
        FROM Inventory 
        WHERE CurrentQuantity > 0
        GROUP BY LocationID
      ) occupancy ON l.LocationID = occupancy.LocationID
      SET 
        l.CurrentOccupancy = COALESCE(occupancy.totalOccupancy, 0),
        l.IsOccupied = CASE WHEN COALESCE(occupancy.totalOccupancy, 0) > 0 THEN 1 ELSE 0 END,
        l.UpdatedAt = CURRENT_TIMESTAMP
      WHERE l.Status = 1
    `;

    const result = await executeQuery(refreshSql);

    console.log(`批量更新库位占用情况 - 成功, 影响行数: ${result.affectedRows}`);
    res.json(successResponse({ 
      updatedCount: result.affectedRows 
    }, '库位占用情况刷新成功'));

  } catch (error) {
    console.error('批量更新库位占用情况失败:', error);
    res.status(500).json(errorResponse('批量更新库位占用情况失败'));
  }
});




module.exports = router;
