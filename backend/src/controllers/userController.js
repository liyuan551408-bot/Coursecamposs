const userService = require('../services/userService');

// 获取当前登录用户的资料
const getMe = async (req, res) => {
    try {
        // 关键点：这里的 req.user.id 是刚才的中间件从 Token 里解析出来并挂载上去的！
        const userId = req.user.id; 
        
        // 调用底层查库
        const user = await userService.findPublicUserById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// 更新当前登录用户的资料
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, major } = req.body; // 前端传过来的新数据

        const updatedUser = await userService.updateUserProfile(userId, { name, major });

        res.status(200).json({ 
            success: true, 
            message: 'Profile updated successfully', 
            data: updatedUser 
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getMe,
    updateProfile
};