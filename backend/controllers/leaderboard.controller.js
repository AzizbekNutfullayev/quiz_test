import { pool } from "../config/db.js";

export async function getLeaderboard(req, res) {
    try {
        const range = String((req.query && req.query.range) || "all").toLowerCase();

        let dateFilterSql = "";
        const params = [];

        if (range === "week") {
            dateFilterSql = "AND qa.finished_at >= NOW() - INTERVAL '7 days'";
        } else if (range === "month") {
            dateFilterSql = "AND qa.finished_at >= NOW() - INTERVAL '30 days'";
        } else if (range === "year") {
            dateFilterSql = "AND qa.finished_at >= NOW() - INTERVAL '365 days'";
        } else if (range === "all") {
            dateFilterSql = "";
        } else {
            return res.status(400).json({
                message: "Invalid range. Use week, month, year, or all",
            });
        }

        const result = await pool.query(
            `
            SELECT
                u.id AS user_id,
                u.email,
                COUNT(DISTINCT qa.id) AS total_quizzes,
                COUNT(aa.id) AS total_answered,
                COUNT(*) FILTER (WHERE aa.is_correct = true) AS total_correct,
                COUNT(*) FILTER (WHERE aa.is_correct = false) AS total_wrong
            FROM users u
            JOIN quiz_attempts qa
                ON qa.user_id = u.id
            LEFT JOIN attempt_answers aa
                ON aa.attempt_id = qa.id
            WHERE qa.status = 'finished'
              ${dateFilterSql}
            GROUP BY u.id, u.email
            ORDER BY
                COUNT(*) FILTER (WHERE aa.is_correct = true) DESC,
                CASE
                    WHEN COUNT(aa.id) = 0 THEN 0
                    ELSE (COUNT(*) FILTER (WHERE aa.is_correct = true)::decimal / COUNT(aa.id))
                END DESC,
                COUNT(aa.id) DESC,
                u.email ASC
            `, params);

        const items = result.rows.map((row, index) => {
            const totalQuizzes = Number(row.total_quizzes || 0);
            const totalAnswered = Number(row.total_answered || 0);
            const totalCorrect = Number(row.total_correct || 0);
            const totalWrong = Number(row.total_wrong || 0);
            const accuracy =
                totalAnswered > 0 ?
                Number(((totalCorrect / totalAnswered) * 100).toFixed(2)) :
                0;

            return {
                rank: index + 1,
                userId: row.user_id,
                email: row.email,
                totalQuizzes,
                totalAnswered,
                totalCorrect,
                totalWrong,
                accuracy,
            };
        });

        return res.json({
            ok: true,
            range,
            items,
        });
    } catch (err) {
        console.error("getLeaderboard ERROR:", err);
        return res.status(500).json({
            message: "Server error",
            error: String(err.message || err),
        });
    }
}