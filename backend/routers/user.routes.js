import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getMyStats } from "../controllers/user.controller.js";

const router = Router();

// hamma user route protected
router.use(authMiddleware);

// user stats
router.get("/me/stats", getMyStats);

router.get("/me/profile", (req, res) => {
    return res.json({
        ok: true,
        user: req.user,
    });
});
export default router;