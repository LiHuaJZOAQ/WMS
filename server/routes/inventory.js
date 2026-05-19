const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse, executeQuery } = require('../utils');

// 获取库存列表
router.get('/inventory', async (req, res) => {
  try {
    const { keyword, itemType, locationCode, page = 1, pageSize = 10 } = req.query;
    let sql = `
      SELECT inv.*, i.ItemCode, i.ItemName, i.Specification, i.Unit, i.Category, i.ItemType 
      FROM Inventory inv
      JOIN Item i ON inv.ItemID = i.ItemID
      WHERE 1=1
    `;
    const params = [];

    if (itemType) {
      sql += ' AND i.ItemType = ?';
      params.push(itemType);
    }
    if (locationCode) {
      sql += ' AND inv.LocationID = ?';
      params.push(locationCode);
    }
    if (keyword) {
      sql += ' AND (i.ItemCode LIKE ? OR i.ItemName LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY inv.InventoryID DESC';

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    
    const countResult = await executeQuery(countSql, params);
    const total = countResult[0].total;

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const items = await executeQuery(sql, params);
    
    res.json(successResponse({ items, total }));
  } catch (error) {
    console.error('获取库存列表失败:', error);
    res.status(500).json(errorResponse('获取库存列表失败'));
  }
});

module.exports = router;
