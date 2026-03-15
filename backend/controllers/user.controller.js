import { pool } from "../config/db.js";

export async function getMyStats(req, res) {
    try {
        const userId = req.user && req.user.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // =========================
        // SUMMARY
        // =========================
        const summaryRes = await pool.query(
            `
            SELECT
                COUNT(DISTINCT qa.id) AS total_quizzes,
                COUNT(aa.id) AS total_answered,
                COUNT(*) FILTER (WHERE aa.is_correct = true) AS total_correct,
                COUNT(*) FILTER (WHERE aa.is_correct = false) AS total_wrong
            FROM quiz_attempts qa
            LEFT JOIN attempt_answers aa
                ON aa.attempt_id = qa.id
            WHERE qa.user_id = $1
              AND qa.status = 'finished'
            `, [userId]
        );

        const summaryRow = summaryRes.rows[0] || {};

        const totalQuizzes = Number(summaryRow.total_quizzes || 0);
        const totalAnswered = Number(summaryRow.total_answered || 0);
        const totalCorrect = Number(summaryRow.total_correct || 0);
        const totalWrong = Number(summaryRow.total_wrong || 0);
        const accuracy =
            totalAnswered > 0 ?
            Number(((totalCorrect / totalAnswered) * 100).toFixed(2)) :
            0;

        // =========================
        // CATEGORY BREAKDOWN
        // =========================
        const categoryRes = await pool.query(
            `
            SELECT
                c.id AS category_id,
                c.name AS category_name,
                COUNT(aa.id) AS answered,
                COUNT(*) FILTER (WHERE aa.is_correct = true) AS correct,
                COUNT(*) FILTER (WHERE aa.is_correct = false) AS wrong
            FROM quiz_attempts qa
            JOIN categories c
                ON c.id = qa.category_id
            LEFT JOIN attempt_answers aa
                ON aa.attempt_id = qa.id
            WHERE qa.user_id = $1
              AND qa.status = 'finished'
            GROUP BY c.id, c.name
            ORDER BY correct DESC, answered DESC, c.name ASC
            `, [userId]
        );

        const byCategory = categoryRes.rows.map((row) => {
            const answered = Number(row.answered || 0);
            const correct = Number(row.correct || 0);
            const wrong = Number(row.wrong || 0);

            return {
                categoryId: Number(row.category_id),
                categoryName: row.category_name,
                answered,
                correct,
                wrong,
                accuracy: answered > 0 ?
                    Number(((correct / answered) * 100).toFixed(2)) :
                    0,
            };
        });

        // =========================
        // DIFFICULTY BREAKDOWN
        // =========================
        const difficultyRes = await pool.query(
            `
            SELECT
                d.id AS difficulty_id,
                d.name AS difficulty_name,
                COUNT(aa.id) AS answered,
                COUNT(*) FILTER (WHERE aa.is_correct = true) AS correct,
                COUNT(*) FILTER (WHERE aa.is_correct = false) AS wrong
            FROM quiz_attempts qa
            JOIN difficulties d
                ON d.id = qa.difficulty_id
            LEFT JOIN attempt_answers aa
                ON aa.attempt_id = qa.id
            WHERE qa.user_id = $1
              AND qa.status = 'finished'
            GROUP BY d.id, d.name
            ORDER BY d.id ASC
            `, [userId]
        );

        const byDifficulty = difficultyRes.rows.map((row) => {
            const answered = Number(row.answered || 0);
            const correct = Number(row.correct || 0);
            const wrong = Number(row.wrong || 0);

            return {
                difficultyId: Number(row.difficulty_id),
                difficultyName: row.difficulty_name,
                answered,
                correct,
                wrong,
                accuracy: answered > 0 ?
                    Number(((correct / answered) * 100).toFixed(2)) :
                    0,
            };
        });

        // =========================
        // RECENT ATTEMPTS
        // =========================
        const recentRes = await pool.query(
            `
            SELECT
                qa.id AS attempt_id,
                c.name AS category_name,
                d.name AS difficulty_name,
                qa.total_questions,
                qa.finished_at,
                COUNT(aa.id) AS answered,
                COUNT(*) FILTER (WHERE aa.is_correct = true) AS correct,
                COUNT(*) FILTER (WHERE aa.is_correct = false) AS wrong
            FROM quiz_attempts qa
            JOIN categories c
                ON c.id = qa.category_id
            JOIN difficulties d
                ON d.id = qa.difficulty_id
            LEFT JOIN attempt_answers aa
                ON aa.attempt_id = qa.id
            WHERE qa.user_id = $1
              AND qa.status = 'finished'
            GROUP BY qa.id, c.name, d.name, qa.total_questions, qa.finished_at
            ORDER BY qa.finished_at DESC NULLS LAST
            LIMIT 10
            `, [userId]
        );

        const recentAttempts = recentRes.rows.map((row) => {
            const answered = Number(row.answered || 0);
            const correct = Number(row.correct || 0);
            const wrong = Number(row.wrong || 0);

            return {
                attemptId: Number(row.attempt_id),
                categoryName: row.category_name,
                difficultyName: row.difficulty_name,
                totalQuestions: Number(row.total_questions || 0),
                answered,
                correct,
                wrong,
                accuracy: answered > 0 ?
                    Number(((correct / answered) * 100).toFixed(2)) :
                    0,
                finishedAt: row.finished_at,
            };
        });

        return res.json({
            ok: true,
            summary: {
                totalQuizzes,
                totalAnswered,
                totalCorrect,
                totalWrong,
                accuracy,
            },
            byCategory,
            byDifficulty,
            recentAttempts,
        });
    } catch (err) {
        console.error("getMyStats ERROR:", err);
        return res.status(500).json({
            message: "Server error",
            error: String(err.message || err),
        });
    }
}