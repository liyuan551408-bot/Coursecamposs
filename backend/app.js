const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// 1. 配置全局中间件
app.use(cors()); 
app.use(express.json()); 

// 2. 引入你刚刚写好的路由文件！
const courseRoutes = require('./src/routes/courseRoutes');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const planRoutes = require('./src/routes/planRoutes');

// 3. 挂载路由
// 意思是：所有以 /api/courses 开头的请求，全都交给 courseRoutes 去处理
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/plans',planRoutes);

// 4. 启动服务器监听
app.listen(PORT, () => {
    console.log(`你的 Express 后端服务器已成功启动！`);
    console.log(`正在监听地址: http://localhost:${PORT}`);
});