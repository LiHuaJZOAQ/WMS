require('dotenv').config();
const express = require('express');
const { json, urlencoded } = require('body-parser');
const cors = require('cors');
const { PORT } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const authenticateToken = require("./middleware/auth");

const app = express();

// 中间件配置
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// 公开的基础路由 (如 /health, /test)
app.use('/', require('./routes/base'));

// 全局注册 JWT 拦截器于 /api 路由下
app.use("/api", authenticateToken);

// 注册业务路由，统一挂载在 /api 下
app.use('/api', require('./routes/dashboard'));
app.use('/api/print', require('./routes/print')); // 公开的条码生成路由
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/partners'));
app.use('/api', require('./routes/items'));
app.use('/api', require('./routes/inboundOrders'));
app.use('/api', require('./routes/outboundOrders'));
app.use('/api', require('./routes/inventory'));
app.use('/api', require('./routes/userManage'));
app.use('/api', require('./routes/roles'));
app.use('/api', require('./routes/operationLogs'));
app.use('/api', require('./routes/locations'));
app.use('/api', require('./routes/stocktaking'));
app.use('/api', require('./routes/wave'));

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log('====================================');
  console.log(`WMS后端服务已启动`);
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log('====================================');
});
