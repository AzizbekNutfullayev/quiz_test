import jwt from "jsonwebtoken";

export function auth(req, res, next) {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}