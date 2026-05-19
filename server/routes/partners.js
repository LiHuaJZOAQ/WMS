const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse, executeQuery } = require('../utils');

// 获取往来单位列表
router.get('/partners', async (req, res) => {
  try {
    const { role, keyword, status, page = 1, pageSize = 10 } = req.query;
    let sql = 'SELECT * FROM Partner WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND Role = ?';
      params.push(role);
    }
    if (status) {
      sql += ' AND Status = ?';
      params.push(status);
    }
    if (keyword) {
      sql += ' AND (PartnerCode LIKE ? OR PartnerName LIKE ? OR ContactPerson LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY PartnerID DESC';

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    
    const countResult = await executeQuery(countSql, params);
    const total = countResult[0].total;

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const items = await executeQuery(sql, params);
    
    res.json(successResponse({ items, total }));
  } catch (error) {
    console.error('获取往来单位列表失败:', error);
    res.status(500).json(errorResponse('获取往来单位列表失败'));
  }
});

// 新增往来单位
router.post('/partners', async (req, res) => {
  try {
    const { PartnerCode, PartnerName, Role, ContactPerson, ContactPhone, Address } = req.body;
    
    const checkSql = 'SELECT * FROM Partner WHERE PartnerCode = ?';
    const exist = await executeQuery(checkSql, [PartnerCode]);
    if (exist.length > 0) return res.status(400).json(errorResponse('单位编码已存在'));

    const sql = 'INSERT INTO Partner (PartnerCode, PartnerName, Role, ContactPerson, ContactPhone, Address, Status) VALUES (?, ?, ?, ?, ?, ?, 1)';
    await executeQuery(sql, [PartnerCode, PartnerName, Role || 'SUPPLIER', ContactPerson, ContactPhone, Address]);
    
    res.json(successResponse(null, '新增成功'));
  } catch (error) {
    console.error('新增往来单位失败:', error);
    res.status(500).json(errorResponse('新增往来单位失败'));
  }
});

// 更新往来单位
router.put('/partners/:id', async (req, res) => {
  try {
    const { PartnerName, Role, ContactPerson, ContactPhone, Address, Status } = req.body;
    const sql = 'UPDATE Partner SET PartnerName=?, Role=?, ContactPerson=?, ContactPhone=?, Address=?, Status=? WHERE PartnerID=?';
    await executeQuery(sql, [PartnerName, Role, ContactPerson, ContactPhone, Address, Status, req.params.id]);
    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新往来单位失败:', error);
    res.status(500).json(errorResponse('更新往来单位失败'));
  }
});

// 删除往来单位
router.delete('/partners/:id', async (req, res) => {
  try {
    // 逻辑删除或物理删除，暂且物理删除
    await executeQuery('DELETE FROM Partner WHERE PartnerID=?', [req.params.id]);
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除往来单位失败:', error);
    res.status(500).json(errorResponse('删除失败，该单位可能被其他单据引用'));
  }
});

module.exports = router;
