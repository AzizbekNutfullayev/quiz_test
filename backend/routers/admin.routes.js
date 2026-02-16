import { Router } from "express";
import { addQuestion } from "../controllers/admin.controller.js";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = Router();

router.post("/questions", auth, adminOnly, addQuestion);

export default router;