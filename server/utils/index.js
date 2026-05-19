const moment = require('moment');
const pool = require('../config/db');

const createResponse = (success, data = null, message = '', code = 200) => {
  return {
    code: success ? 200 : (code || 500),
    message: message || (success ? '操作成功' : '操作失败'),
    data: data,
    timestamp: new Date().toISOString()
  };
};

const successResponse = (data = null, message = '操作成功') =>
  createResponse(true, data, message, 200);

const errorResponse = (message = '操作失败', code = 500, data = null) =>
  createResponse(false, data, message, code);

const formatDateTime = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

const validateRequired = (params, requiredFields) => {
  const missing = requiredFields.filter(field => !params[field]);
  return missing.length > 0 ? `缺少必填参数: ${missing.join(', ')}` : null;
};

const executeQuery = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};

const executeTransaction = async (operations) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const results = [];
    for (const operation of operations) {
      const result = await connection.execute(operation.sql, operation.params || []);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createResponse,
  successResponse,
  errorResponse,
  formatDateTime,
  validateRequired,
  executeQuery,
  executeTransaction
};
