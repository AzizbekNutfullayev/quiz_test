import jwt from "jsonwebtoken";

export function signAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "30d",
    });
}
export function verifyAccessToken(token) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET is missing in .env");

    return jwt.verify(token, secret);
}