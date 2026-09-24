const adminService = require('../services/adminService');

const getStats = async (_req, res, next) => {
    try {
        const data = await adminService.getStats();

        return res.json({
            success: true,
            data
        });
    } catch (error) {
        return next(error);
    }
};

const listUsers = async (req, res, next) => {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);

        if (
            !Number.isSafeInteger(page) ||
            page < 1 ||
            !Number.isSafeInteger(limit) ||
            limit < 1 ||
            limit > 50 ||
            !Number.isSafeInteger((page - 1) * limit)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'page must be positive and limit must be between 1 and 50'
            });
        }

        const data = await adminService.listUsers({
            page,
            limit
        });

        return res.json({
            success: true,
            data
        });
    } catch (error) {
        return next(error);
    }
};

const changeUserRole = async (req, res, next) => {
    try {
        const targetId = Number(req.params.id);
        const role = req.body?.role;

        if (
            !Number.isSafeInteger(targetId) ||
            targetId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user id'
            });
        }

        if (
            !['STUDENT', 'MODERATOR', 'ADMIN'].includes(role)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await adminService.changeUserRole({
            actorId: Number(req.user.id),
            targetId,
            role
        });

        return res.json({
            success: true,
            data: user
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        return next(error);
    }
};

module.exports = {
    getStats,
    listUsers,
    changeUserRole
};
