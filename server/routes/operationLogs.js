const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

// ====================================
// 系统设置 - 操作日志接口
// ====================================

router.get('/operation-logs', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, username, operationType, moduleName, startDate, endDate } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (username) {
      whereConditions.push('Username LIKE ?');
      queryParams.push(`%${username}%`);
    }
    if (operationType) {
      whereConditions.push('OperationType = ?');
      queryParams.push(operationType);
    }
    if (moduleName) {
      whereConditions.push('ModuleName LIKE ?');
      queryParams.push(`%${moduleName}%`);
    }
    if (startDate) {
      whereConditions.push('OperationTime >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      whereConditions.push('OperationTime <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = `SELECT COUNT(*) as total FROM OperationLog ${whereClause}`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = `
      SELECT 
        LogID as id, Username as username, OperationType as operationType,
        ModuleName as moduleName, FunctionName as functionName, RequestMethod as method,
        RequestUrl as url, IpAddress as ip, OperationTime as operationTime, Status as status
      FROM OperationLog ${whereClause} ORDER BY OperationTime DESC LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);
    
    const formattedResults = results.map(item => ({ ...item, operationTime: formatDateTime(item.operationTime) }));

    res.json(successResponse({ items: formattedResults, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    res.status(500).json(errorResponse('获取操作日志失败'));
  }
});


module.exports = router;
