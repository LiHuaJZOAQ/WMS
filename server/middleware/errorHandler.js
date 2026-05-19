module.exports = (error, req, res, next) => {
  console.error('全局错误处理:', error);
  res.status(500).json({
    code: 500,
    message: error.message || '服务器内部错误',
    data: null,
    timestamp: new Date().toISOString()
  });
};
