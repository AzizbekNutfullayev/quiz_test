import { pool } from "../config/db.js";
import { z } from "zod";

/* =========================
   START QUIZ
========================= */

const StartQuizSchema = z.object({
    categoryId: z.number().int().positive(),
    subcategoryId: z.number().int().positive().optional().nullable(),
    difficultyId: z.number().int().positive(),
    count: z.enum(["10", "20", "30", "50"]).transform(function(v) {
        return Number(v);
    }),
    timePerQuestionSec: z.number().int().min(10).max(300).optional().default(60),
});

export async function startQuiz(req, res) {
    console.log("=== /quiz/start called ===");

    var userId = null;
    if (req && req.user && req.user.userId) {
        userId = req.user.userId;
    }

    if (!userId) {
        console.log("startQuiz: Unauthorized (no userId)");
        return res.status(401).json({ message: "Unauthorized" });
    }

    var body = req && req.body ? req.body : {};

    var parsed = StartQuizSchema.safeParse({
        categoryId: Number(body.categoryId),
        subcategoryId: body.subcategoryId === undefined || body.subcategoryId === null ?
            null : Number(body.subcategoryId),
        difficultyId: Number(body.difficultyId),
        count: String(body.count),
        timePerQuestionSec: body.timePerQuestionSec === undefined ? undefined : Number(body.timePerQuestionSec),
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

    console.log("startQuiz payload:", {
        userId: userId,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        difficultyId: difficultyId,
        count: count,
        timePerQuestionSec: timePerQuestionSec,
    });

    var client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1) Random questions select (param index safe)
        var params = [categoryId, difficultyId];
        var query =
            "SELECT id FROM questions WHERE status='active' AND category_id=$1 AND difficulty_id=$2";

        if (subcategoryId !== null) {
            params.push(subcategoryId);
            query += " AND subcategory_id=$" + params.length;
        }

        params.push(count);
        query += " ORDER BY RANDOM() LIMIT $" + params.length;

        console.log("startQuiz questions query:", query);
        console.log("startQuiz questions params:", params);

        var questionsRes = await client.query(query, params);

        console.log("startQuiz picked count:", questionsRes.rowCount);

        if (questionsRes.rowCount < count) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Not enough questions for this filter",
                needed: count,
                found: questionsRes.rowCount,
            });
        }

        var pickedIds = questionsRes.rows.map(function(r) {
            return r.id;
        });

        // 2) attempt create
        // 2) attempt yaratamiz (quiz_id platform uchun NULL)
        var attemptRes = await client.query(
            `
    INSERT INTO quiz_attempts(
      user_id,
      category_id, subcategory_id, difficulty_id,
      quiz_id,
      question_count,
      points,
      started_at,
      finished_at,
      total_correct,
      total_wrong,
      status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,now(),NULL,0,0,$8)
    RETURNING id, started_at
    `, [
                userId,
                categoryId,
                subcategoryId, // null bo‘lishi mumkin
                difficultyId,
                null, // quiz_id (platform quiz => NULL)
                count,
                0, // points hozircha 0
                "active"
            ]
        );

        var attemptId = attemptRes.rows[0].id;
        console.log("startQuiz attemptId:", attemptId);

        // 3) snapshot insert
        var values = [];
        var insertParams = [];
        var idx = 1;

        for (var i = 0; i < pickedIds.length; i++) {
            values.push("($" + idx++ + ", $" + idx++ + ", $" + idx++ + ")");
            insertParams.push(attemptId, i + 1, pickedIds[i]);
        }

        var insertQuery =
            "INSERT INTO quiz_attempt_questions(attempt_id, order_index, platform_question_id) VALUES " +
            values.join(",");

        console.log("startQuiz snapshot insert (first 150 chars):", insertQuery.slice(0, 150) + "...");
        console.log("startQuiz snapshot params length:", insertParams.length);

        await client.query(insertQuery, insertParams);

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
        return res.status(500).json({ message: "Server error", error: String(err.message || err) });
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
    if (req && req.user && req.user.userId) {
        userId = req.user.userId;
    }

    var attemptId = Number(req && req.params ? req.params.attemptId : NaN);

    console.log("getAttemptQuestions attemptId:", attemptId, "userId:", userId);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!Number.isInteger(attemptId) || attemptId <= 0)
        return res.status(400).json({ message: "Invalid attemptId" });

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
        aq.order_index,
        q.id as question_id,
        q.question_text,
        q.option_a, q.option_b, q.option_c, q.option_d,
        q.image_url
      FROM quiz_attempt_questions aq
      JOIN questions q ON q.id = aq.platform_question_id
      WHERE aq.attempt_id = $1
      ORDER BY aq.order_index ASC
      `, [attemptId]
        );

        console.log("getAttemptQuestions questions count:", rows.rowCount);

        return res.json({
            attemptId: attemptId,
            questions: rows.rows,
        });
    } catch (err) {
        console.error("getAttemptQuestions ERROR:", err);
        return res.status(500).json({ message: "Server error", error: String(err.message || err) });
    }
}

/* =========================
   SUBMIT ANSWER
========================= */

const AnswerSchema = z.object({
    orderIndex: z.number().int().positive(),
    selectedOption: z.enum(["A", "B", "C", "D"]),
    timeTakenSec: z.number().int().min(0).max(3600).optional(),
});

export async function submitAnswer(req, res) {
    console.log("=== /quiz/attempts/:attemptId/answer called ===");

    var userId = null;
    if (req && req.user && req.user.userId) {
        userId = req.user.userId;
    }

    var attemptId = Number(req && req.params ? req.params.attemptId : NaN);

    if (!userId) {
        console.log("submitAnswer: Unauthorized");
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(attemptId) || attemptId <= 0) {
        console.log("submitAnswer: Invalid attemptId:", attemptId);
        return res.status(400).json({ message: "Invalid attemptId" });
    }

    var parsed = AnswerSchema.safeParse({
        orderIndex: Number(req.body ? req.body.orderIndex : NaN),
        selectedOption: req.body ? req.body.selectedOption : undefined,
        timeTakenSec: req.body && req.body.timeTakenSec !== undefined ? Number(req.body.timeTakenSec) : undefined,
    });

    if (!parsed.success) {
        console.log("submitAnswer: Invalid input", parsed.error.issues);
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
    }

    var orderIndex = parsed.data.orderIndex;
    var selectedOption = parsed.data.selectedOption;
    var timeTakenSec = parsed.data.timeTakenSec;

    console.log("submitAnswer payload:", {
        userId: userId,
        attemptId: attemptId,
        orderIndex: orderIndex,
        selectedOption: selectedOption,
        timeTakenSec: timeTakenSec,
    });

    var client = await pool.connect();
    try {
        await client.query("BEGIN");

        // attempt check
        var attemptRes = await client.query(
            "SELECT id, status FROM quiz_attempts WHERE id=$1 AND user_id=$2 LIMIT 1", [attemptId, userId]
        );

        if (attemptRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Attempt not found" });
        }

        if (attemptRes.rows[0].status !== "active") {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Attempt is not active" });
        }

        // duplicate check (unique constraint ham bor)
        var already = await client.query(
            "SELECT id FROM quiz_attempt_answers WHERE attempt_id=$1 AND order_index=$2 LIMIT 1", [attemptId, orderIndex]
        );

        if (already.rowCount > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Already answered" });
        }

        // correct option
        var qRes = await client.query(
            `
      SELECT q.correct_option
      FROM quiz_attempt_questions aq
      JOIN questions q ON q.id = aq.platform_question_id
      WHERE aq.attempt_id=$1 AND aq.order_index=$2
      LIMIT 1
      `, [attemptId, orderIndex]
        );

        if (qRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Question not found in this attempt" });
        }

        var correctOption = String(qRes.rows[0].correct_option).toUpperCase();
        var isCorrect = correctOption === selectedOption;

        // insert answer
        await client.query(
            `
      INSERT INTO quiz_attempt_answers(attempt_id, order_index, selected_option, is_correct, time_taken_sec)
      VALUES($1,$2,$3,$4,$5)
      `, [attemptId, orderIndex, selectedOption, isCorrect, timeTakenSec === undefined ? null : timeTakenSec]
        );

        await client.query("COMMIT");

        return res.json({
            ok: true,
            attemptId: attemptId,
            orderIndex: orderIndex,
            selectedOption: selectedOption,
            isCorrect: isCorrect,
            message: "Answer saved",
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("submitAnswer ERROR:", err);
        return res.status(500).json({ message: "Server error", error: String(err.message || err) });
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
    if (req && req.user && req.user.userId) {
        userId = req.user.userId;
    }

    var attemptId = Number(req && req.params ? req.params.attemptId : NaN);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!Number.isInteger(attemptId) || attemptId <= 0)
        return res.status(400).json({ message: "Invalid attemptId" });

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

        if (attemptRes.rows[0].status !== "active") {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Attempt is not active" });
        }

        var statsRes = await client.query(
            `
      SELECT
        COUNT(*) FILTER (WHERE is_correct=true)  AS total_correct,
        COUNT(*) FILTER (WHERE is_correct=false) AS total_wrong,
        COUNT(*) AS answered
      FROM quiz_attempt_answers
      WHERE attempt_id=$1
      `, [attemptId]
        );

        var totalCorrect = Number(statsRes.rows[0].total_correct || 0);
        var totalWrong = Number(statsRes.rows[0].total_wrong || 0);
        var answered = Number(statsRes.rows[0].answered || 0);

        await client.query(
            `
      UPDATE quiz_attempts
      SET status='finished',
          finished_at=now(),
          total_correct=$2,
          total_wrong=$3
      WHERE id=$1
      `, [attemptId, totalCorrect, totalWrong]
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
        return res.status(500).json({ message: "Server error", error: String(err.message || err) });
    } finally {
        client.release();
    }
}