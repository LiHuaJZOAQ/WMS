const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { JWT_SECRET } = require('../config/env');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');
const bcrypt = require('bcryptjs');
const { sign, verify } = require('jsonwebtoken');

// ====================================
// 用户认证接口
// ====================================

// 用户登录
router.post('/users/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  try {
    // 查询用户
    const [rows] = await pool.execute(
      'SELECT UserID, Username, PasswordHash, FullName, Email, Department, Position FROM User WHERE Username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = rows[0];
    
    // 使用 bcrypt 校验密码
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    
    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 更新最后登录时间
    await pool.execute(
      'UPDATE User SET LastLoginTime = NOW() WHERE UserID = ?',
      [user.UserID]
    );

    // 生成JWT令牌
    const token = sign(
      { 
        id: user.UserID, 
        username: user.Username,
        fullName: user.FullName,
        email: user.Email,
        department: user.Department,
        position: user.Position
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 返回用户信息和令牌
    res.status(200).json({
      message: '登录成功',
      user: {
        id: user.UserID,
        name: user.FullName || user.Username,
        email: user.Email,
        department: user.Department,
        position: user.Position
      },
      token
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

// 获取用户信息
router.get('/users/info',  async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT UserID, Username, FullName, Email, Department, Position FROM User WHERE UserID = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json(errorResponse('用户不存在', 404));
    }

    const user = rows[0];
    res.json(successResponse({
      id: user.UserID,
      username: user.Username,
      name: user.FullName,
      email: user.Email,
      department: user.Department,
      position: user.Position
    }));
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json(errorResponse('获取用户信息失败'));
  }
});



module.exports = router;
