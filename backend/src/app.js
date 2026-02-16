import express from "express";
import cors from "cors";

import authRoutes from "./routers/auth.routes.js";
import quizRoutes from "./routers/quiz.routes.js";
import adminRoutes from "./routers/admin.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ status: "API working" });
});

app.use("/auth", authRoutes);
app.use("/quiz", quizRoutes);
app.use("/admin", adminRoutes);

export default app;