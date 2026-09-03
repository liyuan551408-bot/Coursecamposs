// 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const emailService = require('../services/emailService');
// 处理用户注册的逻辑
const register = async (req, res) => {
    try {
        // 1. 从前端发来的请求体 (body) 中提取数据
        const { email, password, name, major } = req.body;

        // 2. 简单的数据校验（确保必填项都有）
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        // 3. 将明文密码加密（盐值设为 10）
        const passwordHash = await bcrypt.hash(password, 10);

        // 4. 调用队友写好的底层的 createUser 方法存入数据库
        const newUser = await userService.createUser({
            email,
            password,
            name,
            major
        });

        // 5. 成功后，返回给前端 JSON 数据
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: newUser
        });

    } catch (error) {
        console.error('Registration Error:', error);
        
        // 处理邮箱重复的特殊错误 (Prisma 的 P2002 错误码)
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'This email is already registered'
            });
        }

        // 其他未知服务器错误
        res.status(500).json({
            success: false,
            message: 'Server Error during registration'
        });
    }
};

// 处理用户登录的逻辑
const login = async (req, res) => {
    try {
        // 1. 从请求体中提取邮箱和密码
        const { email, password } = req.body;

        // 2. 基础数据校验
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // 3. 调用底层的 findUserForAuthenticationByEmail 拿到带密码哈希的用户数据
        const user = await userService.findUserForAuthenticationByEmail(email);

        // 如果用户不存在，为了安全，统一返回“凭证无效”
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // 4. 使用 bcrypt 比对前端传来的明文密码和数据库里的密码哈希
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // 5. JWT logc
        // 放一些基础身份信息
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        // 2. 签发 Token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET, // 使用 .env 中定义的密钥
            { expiresIn: '24h' }    // 设置 24 小时后过期
        );

        // 6. 密码正确，准备返回数据。为了安全，解构剔除 passwordHash
        const { passwordHash, ...safeUser } = user;

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            token: token,
            data: safeUser
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error during login'
        });
    }
};

const forgotPassword = async(req, res) => {
    try{
        const { email } = req.body;

        if(!email){
            return res.status(400).json({
                success : false,
                message : 'Email is required'
            });
        }

        const resetCode = await userService.generateResetCode(email);

        // 如果用户存在并成功生成了代码，我们先把它打印在控制台模拟发送邮件
        if (resetCode) {
            try {
                // 调用真实的邮件发送
                await emailService.sendResetEmail(email, resetCode);
                console.log(`[Email Success] 已成功发送真实重置邮件到 ${email}`);
            } catch (emailError) {
                console.error('[Email Error] 邮件发送失败:', emailError);
            }
        }

        // 重要安全实践：无论该邮箱是否在数据库中存在，都返回相同的成功提示
        // 这样黑客就无法通过枚举来判断哪些邮箱注册了你的应用
        res.status(200).json({
            success: true,
            message: 'If that email address is in our database, we will send you an email with a reset code.'
        });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error during password reset request'
        });
    }
}

// 处理重置密码的逻辑
const resetPassword = async (req, res) => {
    try {
        const { email, resetCode, newPassword } = req.body;

        // 1. 基础数据校验：三个参数缺一不可
        if (!email || !resetCode || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, reset code, and new password are required'
            });
        }

        // 2. 调用底层 Service 完成密码重置
        await userService.resetPassword(email, resetCode, newPassword);

        // 3. 成功返回
        res.status(200).json({
            success: true,
            message: 'Password has been successfully reset'
        });

    } catch (error) {
        console.error('Reset Password Error:', error);
        
        // 捕获我们刚才在 Service 层抛出的特定错误，转成友好的前端提示
        if (error.message === 'Invalid code') {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset code or email'
            });
        }
        
        if (error.message === 'Code expired') {
            return res.status(400).json({
                success: false,
                message: 'Reset code has expired. Please request a new one'
            });
        }

        // 其他服务器未知错误
        res.status(500).json({
            success: false,
            message: 'Server Error during password reset'
        });
    }
};

// 导出这个函数，给路由层使用
module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
};

