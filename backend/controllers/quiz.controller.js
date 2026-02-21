import { pool } from "../config/db.js";

// vaqtincha test uchun (keyin random savol chiqaramiz)
export async function startQuiz(req, res) {
    try {
        return res.json({
            ok: true,
            message: "startQuiz works",
            user: req.user || null
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}