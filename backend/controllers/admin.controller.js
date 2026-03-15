import { pool } from "../config/db.js";
import { z } from "zod";

/* =========================
   CATEGORIES
========================= */

const CategorySchema = z.object({
    name: z.string().trim().min(1).max(100),
});

export async function adminCreateCategory(req, res) {
    try {
        const parsed = CategorySchema.safeParse(req.body || {});
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
        }

        const r = await pool.query(
            "INSERT INTO categories(name) VALUES($1) RETURNING id, name", [parsed.data.name]
        );

        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminCreateCategory ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminListCategories(req, res) {
    try {
        const r = await pool.query("SELECT id, name FROM categories ORDER BY id ASC");
        return res.json({ ok: true, items: r.rows });
    } catch (err) {
        console.error("adminListCategories ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminUpdateCategory(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

        const parsed = CategorySchema.safeParse(req.body || {});
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
        }

        const r = await pool.query(
            "UPDATE categories SET name=$2 WHERE id=$1 RETURNING id, name", [id, parsed.data.name]
        );

        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });
        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminUpdateCategory ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminDeleteCategory(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const r = await pool.query(
            "UPDATE categories SET status='inactive' WHERE id=$1 RETURNING id, name, status", [id]
        );

        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });

        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminDeleteCategory (soft) ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
/* =========================
   SUBCATEGORIES
========================= */

const SubcategorySchema = z.object({
    categoryId: z.number().int().positive(),
    name: z.string().trim().min(1).max(100),
});

export async function adminCreateSubcategory(req, res) {
    try {
        const parsed = SubcategorySchema.safeParse({
            categoryId: Number(req.body && req.body.categoryId),
            name: req.body && req.body.name,
        });

        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
        }

        const cat = await pool.query("SELECT id FROM categories WHERE id=$1", [parsed.data.categoryId]);
        if (cat.rowCount === 0) return res.status(400).json({ message: "Category not found" });

        const r = await pool.query(
            "INSERT INTO subcategories(category_id, name) VALUES($1,$2) RETURNING id, category_id, name", [parsed.data.categoryId, parsed.data.name]
        );

        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminCreateSubcategory ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminListSubcategories(req, res) {
    try {
        const categoryId = req.query && req.query.categoryId !== undefined ? Number(req.query.categoryId) : null;

        if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
            return res.status(400).json({ message: "Invalid categoryId" });
        }

        const r = categoryId === null ?
            await pool.query("SELECT id, category_id, name FROM subcategories ORDER BY id ASC") :
            await pool.query(
                "SELECT id, category_id, name FROM subcategories WHERE category_id=$1 ORDER BY id ASC", [categoryId]
            );

        return res.json({ ok: true, items: r.rows });
    } catch (err) {
        console.error("adminListSubcategories ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminUpdateSubcategory(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

        const parsed = z.object({ name: z.string().trim().min(1).max(100) }).safeParse(req.body || {});
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
        }

        const r = await pool.query(
            "UPDATE subcategories SET name=$2 WHERE id=$1 RETURNING id, category_id, name", [id, parsed.data.name]
        );

        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });
        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminUpdateSubcategory ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminDeleteSubcategory(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const r = await pool.query(
            "UPDATE subcategories SET status='inactive' WHERE id=$1 RETURNING id, category_id, name, status", [id]
        );

        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });

        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminDeleteSubcategory (soft) ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
/* =========================
   QUESTIONS
========================= */

const QuestionSchema = z.object({
    categoryId: z.number().int().positive(),
    subcategoryId: z.number().int().positive().optional().nullable(),
    difficultyId: z.number().int().positive(),
    questionText: z.string().trim().min(5),
    optionA: z.string().trim().min(1),
    optionB: z.string().trim().min(1),
    optionC: z.string().trim().min(1),
    optionD: z.string().trim().min(1),
    correctOption: z.enum(["A", "B", "C", "D"]),
    imageUrl: z.string().trim().url().optional().nullable(),
    status: z.enum(["active", "inactive"]).optional().default("active"),
});

export async function adminCreateQuestion(req, res) {
    try {
        const parsed = QuestionSchema.safeParse({
            categoryId: Number(req.body && req.body.categoryId),
            subcategoryId: req.body && (req.body.subcategoryId === undefined || req.body.subcategoryId === null) ?
                null : Number(req.body && req.body.subcategoryId),
            difficultyId: Number(req.body && req.body.difficultyId),
            questionText: req.body && req.body.questionText,
            optionA: req.body && req.body.optionA,
            optionB: req.body && req.body.optionB,
            optionC: req.body && req.body.optionC,
            optionD: req.body && req.body.optionD,
            correctOption: req.body && req.body.correctOption,
            imageUrl: req.body && req.body.imageUrl !== undefined ? req.body.imageUrl : null,
            status: req.body && req.body.status,
        });

        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
        }

        const d = parsed.data;

        const r = await pool.query(
            "INSERT INTO questions(category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, image_url, status) " +
            "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id", [
                d.categoryId,
                d.subcategoryId,
                d.difficultyId,
                d.questionText,
                d.optionA,
                d.optionB,
                d.optionC,
                d.optionD,
                d.correctOption,
                d.imageUrl,
                d.status,
            ]
        );

        return res.json({ ok: true, id: r.rows[0].id });
    } catch (err) {
        console.error("adminCreateQuestion ERROR:", err);
        return res.status(500).json({ message: "Server error", error: String(err.message || err) });
    }
}

export async function adminListQuestions(req, res) {
    try {
        const q = req.query || {};
        const where = [];
        const params = [];
        let idx = 1;

        if (q.categoryId) {
            where.push("category_id=$" + idx++);
            params.push(Number(q.categoryId));
        }
        if (q.subcategoryId) {
            where.push("subcategory_id=$" + idx++);
            params.push(Number(q.subcategoryId));
        }
        if (q.difficultyId) {
            where.push("difficulty_id=$" + idx++);
            params.push(Number(q.difficultyId));
        }
        if (q.status) {
            where.push("status=$" + idx++);
            params.push(String(q.status));
        }

        const sql =
            "SELECT id, category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, image_url, status " +
            "FROM questions " +
            (where.length ? "WHERE " + where.join(" AND ") + " " : "") +
            "ORDER BY id DESC LIMIT 200";

        const r = await pool.query(sql, params);
        return res.json({ ok: true, items: r.rows });
    } catch (err) {
        console.error("adminListQuestions ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminUpdateQuestion(req, res) {
    // hozircha shart emas — keyin qo‘shamiz
    return res.status(501).json({ message: "Not implemented yet" });
}

export async function adminToggleQuestionStatus(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

        const r = await pool.query(
            "UPDATE questions SET status = CASE WHEN status='active' THEN 'inactive' ELSE 'active' END WHERE id=$1 RETURNING id, status", [id]
        );

        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });
        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminToggleQuestionStatus ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminDeleteQuestion(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

        const r = await pool.query("DELETE FROM questions WHERE id=$1 RETURNING id", [id]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });

        return res.json({ ok: true });
    } catch (err) {
        console.error("adminDeleteQuestion ERROR:", err);
        return res.status(500).json({ message: "Server error", error: String(err.message || err) });
    }
}
export async function adminBanUser(req, res) {
    try {
        const userId = String(req.params.userId || "").trim();
        if (!userId) return res.status(400).json({ message: "Invalid userId" });

        const r = await pool.query(
            "UPDATE users SET is_banned=true WHERE id=$1 RETURNING id, is_banned", [userId]
        );

        if (r.rowCount === 0) return res.status(404).json({ message: "User not found" });
        return res.json({ ok: true, user: r.rows[0] });
    } catch (err) {
        console.error("adminBanUser ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminUnbanUser(req, res) {
    try {
        const userId = String(req.params.userId || "").trim();
        if (!userId) return res.status(400).json({ message: "Invalid userId" });

        const r = await pool.query(
            "UPDATE users SET is_banned=false WHERE id=$1 RETURNING id, is_banned", [userId]
        );

        if (r.rowCount === 0) return res.status(404).json({ message: "User not found" });
        return res.json({ ok: true, user: r.rows[0] });
    } catch (err) {
        console.error("adminUnbanUser ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}




export async function adminGrantPremium(req, res) {
    const client = await pool.connect();

    try {
        const userId = String(req.params.userId || "").trim();
        const planId = Number(req.body && req.body.planId);

        if (!userId) {
            return res.status(400).json({ message: "Invalid userId" });
        }

        if (!Number.isInteger(planId) || planId <= 0) {
            return res.status(400).json({ message: "Invalid planId" });
        }

        await client.query("BEGIN");

        const userRes = await client.query(
            `SELECT id, email, premium_expires_at FROM users WHERE id=$1 LIMIT 1`, [userId]
        );

        if (userRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "User not found" });
        }

        const planRes = await client.query(
            `SELECT id, name, duration_days, price, currency
             FROM plans
             WHERE id=$1 AND is_active=TRUE
             LIMIT 1`, [planId]
        );

        if (planRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Plan not found" });
        }

        const user = userRes.rows[0];
        const plan = planRes.rows[0];

        const paymentRes = await client.query(
            `
            INSERT INTO payments (
                user_id,
                plan_id,
                amount,
                currency,
                provider,
                status,
                notes,
                paid_at
            )
            VALUES ($1, $2, $3, $4, 'manual', 'paid', 'Granted manually by admin', NOW())
            RETURNING id
            `, [userId, plan.id, plan.price, plan.currency]
        );

        const paymentId = paymentRes.rows[0].id;

        let startsAt;

        if (user.premium_expires_at && new Date(user.premium_expires_at) > new Date()) {
            startsAt = new Date(user.premium_expires_at);
        } else {
            startsAt = new Date();
        }

        const endsAtRes = await client.query(
            `SELECT ($1::timestamp + ($2 || ' days')::interval) AS ends_at`, [startsAt.toISOString(), plan.duration_days]
        );

        const endsAt = endsAtRes.rows[0].ends_at;

        await client.query(
            `
            INSERT INTO subscriptions (
                user_id,
                plan_id,
                payment_id,
                starts_at,
                ends_at,
                status
            )
            VALUES ($1, $2, $3, $4, $5, 'active')
            `, [userId, plan.id, paymentId, startsAt.toISOString(), endsAt]
        );

        await client.query(
            `
            UPDATE users
            SET premium_expires_at = $2
            WHERE id = $1
            `, [userId, endsAt]
        );

        await client.query("COMMIT");

        return res.json({
            ok: true,
            message: "Premium granted successfully",
            data: {
                userId,
                planId: plan.id,
                planName: plan.name,
                durationDays: plan.duration_days,
                premiumExpiresAt: endsAt,
            },
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("adminGrantPremium ERROR:", err);
        return res.status(500).json({
            message: "Server error",
            error: String(err.message || err),
        });
    } finally {
        client.release();
    }
}



export async function adminRemovePremium(req, res) {
    const client = await pool.connect();

    try {
        const userId = String(req.params.userId || "").trim();

        if (!userId) {
            return res.status(400).json({ message: "Invalid userId" });
        }

        await client.query("BEGIN");

        const userRes = await client.query(
            `SELECT id FROM users WHERE id=$1 LIMIT 1`, [userId]
        );

        if (userRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "User not found" });
        }

        await client.query(
            `UPDATE users SET premium_expires_at = NULL WHERE id = $1`, [userId]
        );

        await client.query(
            `
            UPDATE subscriptions
            SET status = 'cancelled'
            WHERE user_id = $1 AND status = 'active'
            `, [userId]
        );

        await client.query("COMMIT");

        return res.json({
            ok: true,
            message: "Premium removed successfully",
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("adminRemovePremium ERROR:", err);
        return res.status(500).json({
            message: "Server error",
            error: String(err.message || err),
        });
    } finally {
        client.release();
    }
}