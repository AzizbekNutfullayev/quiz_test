import { Router } from "express";
import {
    startQuiz,
    getAttemptQuestions,
    submitAnswer,
    finishAttempt,
} from "../controllers/quiz.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/me", authMiddleware, function(req, res) {
    res.json({
        message: "You are authenticated",
        user: req.user,
    });
});

router.post("/start", authMiddleware, startQuiz);
router.get("/attempts/:attemptId/questions", authMiddleware, getAttemptQuestions);

router.post("/attempts/:attemptId/answer", authMiddleware, submitAnswer);
router.post("/attempts/:attemptId/finish", authMiddleware, finishAttempt);

export default router;