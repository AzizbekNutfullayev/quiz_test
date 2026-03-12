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

        // 6 xonali OTP
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const otpHash = await hashText(code);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minut

        // eski active OTP larni used qilamiz
        await pool.query(
            `
      UPDATE otps
      SET used = TRUE
      WHERE email = $1 AND used = FALSE
      `, [email]
        );

        // yangi OTP yozamiz
        await pool.query(
            `
      INSERT INTO otps (email, otp_hash, expires_at)
      VALUES ($1, $2, $3)
      `, [email, otpHash, expiresAt]
        );

        console.log("OTP EMAIL:", email);
        console.log("OTP CODE:", code);

        return res.json({
            ok: true,
            message: "OTP sent",
            dev_code: code
        });
    } catch (err) {
        console.error("requestOtp ERROR:", err);
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

        // frontend ba'zida code yuboradi, ba'zida otp
        const code = String(body.code || body.otp || "").trim();

        if (!email || !code) {
            return res.status(400).json({ message: "Email and code required" });
        }

        // eng oxirgi ishlatilmagan OTP ni olamiz
        const otpRes = await pool.query(
            `
      SELECT *
      FROM otps
      WHERE email = $1 AND used = FALSE
      ORDER BY created_at DESC
      LIMIT 1
      `, [email]
        );

        const otpRow = otpRes.rows[0];

        if (!otpRow) {
            return res.status(400).json({ message: "OTP not found" });
        }

        if (new Date(otpRow.expires_at) < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        const isMatch = await compareText(code, otpRow.otp_hash);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid code" });
        }

        // OTP ishlatilgan deb belgilaymiz
        await pool.query(
            `
      UPDATE otps
      SET used = TRUE
      WHERE id = $1
      `, [otpRow.id]
        );

        // user topamiz
        let userRes = await pool.query(
            `
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1
      `, [email]
        );

        let user = userRes.rows[0];

        // user bo'lmasa yaratamiz
        if (!user) {
            const created = await pool.query(
                `
        INSERT INTO users (email, role, is_banned)
        VALUES ($1, 'user', FALSE)
        RETURNING *
        `, [email]
            );

            user = created.rows[0];
        }

        if (user.is_banned) {
            return res.status(403).json({ message: "You are banned" });
        }

        const accessToken = signAccessToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });


        return res.json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("verifyOtp ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}