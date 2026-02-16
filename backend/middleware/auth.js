import { verifyAccessToken } from "../utils/jwt.js";
import { pool } from "../config/db.js";

export async function auth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        if (!header.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token" });
        }

        const token = header.split(" ")[1];
        const payload = verifyAccessToken(token); // { userId, role }

        // DB’dan userni tekshirish (ban bo‘lmasin, user mavjud bo‘lsin)
        const userRes = await pool.query(
            "SELECT id, role, is_banned, premium_expires_at FROM users WHERE id=$1", [payload.userId]
        );

        const user = userRes.rows[0];
        if (!user) return res.status(401).json({ message: "User not found" });

        if (user.is_banned) {
            return res.status(403).json({ message: "You are banned" });
        }

        // req.user ga saqlab qo‘yamiz
        req.user = {
            userId: user.id,
            role: user.role,
            isPremium: user.premium_expires_at && new Date(user.premium_expires_at) > new Date(),
            premium_expires_at: user.premium_expires_at,
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}