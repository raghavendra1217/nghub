const jwt = require('jsonwebtoken');

// Middleware to protect routes by verifying the JWT
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Get user from database using PostgreSQL
            const userQuery = 'SELECT id, employee_id, name, email, contact, role FROM users WHERE id = $1';
            const userResult = await req.db.query(userQuery, [decoded.userId]);

            if (userResult.rows.length === 0) {
                console.log("❌ User not found in DB");
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = userResult.rows[0];
            next();
        } catch (error) {
            console.log("❌ JWT Verification Failed:", error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        console.log("⛔ No token provided in headers");
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to authorize based on user role
// Example usage: authorize('admin') or authorize('admin', 'employee')
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            console.log(`❌ User role '${req.user?.role}' not authorized. Required: ${roles.join(', ')}`);
            return res.status(403).json({ message: 'User role not authorized to access this route' });
        }
        next();
    };
};

module.exports = { protect, authorize };
