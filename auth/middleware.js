const jwt = require("jsonwebtoken");


function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    };
}


function authorizeSelfOrAdmin(req, res, next) {
    const { auth_id } = req.params;

    if (req.user.role === "admin") {
        return next();
    }

    if (req.user.auth_id !== auth_id) {
        return res.status(403).json({ message: "You can only access your own profile" });
    }

    next();
}

module.exports = {
    authenticateToken,
    authorizeRoles,
    authorizeSelfOrAdmin
};
