require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// 1. 配置全局中间件
app.use(cors()); 
app.use(express.json()); 

// 2. 引入路由文件
const courseRoutes = require('./src/routes/courseRoutes');
const aiRoutes = require('./src/routes/aiRoutes'); // 👈 新增这一行：引入你写好的 AI 路由

// 3. 挂载路由
// 所有以 /api/courses 开头的请求交给 courseRoutes
app.use('/api/courses', courseRoutes);
// 所有以 /api/ai 开头的请求交给 aiRoutes 👈 新增这一行
app.use('/api/ai', aiRoutes); 

// 4. 启动服务器监听
app.listen(PORT, () => {
    console.log(`🚀 你的 Express 后端服务器已成功启动！`);
    console.log(`📡 正在监听地址: http://localhost:${PORT}`);
});