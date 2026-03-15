import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboard.controller.js";

const router = Router();

// hozircha public qilyapmiz
router.get("/", getLeaderboard);

export default router;