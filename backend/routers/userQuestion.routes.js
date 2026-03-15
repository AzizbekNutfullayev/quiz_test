import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePremium } from "../middleware/requirePremium.js";

import {
    createUserQuestion,
    listMyQuestions,
    updateMyQuestion,
    deleteMyQuestion
} from "../controllers/userQuestion.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requirePremium);

router.post("/questions", createUserQuestion);
router.get("/questions", listMyQuestions);
router.patch("/questions/:id", updateMyQuestion);
router.delete("/questions/:id", deleteMyQuestion);

export default router;