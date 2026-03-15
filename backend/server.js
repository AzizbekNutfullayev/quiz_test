import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routers/auth.routes.js";
import quizRoutes from "./routers/quiz.routes.js";
import adminRoutes from "./routers/admin.routes.js";
import userRoutes from "./routers/user.routes.js";
import leaderboardRoutes from "./routers/leaderboard.routes.js";
import userQuestionRoutes from "./routers/userQuestion.routes.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({ ok: true, message: "Quiz Platform API is running" });
});


app.use("/user", userQuestionRoutes);
app.use("/auth", authRoutes);
app.use("/quiz", quizRoutes);
app.use("/admin", adminRoutes);
app.use("/users", userRoutes);
app.use("/leaderboard", leaderboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});