import { pool } from "../config/db.js";
import { z } from "zod";

/* =========================
   SCHEMAS
========================= */

const StartQuizSchema = z.object({
    categoryId: z.number().int().positive(),
    subcategoryId: z.number().int().positive().nullable().optional(),
    difficultyId: z.number().int().positive(),
    count: z.number().int().refine(function(v) {
        return v === 10 || v === 20 || v === 30 || v === 50;
    }, {
        message: "count must be 10, 20, 30, or 50"
    }),
    timePerQuestionSec: z.number().int().min(10).max(300).optional().default(60),
});

const AnswerSchema = z.object({
    orderIndex: z.number().int().positive(),
    selectedOption: z.enum(["A", "B", "C", "D"]),
    timeTakenSec: z.number().int().min(0).max(3600).optional(),
});

/* =========================
   START QUIZ
========================= */

export async function startQuiz(req, res) {
    console.log("=== /quiz/start called ===");

    var userId = null;
    if (req && req.user && req.user.id) {
        userId = req.user.id;
    }

    if (!userId) {
        console.log("startQuiz: Unauthorized (no user id)");
        return res.status(401).json({ message: "Unauthorized" });
    }

    var body = req && req.body ? req.body : {};

    var parsed = StartQuizSchema.safeParse({
        categoryId: Number(body.categoryId),
        subcategoryId: body.subcategoryId === undefined || body.subcategoryId === null ?
            null : Number(body.subcategoryId),
        difficultyId: Number(body.difficultyId),
        count: Number(body.count),
        timePerQuestionSec: body.timePerQuestionSec === undefined ?
            undefined : Number(body.timePerQuestionSec),
    });

    if (!parsed.success) {
        console.log("startQuiz: Invalid input", parsed.error.issues);
        return res.status(400).json({
            message: "Invalid input",
            errors: parsed.error.issues,
        });
    }

    var categoryId = parsed.data.categoryId;
    var subcategoryId = parsed.data.subcategoryId;
    var difficultyId = parsed.data.difficultyId;
    var count = parsed.data.count;
    var timePerQuestionSec = parsed.data.timePerQuestionSec;

    var client = await pool.connect();

    try {
        await client.query("BEGIN");

        var params = [categoryId, difficultyId];
        var query =
            "SELECT id, question_text, option_a, option_b, option_c, option_d, image_url, correct_option " +
            "FROM questions " +
            "WHERE status='active' AND category_id=$1 AND difficulty_id=$2";

        if (subcategoryId !== null) {
            params.push(subcategoryId);
            query += " AND subcategory_id=$" + params.length;
        }

        params.push(count);
        query += " ORDER BY RANDOM() LIMIT $" + params.length;

        var questionsRes = await client.query(query, params);

        if (questionsRes.rowCount < count) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Not enough questions for this filter",
                needed: count,
                found: questionsRes.rowCount,
            });
        }

        var attemptRes = await client.query(
            `
      INSERT INTO quiz_attempts (
        user_id,
        category_id,
        subcategory_id,
        difficulty_id,
        total_questions,
        time_per_question_sec,
        status,
        started_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'in_progress', NOW())
      RETURNING id
      `, [userId, categoryId, subcategoryId, difficultyId, count, timePerQuestionSec]
        );

        var attemptId = attemptRes.rows[0].id;

        for (var i = 0; i < questionsRes.rows.length; i++) {
            var q = questionsRes.rows[i];

            await client.query(
                `
        INSERT INTO attempt_questions (
          attempt_id,
          order_index,
          question_id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          image_url,
          correct_option
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `, [
                    attemptId,
                    i + 1,
                    q.id,
                    q.question_text,
                    q.option_a,
                    q.option_b,
                    q.option_c,
                    q.option_d,
                    q.image_url,
                    q.correct_option,
                ]
            );
        }

        await client.query("COMMIT");

        return res.json({
            ok: true,
            attemptId: attemptId,
            questionCount: count,
            timePerQuestionSec: timePerQuestionSec,
            message: "Quiz started",
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("startQuiz ERROR:", err);
        return res.status(500).json({
            message: "Server error",
            error: String(err.message || err),
        });
    } finally {
        client.release();
    }
}

/* =========================
   GET ATTEMPT QUESTIONS
========================= */

export async function getAttemptQuestions(req, res) {
    console.log("=== /quiz/attempts/:attemptId/questions called ===");

    var userId = null;
    if (req && req.user && req.user.id) {
        userId = req.user.id;
    }

    var attemptId = Number(req && req.params ? req.params.attemptId : NaN);

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(attemptId) || attemptId <= 0) {
        return res.status(400).json({ message: "Invalid attemptId" });
    }

    try {
        var own = await pool.query(
            "SELECT id FROM quiz_attempts WHERE id=$1 AND user_id=$2 LIMIT 1", [attemptId, userId]
        );

        if (own.rowCount === 0) {
            return res.status(404).json({ message: "Attempt not found" });
        }

        var rows = await pool.query(
            `
      SELECT
        order_index,
        question_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        image_url
      FROM attempt_questions
      WHERE attempt_id = $1
      ORDER BY order_index ASC
      `, [attemptId]
        );

        return res.json({
            attemptId: attemptId,
            questions: rows.rows,
        });
    } catch (err) {
        console.error("getAttemptQuestions ERROR:", err);
        return res.status(500).json({
            message: "Server error",
            error: String(err.message || err),
        });
    }
}

/* =========================
   SUBMIT ANSWER
========================= */

export async function submitAnswer(req, res) {
    console.log("=== /quiz/attempts/:attemptId/answer called ===");

    var userId = null;
    if (req && req.user && req.user.id) {
        userId = req.user.id;
    }

    var attemptId = Number(req && req.params ? req.params.attemptId : NaN);

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(attemptId) || attemptId <= 0) {
        return res.status(400).json({ message: "Invalid attemptId" });
    }

    var parsed = AnswerSchema.safeParse({
        orderIndex: Number(req.body ? req.body.orderIndex : NaN),
        selectedOption: req.body ? req.body.selectedOption : undefined,
        timeTakenSec: req.body && req.body.timeTakenSec !== undefined ?
            Number(req.body.timeTakenSec) : undefined,
    });

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: parsed.error.issues,
        });
    }

    var orderIndex = parsed.data.orderIndex;
    var selectedOption = parsed.data.selectedOption;
    var timeTakenSec = parsed.data.timeTakenSec;

    var client = await pool.connect();

    try {
        await client.query("BEGIN");

        var attemptRes = await client.query(
            "SELECT id, status FROM quiz_attempts WHERE id=$1 AND user_id=$2 LIMIT 1", [attemptId, userId]
        );

        if (attemptRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Attempt not found" });
        }

        if (attemptRes.rows[0].status !== "in_progress") {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Attempt is not active" });
        }

        var already = await client.query(
            "SELECT id FROM attempt_answers WHERE attempt_id=$1 AND order_index=$2 LIMIT 1", [attemptId, orderIndex]
        );

        if (already.rowCount > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Already answered" });
        }

        var qRes = await client.query(
            `
      SELECT correct_option
      FROM attempt_questions
      WHERE attempt_id=$1 AND order_index=$2
      LIMIT 1
      `, [attemptId, orderIndex]
        );

        if (qRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Question not found in this attempt" });
        }

        var correctOption = String(qRes.rows[0].correct_option).toUpperCase();
        var isCorrect = correctOption === selectedOption;

        await client.query(
            `
      INSERT INTO attempt_answers (
        attempt_id,
        order_index,
        selected_option,
        is_correct,
        time_taken_sec
      )
      VALUES ($1, $2, $3, $4, $5)
      `, [
                attemptId,
                orderIndex,
                selectedOption,
                isCorrect,
                timeTakenSec === undefined ? null : timeTakenSec,
            ]
        );

        await client.query("COMMIT");

        return res.json({
            ok: true,
            isCorrect: isCorrect,
            message: "Answer saved",
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("submitAnswer ERROR:", err);
        return res.status(500).json({
            message: "Server error",
            error: String(err.message || err),
        });
    } finally {
        client.release();
    }
}

/* =========================
   FINISH ATTEMPT
========================= */

export async function finishAttempt(req, res) {
    console.log("=== /quiz/attempts/:attemptId/finish called ===");

    var userId = null;
    if (req && req.user && req.user.id) {
        userId = req.user.id;
    }

    var attemptId = Number(req && req.params ? req.params.attemptId : NaN);

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(attemptId) || attemptId <= 0) {
        return res.status(400).json({ message: "Invalid attemptId" });
    }

    var client = await pool.connect();

    try {
        await client.query("BEGIN");

        var attemptRes = await client.query(
            "SELECT id, status FROM quiz_attempts WHERE id=$1 AND user_id=$2 LIMIT 1", [attemptId, userId]
        );

        if (attemptRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Attempt not found" });
        }

        if (attemptRes.rows[0].status !== "in_progress") {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Attempt is not active" });
        }

        var statsRes = await client.query(
            `
      SELECT
        COUNT(*) FILTER (WHERE is_correct = true) AS total_correct,
        COUNT(*) FILTER (WHERE is_correct = false) AS total_wrong,
        COUNT(*) AS answered
      FROM attempt_answers
      WHERE attempt_id = $1
      `, [attemptId]
        );

        var totalCorrect = Number(statsRes.rows[0].total_correct || 0);
        var totalWrong = Number(statsRes.rows[0].total_wrong || 0);
        var answered = Number(statsRes.rows[0].answered || 0);

        await client.query(
            `
      UPDATE quiz_attempts
      SET status='finished',
          finished_at=NOW()
      WHERE id=$1
      `, [attemptId]
        );

        await client.query("COMMIT");

        return res.json({
            ok: true,
            attemptId: attemptId,
            answered: answered,
            totalCorrect: totalCorrect,
            totalWrong: totalWrong,
            message: "Attempt finished",
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("finishAttempt ERROR:", err);
        return res.status(500).json({
            message: "Server error",
            error: String(err.message || err),
        });
    } finally {
        client.release();
    }
}