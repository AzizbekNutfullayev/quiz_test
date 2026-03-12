import express from "express";
import "dotenv/config";

import authRoutes from "./routers/auth.routes.js";
import quizRoutes from "./routers/quiz.routes.js";
import adminRoutes from "./routers/admin.routes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ ok: true, message: "Quiz Platform API is running" });
});
app.use(express.json()); // ✅ 1
app.use(express.urlencoded({ extended: true })); // ✅ 2 (ixtiyoriy)
app.use("/auth", authRoutes);
app.use("/quiz", quizRoutes);
app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});