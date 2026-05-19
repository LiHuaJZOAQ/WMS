const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

// ====================================
// 基础接口
// ====================================

// 测试数据库连接
router.get('/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json(successResponse(null, '数据库连接成功'));
  } catch (error) {
    console.error('数据库连接失败:', error);
    res.status(500).json(errorResponse('数据库连接失败'));
  }
});

// 健康检查接口
router.get('/health', async (req, res) => {
  try {
    await executeQuery('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});


module.exports = router;
