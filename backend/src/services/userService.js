const prisma = require('../lib/prisma');

const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    major: true,
    createdAt: true,
    updatedAt: true
};

const normalizeEmail = (email) => {
    if (typeof email !== 'string' || email.trim() === '') {
        throw new TypeError('A valid email is required');
    }

    return email.trim().toLowerCase();
};

// 登录时使用。这里需要 passwordHash 来验证密码。
const findUserForAuthenticationByEmail = async (email) => {
    return prisma.user.findUnique({
        where: {
            email: normalizeEmail(email)
        },
        select: {
            id: true,
            email: true,
            passwordHash: true,
            name: true,
            role: true,
            major: true
        }
    });
};

// 查询用户公开资料，不返回 passwordHash。
const findPublicUserById = async (id) => {
    return prisma.user.findUnique({
        where: {
            id
        },
        select: publicUserSelect
    });
};

// 创建普通学生账号。
// 不允许调用者传入 role，防止注册时把自己设置成管理员。
const createUser = async ({
    email,
    passwordHash,
    name,
    major = null
}) => {
    if (typeof passwordHash !== 'string' || passwordHash === '') {
        throw new TypeError('A password hash is required');
    }

    if (typeof name !== 'string' || name.trim() === '') {
        throw new TypeError('A user name is required');
    }

    return prisma.user.create({
        data: {
            email: normalizeEmail(email),
            passwordHash,
            name: name.trim(),
            major:
                typeof major === 'string' && major.trim() !== ''
                    ? major.trim()
                    : null
        },
        select: publicUserSelect
    });
};

module.exports = {
    normalizeEmail,
    findUserForAuthenticationByEmail,
    findPublicUserById,
    createUser
};