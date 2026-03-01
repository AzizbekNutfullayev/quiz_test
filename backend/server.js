import express from "express";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routers/auth.routes.js";
import quizRoutes from "./routers/quiz.routes.js";
import adminRoutes from "./routers/admin.routes.js";

const app = express();

app.use(express.json()); // ✅ 1
app.use(express.urlencoded({ extended: true })); // ✅ 2 (ixtiyoriy)
app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/quiz", quizRoutes);

app.listen(process.env.PORT || 5000, () => console.log("Server running"));