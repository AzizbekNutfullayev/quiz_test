import { Router } from "express";
import { requestOtp, verifyOtp } from "../controllers/auth.controller.js";

const router = Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.get("/ping", (req, res) => res.json({ ok: true }));


export default router;