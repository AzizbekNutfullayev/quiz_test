import crypto from "crypto";
import { pool } from "../config/db.js";
import { compareText, hashText } from "../utils/crypto.js";
import { signAccessToken } from "../utils/jwt.js";

// =========================
// REQUEST OTP
// =========================
export async function requestOtp(req, res) {
    try {
        const body = req.body || {};
        const email = String(body.email || "").trim().toLowerCase();

        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }

        const code = String(Math.floor(100000 + Math.random() * 900000));
        const codeHash = await hashText(code);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await pool.query(
            `UPDATE login_otps
       SET used=TRUE
       WHERE email=$1 AND used=FALSE`, [email]
        );

        await pool.query(
            `INSERT INTO login_otps(email, code_hash, expires_at)
       VALUES ($1,$2,$3)`, [email, codeHash, expiresAt]
        );

        console.log("OTP CODE:", code);

        return res.json({ message: "OTP sent" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}

// =========================
// VERIFY OTP
// =========================
export async function verifyOtp(req, res) {
    try {
        const body = req.body || {};
        const email = String(body.email || "").trim().toLowerCase();
        const code = String(body.code || "").trim();
        const usernameRaw = body.username;

        if (!email || !code) {
            return res.status(400).json({ message: "Email and code required" });
        }

        const otpRes = await pool.query(
            `SELECT *
       FROM login_otps
       WHERE email=$1 AND used=FALSE
       ORDER BY created_at DESC
       LIMIT 1`, [email]
        );

        const otp = otpRes.rows[0];
        if (!otp) return res.status(400).json({ message: "OTP not found" });

        if (new Date(otp.expires_at) < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        const isMatch = await compareText(code, otp.code_hash);
        if (!isMatch) return res.status(400).json({ message: "Invalid code" });

        await pool.query(`UPDATE login_otps SET used=TRUE WHERE id=$1`, [otp.id]);

        let userRes = await pool.query(`SELECT * FROM users WHERE email=$1`, [email]);
        let user = userRes.rows[0];

        if (!user) {
            const publicId = crypto
                .randomUUID()
                .replaceAll("-", "")
                .slice(0, 12)
                .toUpperCase();

            let uname = usernameRaw ? String(usernameRaw).trim() : null;

            if (uname) {
                const exists = await pool.query(
                    `SELECT 1 FROM users WHERE username=$1 LIMIT 1`, [uname]
                );
                if (exists.rowCount > 0) {
                    uname = `${uname}_${Math.floor(1000 + Math.random() * 9000)}`;
                }
            }

            const created = await pool.query(
                `INSERT INTO users(public_id, username, email, email_verified)
         VALUES ($1,$2,$3,TRUE)
         RETURNING *`, [publicId, uname, email]
            );

            user = created.rows[0];
        }

        if (user.is_banned) {
            return res.status(403).json({ message: "You are banned" });
        }

        const accessToken = signAccessToken({ userId: user.id, role: user.role });

        return res.json({
            accessToken,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}