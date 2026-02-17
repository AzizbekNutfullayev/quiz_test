import bcrypt from "bcrypt";
import crypto from "crypto";

// =========================
// HASH
// =========================
export async function hashText(text) {
    const saltRounds = 10;
    return bcrypt.hash(text, saltRounds);
}

// =========================
// COMPARE
// =========================
export async function compareText(text, hash) {
    return bcrypt.compare(text, hash);
}

// =========================
// OTP GENERATOR
// =========================
export function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

// =========================
// RANDOM TOKEN
// =========================
export function randomToken() {
    return crypto.randomUUID() + crypto.randomUUID();
}