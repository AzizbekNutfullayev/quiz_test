export function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
    }
    next();
}

export function adminMiddleware(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
    }

    next();
}