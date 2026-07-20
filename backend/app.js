const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// 1. 配置中间件
app.use(cors()); // 允许前端跨域调用
app.use(express.json()); // 允许后端解析前端发来的 JSON 数据

// 2. 模拟的课程数据（写死在这里，等数据库建好再换）
const mockCourses = [
    { id: 1, name: "高等数学", code: "MATH101", credits: 4 },
    { id: 2, name: "软件工程导论", code: "SE201", credits: 3 }
];

// 3. 编写第一个测试接口：获取课程列表
app.get('/api/courses', (req, res) => {
    res.json({ success: true, data: mockCourses });
});

// 4. 启动服务器监听
app.listen(PORT, () => {
    console.log(`🚀 你的 Express 后端服务器已成功启动！`);
    console.log(`📡 正在监听地址: http://localhost:${PORT}`);
});