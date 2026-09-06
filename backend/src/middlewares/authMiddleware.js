/** @file Applies the auth cross-cutting policy to Express requests. */
const jwt = require('jsonwebtoken');

// Authenticate the request before allowing the Express middleware chain to continue.
const verifyToken = (req, res, next) => {
    // Read the bearer credential supplied by the frontend.
    const authHeader = req.headers.authorization;

    // Reject missing or malformed credentials before attempting verification.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    // Strip the scheme so jwt.verify receives only the encoded token.
    const token = authHeader.split(' ')[1];

    try {
        // Verify with the same secret used when authentication tokens are issued.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the verified identity so downstream authorization can use it.
        // Controllers intentionally read this normalized identity from req.user.
        req.user = decoded;

        // Continue only after the request identity has been established.
        next();
        
    } catch (error) {
        // Invalid, forged, or expired tokens all produce the same safe response.
        console.error('Token Verification Error:', error.message);
        // Treat an invalid or expired credential as unauthenticated. Returning
        // 401 lets the frontend clear its stale session and request a fresh login.
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};

module.exports = {
    verifyToken
};
