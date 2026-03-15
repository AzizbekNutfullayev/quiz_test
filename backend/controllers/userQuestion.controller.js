import { pool } from "../config/db.js";

export async function createUserQuestion(req, res) {

    try {

        const userId = req.user.id;

        const {
            questionText,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
            difficultyId
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO user_questions
            (
                user_id,
                question_text,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option,
                difficulty_id
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *
            `, [
                userId,
                questionText,
                optionA,
                optionB,
                optionC,
                optionD,
                correctOption,
                difficultyId
            ]
        );

        return res.json({
            ok: true,
            question: result.rows[0]
        });

    } catch (err) {

        console.error("createUserQuestion ERROR:", err);

        return res.status(500).json({
            message: "Server error"
        });
    }
}



export async function listMyQuestions(req, res) {

    try {

        const userId = req.user.id;

        const result = await pool.query(
            `
            SELECT *
            FROM user_questions
            WHERE user_id = $1
            ORDER BY id DESC
            `, [userId]
        );

        return res.json({
            ok: true,
            items: result.rows
        });

    } catch (err) {

        console.error("listMyQuestions ERROR:", err);

        return res.status(500).json({
            message: "Server error"
        });
    }
}



export async function updateMyQuestion(req, res) {

    try {

        const userId = req.user.id;
        const questionId = Number(req.params.id);

        const {
            questionText,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
            difficultyId,
            status
        } = req.body;

        const result = await pool.query(
            `
            UPDATE user_questions
            SET
                question_text = COALESCE($1, question_text),
                option_a = COALESCE($2, option_a),
                option_b = COALESCE($3, option_b),
                option_c = COALESCE($4, option_c),
                option_d = COALESCE($5, option_d),
                correct_option = COALESCE($6, correct_option),
                difficulty_id = COALESCE($7, difficulty_id),
                status = COALESCE($8, status)
            WHERE id = $9 AND user_id = $10
            RETURNING *
            `, [
                questionText,
                optionA,
                optionB,
                optionC,
                optionD,
                correctOption,
                difficultyId,
                status,
                questionId,
                userId
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Question not found"
            });
        }

        return res.json({
            ok: true,
            question: result.rows[0]
        });

    } catch (err) {

        console.error("updateMyQuestion ERROR:", err);

        return res.status(500).json({
            message: "Server error"
        });
    }
}

export async function deleteMyQuestion(req, res) {

    try {

        const userId = req.user.id;
        const questionId = Number(req.params.id);

        const result = await pool.query(
            `
            DELETE FROM user_questions
            WHERE id = $1 AND user_id = $2
            RETURNING id
            `, [questionId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Question not found"
            });
        }

        return res.json({
            ok: true,
            message: "Question deleted"
        });

    } catch (err) {

        console.error("deleteMyQuestion ERROR:", err);

        return res.status(500).json({
            message: "Server error"
        });
    }
}