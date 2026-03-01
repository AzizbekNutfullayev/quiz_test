// backend/controllers/admin.controller.js
import { pool } from "../config/db.js";
import { z } from "zod";

/* =========================
   CATEGORIES
========================= */

var CategorySchema = z.object({
    name: z.string().trim().min(1).max(100),
});

export async function adminListCategories(req, res) {
    try {
        var r = await pool.query("SELECT id, name FROM categories ORDER BY id ASC");
        return res.json({ ok: true, items: r.rows });
    } catch (err) {
        console.error("adminListCategories ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminCreateCategory(req, res) {
    try {
        var parsed = CategorySchema.safeParse(req.body || {});
        if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });

        var r = await pool.query("INSERT INTO categories(name) VALUES($1) RETURNING id, name", [parsed.data.name]);
        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminCreateCategory ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminUpdateCategory(req, res) {
    try {
        var id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

        var parsed = CategorySchema.safeParse(req.body || {});
        if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });

        var r = await pool.query("UPDATE categories SET name=$2 WHERE id=$1 RETURNING id, name", [id, parsed.data.name]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });

        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminUpdateCategory ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminDeleteCategory(req, res) {
    try {
        var id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

        var r = await pool.query("DELETE FROM categories WHERE id=$1 RETURNING id", [id]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });

        return res.json({ ok: true });
    } catch (err) {
        console.error("adminDeleteCategory ERROR:", err);
        // FK bo‘lsa bu yerga tushishi mumkin
        return res.status(500).json({ message: "Server error", error: String(err.message || err) });
    }
}

/* =========================
   SUBCATEGORIES
========================= */

var SubcategoryCreateSchema = z.object({
    categoryId: z.number().int().positive(),
    name: z.string().trim().min(1).max(100),
});

export async function adminListSubcategories(req, res) {
    try {
        var categoryId = req.query && req.query.categoryId !== undefined ? Number(req.query.categoryId) : null;

        if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
            return res.status(400).json({ message: "Invalid categoryId" });
        }

        var r;
        if (categoryId === null) {
            r = await pool.query("SELECT id, category_id, name FROM subcategories ORDER BY id ASC");
        } else {
            r = await pool.query(
                "SELECT id, category_id, name FROM subcategories WHERE category_id=$1 ORDER BY id ASC", [categoryId]
            );
        }

        return res.json({ ok: true, items: r.rows });
    } catch (err) {
        console.error("adminListSubcategories ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminCreateSubcategory(req, res) {
    try {
        var parsed = SubcategoryCreateSchema.safeParse({
            categoryId: Number(req.body && req.body.categoryId),
            name: req.body && req.body.name,
        });

        if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });

        // category mavjudmi
        var cat = await pool.query("SELECT id FROM categories WHERE id=$1", [parsed.data.categoryId]);
        if (cat.rowCount === 0) return res.status(400).json({ message: "Category not found" });

        var r = await pool.query(
            "INSERT INTO subcategories(category_id, name) VALUES($1,$2) RETURNING id, category_id, name", [parsed.data.categoryId, parsed.data.name]
        );

        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminCreateSubcategory ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminUpdateSubcategory(req, res) {
    try {
        var id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

        var parsed = z.object({ name: z.string().trim().min(1).max(100) }).safeParse(req.body || {});
        if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });

        var r = await pool.query("UPDATE subcategories SET name=$2 WHERE id=$1 RETURNING id, category_id, name", [
            id,
            parsed.data.name,
        ]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });

        return res.json({ ok: true, item: r.rows[0] });
    } catch (err) {
        console.error("adminUpdateSubcategory ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminDeleteSubcategory(req, res) {
    try {
        var id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

        var r = await pool.query("DELETE FROM subcategories WHERE id=$1 RETURNING id", [id]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });

        return res.json({ ok: true });
    } catch (err) {
        console.error("adminDeleteSubcategory ERROR:", err);
        return res.status(500).json({ message: "Server error", error: String(err.message || err) });
    }
}

/* =========================
   QUESTIONS
========================= */

var QuestionCreateSchema = z.object({
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

export async function adminListQuestions(req, res) {
    try {
        var where = [];
        var params = [];
        var idx = 1;

        var q = req.query || {};

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

        var sql =
            "SELECT id, category_id, subcategory_id, difficulty_id, question_text, option_a, option_b, option_c, option_d, correct_option, image_url, status " +
            "FROM questions " +
            (where.length ? "WHERE " + where.join(" AND ") + " " : "") +
            "ORDER BY id DESC LIMIT 200";

        var r = await pool.query(sql, params);
        return res.json({ ok: true, items: r.rows });
    } catch (err) {
        console.error("adminListQuestions ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function adminCreateQuestion(req, res) {
    try {
        var parsed = QuestionCreateSchema.safeParse({
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

        if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });

        var d = parsed.data;

        var r = await pool.query(
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

export async function adminToggleQuestionStatus(req, res) {
    try {
        var id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

        var r = await pool.query(
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
        var id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });

        var r = await pool.query("DELETE FROM questions WHERE id=$1 RETURNING id", [id]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });

        return res.json({ ok: true });
    } catch (err) {
        console.error("adminDeleteQuestion ERROR:", err);
        return res.status(500).json({ message: "Server error", error: String(err.message || err) });
    }
}

/* =========================
   USERS: BAN / UNBAN
========================= */

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