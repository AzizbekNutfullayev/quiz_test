import { verifyAccessToken } from "../utils/jwt.js";
import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";


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




export const authMiddleware = async(req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.substring(7).trim();

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const userRes = await pool.query(
            `
            SELECT id, email, role, is_banned, premium_expires_at
            FROM users
            WHERE id = $1
            LIMIT 1
            `, [decoded.id]
        );

        const user = userRes.rows[0];

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.is_banned) {
            return res.status(403).json({ message: "You are banned" });
        }

        const isPremium = !!user.premium_expires_at &&
            new Date(user.premium_expires_at) > new Date();

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            isPremium,
            premiumExpiresAt: user.premium_expires_at,
        };

        next();
    } catch (err) {
        console.error("authMiddleware ERROR:", err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};