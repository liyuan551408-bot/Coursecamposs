const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Authentication required.'
        });
    }

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: `Access denied. Requires one of: ${allowedRoles.join(', ')}`
        });
    }

    next();
};

module.exports = {
    requireRole
};
