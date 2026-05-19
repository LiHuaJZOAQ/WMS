const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse, executeQuery } = require('../utils');

// 获取商品列表
router.get('/items', async (req, res) => {
  try {
    const { itemType, keyword, status, page = 1, pageSize = 10 } = req.query;
    let sql = 'SELECT * FROM Item WHERE 1=1';
    const params = [];

    if (itemType) {
      sql += ' AND ItemType = ?';
      params.push(itemType);
    }
    if (status) {
      sql += ' AND Status = ?';
      params.push(status);
    }
    if (keyword) {
      sql += ' AND (ItemCode LIKE ? OR ItemName LIKE ? OR Category LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY ItemID DESC';

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    
    const countResult = await executeQuery(countSql, params);
    const total = countResult[0].total;

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const items = await executeQuery(sql, params);
    
    res.json(successResponse({ items, total }));
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json(errorResponse('获取商品列表失败'));
  }
});

// 新增商品
router.post('/items', async (req, res) => {
  try {
    const { ItemCode, ItemName, ItemType, Category, Unit, Specification, Attributes, MinStock, MaxStock } = req.body;
    
    const checkSql = 'SELECT * FROM Item WHERE ItemCode = ?';
    const exist = await executeQuery(checkSql, [ItemCode]);
    if (exist.length > 0) return res.status(400).json(errorResponse('商品编码已存在'));

    const sql = 'INSERT INTO Item (ItemCode, ItemName, ItemType, Category, Unit, Specification, Attributes, MinStock, MaxStock, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)';
    await executeQuery(sql, [ItemCode, ItemName, ItemType || 'NORMAL', Category, Unit, Specification, JSON.stringify(Attributes || {}), MinStock || 0, MaxStock || 999999]);
    
    res.json(successResponse(null, '新增成功'));
  } catch (error) {
    console.error('新增商品失败:', error);
    res.status(500).json(errorResponse('新增商品失败'));
  }
});

// 更新商品
router.put('/items/:id', async (req, res) => {
  try {
    const { ItemName, ItemType, Category, Unit, Specification, Attributes, MinStock, MaxStock, Status } = req.body;
    const sql = 'UPDATE Item SET ItemName=?, ItemType=?, Category=?, Unit=?, Specification=?, Attributes=?, MinStock=?, MaxStock=?, Status=? WHERE ItemID=?';
    await executeQuery(sql, [ItemName, ItemType, Category, Unit, Specification, JSON.stringify(Attributes || {}), MinStock, MaxStock, Status, req.params.id]);
    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json(errorResponse('更新商品失败'));
  }
});

// 删除商品
router.delete('/items/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Item WHERE ItemID=?', [req.params.id]);
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json(errorResponse('删除失败，该商品可能被库存或单据引用'));
  }
});

module.exports = router;
