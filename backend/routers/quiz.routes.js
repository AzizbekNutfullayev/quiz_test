import { Router } from "express";
import {
    startQuiz,
    getAttemptQuestions,
    submitAnswer,
    finishAttempt,
} from "../controllers/quiz.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// barcha quiz route'lar protected
router.use(authMiddleware);

router.get("/me", function(req, res) {
    res.json({
        message: "You are authenticated",
        user: req.user,
    });
});

router.post("/start", startQuiz);
router.get("/attempts/:attemptId/questions", getAttemptQuestions);
router.post("/attempts/:attemptId/answer", submitAnswer);
router.post("/attempts/:attemptId/finish", finishAttempt);

export default router;