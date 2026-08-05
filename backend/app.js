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
const aiRoutes = require('./src/routes/aiRoutes');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');

// 3. 挂载路由
app.use('/api/courses', courseRoutes);
app.use('/api/ai', aiRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// 4. 启动服务器监听
app.listen(PORT, () => {
    console.log(`你的 Express 后端服务器已成功启动！`);
    console.log(`正在监听地址: http://localhost:${PORT}`);
});