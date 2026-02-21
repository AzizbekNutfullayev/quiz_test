import { Router } from "express";
import { startQuiz } from "../controllers/quiz.controller.js";
import { auth } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/start", auth, startQuiz);

router.get("/me", authMiddleware, (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user
    });
});

router.post("/start", authMiddleware, startQuiz);

export default router;