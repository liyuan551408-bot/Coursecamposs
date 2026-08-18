const bcrypt = require('bcryptjs'); // 新增引入 bcrypt
const crypto = require('crypto');
const prisma = require('../lib/prisma'); //[cite: 2]

const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    major: true,
    createdAt: true,
    updatedAt: true
}; //[cite: 2]

const normalizeEmail = (email) => {
    if (typeof email !== 'string' || email.trim() === '') {
        throw new TypeError('A valid email is required');
    }
    return email.trim().toLowerCase();
}; //[cite: 2]

const findUserForAuthenticationByEmail = async (email) => {
    return prisma.user.findUnique({
        where: { email: normalizeEmail(email) },
        select: {
            id: true,
            email: true,
            passwordHash: true,
            name: true,
            role: true,
            major: true
        }
    });
}; //[cite: 2]

const findPublicUserById = async (id) => {
    return prisma.user.findUnique({
        where: { id },
        select: publicUserSelect
    });
}; //[cite: 2]

// 标准化：接收明文 password，在这里完成加密
const createUser = async ({ email, password, name, major = null }) => {
    if (typeof password !== 'string' || password === '') {
        throw new TypeError('A password is required');
    }
    if (typeof name !== 'string' || name.trim() === '') {
        throw new TypeError('A user name is required');
    }

    // 在 Service 层进行加密，保持业务逻辑的内聚
    const passwordHash = await bcrypt.hash(password, 10);

    return prisma.user.create({
        data: {
            email: normalizeEmail(email),
            passwordHash, // 存入加密后的密码
            name: name.trim(),
            major: typeof major === 'string' && major.trim() !== '' ? major.trim() : null
        },
        select: publicUserSelect
    });
};

// 重置密码（生成并储存验证码）
const generateResetCode = async (email) => {
    // 1. find user
    const user = await prisma.user.findUnique({where:{ email: normalizeEmail(email)}});

    if(!user) return null;

    // 2. generate 6-digit random code (like 295638)
    const resetCode = crypto.randomInt(100000,1000000).toString();

    // 3. setup the expiration time (60s)
    const resetCodeExpires = new Date(Date.now() + 60 * 1000);
    // 4. update reset code and expiration time to database
    await prisma.user.update({
        where: {id: user.id},
        data:{
            resetCode,
            resetCodeExpires
        }
    });

    return resetCode;
}

// 验证验证码并重置密码
const resetPassword = async (email, resetCode, newPassword) => {
    // 1. 去数据库里同时匹配邮箱和验证码
    const user = await prisma.user.findFirst({
        where: { 
            email: normalizeEmail(email),
            resetCode: resetCode 
        }
    });

    // 如果找不到人，说明邮箱不对或者验证码填错了
    if (!user) {
        throw new Error('Invalid code');
    }

    // 2. 检查验证码是否已经过期
    if (new Date() > user.resetCodeExpires) {
        throw new Error('Code expired');
    }

    // 3. 验证通过！对新密码进行加密 (保持跟你 createUser 里一样的加密规则)
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 4. 更新数据库：写入新密码，并且一定要清空验证码字段，防止被二次使用
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: passwordHash,
            resetCode: null,
            resetCodeExpires: null
        }
    });

    return true;
};

// 更新用户的个人资料
const updateUserProfile = async (id, data) => {
    // 过滤掉未定义的值，避免覆盖为空
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.major !== undefined) updateData.major = data.major;

    return prisma.user.update({
        where: { id },
        data: updateData,
        select: publicUserSelect // 复用你之前写好的、不包含密码的安全返回格式
    });
};

module.exports = {
    normalizeEmail,
    findUserForAuthenticationByEmail,
    findPublicUserById,
    createUser,
    generateResetCode,
    resetPassword,
    updateUserProfile
};