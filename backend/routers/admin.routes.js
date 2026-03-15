// backend/routers/admin.routes.js
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

import {
    adminCreateCategory,
    adminListCategories,
    adminUpdateCategory,
    adminDeleteCategory,
    adminGrantPremium,
    adminRemovePremium,

    adminCreateSubcategory,
    adminListSubcategories,
    adminUpdateSubcategory,
    adminDeleteSubcategory,

    adminCreateQuestion,
    adminListQuestions,
    adminToggleQuestionStatus,
    adminDeleteQuestion,

    adminBanUser,
    adminUnbanUser,
} from "../controllers/admin.controller.js";

const router = Router();

/* =========================
   DIAGNOSTIKA (TEMP)
========================= */
console.log("authMiddleware:", typeof authMiddleware);
console.log("requireRole:", typeof requireRole);
try {
    console.log("requireRole('admin'):", typeof requireRole("admin"));
} catch (e) {
    console.error("requireRole('admin') call error:", e);
}

/* =========================
   PROTECTION
========================= */
// himoya: avval token, keyin role
router.use(authMiddleware);
router.use(requireRole("admin"));

/* =========================
   CATEGORIES
========================= */
router.get("/categories", adminListCategories);
router.post("/categories", adminCreateCategory);
router.patch("/categories/:id", adminUpdateCategory);
router.delete("/categories/:id", adminDeleteCategory);


router.post("/users/:userId/grant-premium", adminGrantPremium);
router.post("/users/:userId/remove-premium", adminRemovePremium);
/* =========================
   SUBCATEGORIES
========================= */
router.get("/subcategories", adminListSubcategories);
router.post("/subcategories", adminCreateSubcategory);
router.patch("/subcategories/:id", adminUpdateSubcategory);
router.delete("/subcategories/:id", adminDeleteSubcategory);

/* =========================
   QUESTIONS
========================= */
router.get("/questions", adminListQuestions);
router.post("/questions", adminCreateQuestion);
router.patch("/questions/:id/toggle-status", adminToggleQuestionStatus);
router.delete("/questions/:id", adminDeleteQuestion);

/* =========================
   USERS (BAN / UNBAN)
========================= */
router.post("/users/:userId/ban", adminBanUser);
router.post("/users/:userId/unban", adminUnbanUser);

export default router;