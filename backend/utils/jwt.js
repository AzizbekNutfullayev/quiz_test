import jwt from "jsonwebtoken";

export function signAccessToken(payload) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET is missing in .env");

    return jwt.sign(payload, secret, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m"
    });
}

export function verifyAccessToken(token) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET is missing in .env");

    return jwt.verify(token, secret);
}