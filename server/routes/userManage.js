const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');
const bcrypt = require('bcryptjs');

// ====================================
// 系统设置 - 用户管理接口
// ====================================

router.get('/users', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    let whereConditions = [];
    let queryParams = [];

    if (keyword) {
      whereConditions.push('(Username LIKE ? OR FullName LIKE ? OR Email LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (status !== undefined && status !== '') {
      whereConditions.push('IsActive = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const countSql = `SELECT COUNT(*) as total FROM User ${whereClause}`;
    const countResult = await executeQuery(countSql, queryParams);
    const total = countResult[0].total;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const sql = `
      SELECT 
        UserID as id, Username as username, Email as email, FullName as fullName,
        Phone as phone, Department as department, Position as position,
        IsActive as isActive, LastLoginTime as lastLoginTime, CreatedAt as createdAt
      FROM User ${whereClause} ORDER BY UserID DESC LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(sql, [...queryParams, limit, offset]);

    // 获取角色信息
    for (let user of results) {
      const roleSql = `
        SELECT r.RoleID as roleId, r.RoleName as roleName
        FROM UserRole ur
        JOIN Role r ON ur.RoleID = r.RoleID
        WHERE ur.UserID = ?
      `;
      const roles = await executeQuery(roleSql, [user.id]);
      user.roles = roles;
      user.roleIds = roles.map(r => r.roleId);
      user.createdAt = formatDateTime(user.createdAt);
      user.lastLoginTime = user.lastLoginTime ? formatDateTime(user.lastLoginTime) : null;
    }

    res.json(successResponse({ items: results, total, page: parseInt(page), pageSize: limit }));
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json(errorResponse('获取用户列表失败'));
  }
});

router.post('/users', async (req, res) => {
  try {
    const { username, password, email, fullName, phone, department, position, isActive = 1, roleIds = [] } = req.body;
    const validation = validateRequired({ username, password }, ['username', 'password']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT UserID FROM User WHERE Username = ?', [username]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('用户名已存在', 400));

    // 使用 bcrypt 进行密码哈希加密
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertResult = await executeQuery(
      `INSERT INTO User (Username, PasswordHash, Email, FullName, Phone, Department, Position, IsActive, CreatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [username, passwordHash, email || null, fullName || '', phone || '', department || '', position || '', isActive]
    );

    const userId = insertResult.insertId;

    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        await executeQuery('INSERT INTO UserRole (UserID, RoleID) VALUES (?, ?)', [userId, roleId]);
      }
    }

    res.json(successResponse(null, '用户创建成功'));
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json(errorResponse('创建用户失败'));
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fullName, phone, department, position, isActive, roleIds, password } = req.body;

    let sql = `UPDATE User SET Email = ?, FullName = ?, Phone = ?, Department = ?, Position = ?, IsActive = ?, UpdatedAt = NOW()`;
    const params = [email || null, fullName || '', phone || '', department || '', position || '', isActive !== undefined ? isActive : 1];

    // 如果提供了新密码，则一并更新并哈希加密
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      sql += `, PasswordHash = ?`;
      params.push(passwordHash);
    }

    sql += ` WHERE UserID = ?`;
    params.push(id);

    await executeQuery(sql, params);

    if (roleIds !== undefined) {
      await executeQuery('DELETE FROM UserRole WHERE UserID = ?', [id]);
      if (roleIds.length > 0) {
        for (const roleId of roleIds) {
          await executeQuery('INSERT INTO UserRole (UserID, RoleID) VALUES (?, ?)', [id, roleId]);
        }
      }
    }

    res.json(successResponse(null, '用户更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新用户失败'));
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id == 1) return res.status(400).json(errorResponse('系统默认管理员无法删除', 400));
    await executeQuery('DELETE FROM User WHERE UserID = ?', [id]);
    res.json(successResponse(null, '用户删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除用户失败'));
  }
});


module.exports = router;
