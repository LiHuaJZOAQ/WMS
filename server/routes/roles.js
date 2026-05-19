const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createResponse, successResponse, errorResponse, formatDateTime, validateRequired, executeQuery, executeTransaction } = require('../utils');

// ====================================
// 系统设置 - 角色与权限接口
// ====================================

router.get('/roles', async (req, res) => {
  try {
    const sql = 'SELECT RoleID as id, RoleName as name, Description as description, IsSystem as isSystem, CreatedAt as createdAt FROM Role ORDER BY RoleID ASC';
    const results = await executeQuery(sql);
    
    for (let role of results) {
      const permSql = `
        SELECT p.PermissionID as permissionId, p.PermissionCode as code, p.PermissionName as name
        FROM RolePermission rp
        JOIN Permission p ON rp.PermissionID = p.PermissionID
        WHERE rp.RoleID = ?
      `;
      const perms = await executeQuery(permSql, [role.id]);
      role.permissions = perms;
      role.permissionIds = perms.map(p => p.permissionId);
      role.createdAt = formatDateTime(role.createdAt);
    }
    
    res.json(successResponse({ items: results }));
  } catch (error) {
    res.status(500).json(errorResponse('获取角色列表失败'));
  }
});

router.post('/roles', async (req, res) => {
  try {
    const { name, description, permissionIds = [] } = req.body;
    const validation = validateRequired({ name }, ['name']);
    if (validation) return res.status(400).json(errorResponse(validation, 400));

    const checkResult = await executeQuery('SELECT RoleID FROM Role WHERE RoleName = ?', [name]);
    if (checkResult.length > 0) return res.status(400).json(errorResponse('角色名称已存在', 400));

    const insertResult = await executeQuery(
      'INSERT INTO Role (RoleName, Description, IsSystem, CreatedAt) VALUES (?, ?, 0, NOW())',
      [name, description || '']
    );

    const roleId = insertResult.insertId;
    for (const permId of permissionIds) {
      await executeQuery('INSERT INTO RolePermission (RoleID, PermissionID) VALUES (?, ?)', [roleId, permId]);
    }

    res.json(successResponse(null, '角色创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('创建角色失败'));
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;
    
    const checkRole = await executeQuery('SELECT IsSystem FROM Role WHERE RoleID = ?', [id]);
    if (checkRole.length === 0) return res.status(404).json(errorResponse('角色不存在', 404));
    if (checkRole[0].IsSystem === 1) return res.status(400).json(errorResponse('系统内置角色无法修改', 400));

    await executeQuery('UPDATE Role SET RoleName = ?, Description = ? WHERE RoleID = ?', [name, description || '', id]);

    if (permissionIds !== undefined) {
      await executeQuery('DELETE FROM RolePermission WHERE RoleID = ?', [id]);
      for (const permId of permissionIds) {
        await executeQuery('INSERT INTO RolePermission (RoleID, PermissionID) VALUES (?, ?)', [id, permId]);
      }
    }

    res.json(successResponse(null, '角色更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('更新角色失败'));
  }
});

router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const checkRole = await executeQuery('SELECT IsSystem FROM Role WHERE RoleID = ?', [id]);
    if (checkRole.length === 0) return res.status(404).json(errorResponse('角色不存在', 404));
    if (checkRole[0].IsSystem === 1) return res.status(400).json(errorResponse('系统内置角色无法删除', 400));

    await executeQuery('DELETE FROM Role WHERE RoleID = ?', [id]);
    res.json(successResponse(null, '角色删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('删除角色失败'));
  }
});

router.get('/permissions', async (req, res) => {
  try {
    const sql = 'SELECT PermissionID as id, PermissionCode as code, PermissionName as name, ModuleName as module, ParentID as parentId FROM Permission ORDER BY ParentID ASC, SortOrder ASC';
    const results = await executeQuery(sql);
    
    // 转换为树形结构
    const map = {};
    const tree = [];
    results.forEach(item => { map[item.id] = { ...item, children: [] }; });
    results.forEach(item => {
      if (item.parentId) {
        if (map[item.parentId]) map[item.parentId].children.push(map[item.id]);
      } else {
        tree.push(map[item.id]);
      }
    });

    res.json(successResponse({ items: tree, flatList: results }));
  } catch (error) {
    res.status(500).json(errorResponse('获取权限列表失败'));
  }
});


module.exports = router;
