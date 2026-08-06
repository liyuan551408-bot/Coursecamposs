const jwt = require('jsonwebtoken');

// 这是一个 Express 中间件函数，注意它有第三个参数 'next'
const verifyToken = (req, res, next) => {
    // 1. 从前端发来的请求头 (Headers) 中获取 Authorization 字段
    const authHeader = req.headers.authorization;

    // 2. 检查有没有传 Token。标准的格式是 "Bearer <token_string>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    // 3. 把 "Bearer " 截取掉，只保留真正的 token 字符串
    const token = authHeader.split(' ')[1];

    try {
        // 4. 使用和登录签发时一模一样的密钥来解密 Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. 关键步骤：把解密出来的用户信息（id, email, role）挂载到 req 对象上
        // 这样后续的 Controller 就能直接通过 req.user 知道是谁在发请求了
        req.user = decoded;

        // 6. 验证通过，放行！让请求继续走到下一个中间件或最终的 Controller
        next();
        
    } catch (error) {
        // 解密失败（比如 Token 是伪造的，或者已经过了你设置的 24h 有效期）
        console.error('Token Verification Error:', error.message);
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};

module.exports = {
    verifyToken
};