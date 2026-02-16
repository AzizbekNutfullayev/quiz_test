import { Router } from "express";
import { startQuiz } from "../controllers/quiz.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/start", auth, startQuiz);

export default router;